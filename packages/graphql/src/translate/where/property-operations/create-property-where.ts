/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { Context, PredicateReturn } from "../../../types";
import Cypher from "@neo4j/cypher-builder";
import { GraphElement, Node } from "../../../classes";
import { whereRegEx, WhereRegexGroups } from "../utils";
import mapToDbProperty from "../../../utils/map-to-db-property";
import { createGlobalNodeOperation } from "./create-global-node-operation";
// Recursive function

import { createConnectionOperation } from "./create-connection-operation";
import { createComparisonOperation } from "./create-comparison-operation";
// Recursive function

import { createRelationshipOperation } from "./create-relationship-operation";
import { aggregatePreComputedWhereFields } from "../../create-aggregate-where-and-params";

/** Translates a property into its predicate filter */
export function createPropertyWhere({
    key,
    value,
    element,
    targetElement,
    context,
}: {
    key: string;
    value: any;
    element: GraphElement;
    targetElement: Cypher.Variable;
    context: Context;
}): PredicateReturn {
    const match = whereRegEx.exec(key);
    if (!match) {
        throw new Error(`Failed to match key in filter: ${key}`);
    }

    const { prefix, fieldName, isAggregate, operator } = match?.groups as WhereRegexGroups;

    if (!fieldName) {
        throw new Error(`Failed to find field name in filter: ${key}`);
    }

    const isNot = operator?.startsWith("NOT") ?? false;

    const coalesceValue = [...element.primitiveFields, ...element.temporalFields, ...element.enumFields].find(
        (f) => fieldName === f.fieldName
    )?.coalesceValue as string | undefined;

    let dbFieldName = mapToDbProperty(element, fieldName);
    if (prefix) {
        dbFieldName = `${prefix}${dbFieldName}`;
    }

    let propertyRef: Cypher.PropertyRef | Cypher.Function = targetElement.property(dbFieldName);

    if (element instanceof Node) {
        const node = element;
        if (node.isGlobalNode && key === "id") {
            return {
                predicate: createGlobalNodeOperation({
                    node,
                    value,
                    targetElement,
                    coalesceValue,
                }),
            };
        }

        if (coalesceValue) {
            propertyRef = Cypher.coalesce(
                propertyRef,
                new Cypher.RawCypher(`${coalesceValue}`) // TODO: move into Cypher.literal
            );
        }

        const relationField = node.relationFields.find((x) => x.fieldName === fieldName);

        if (isAggregate) {
            if (!relationField) throw new Error("Aggregate filters must be on relationship fields");
            const relationTypeName = node.connectionFields.find(
                (x) => x.relationship.fieldName === fieldName
            )?.relationshipTypeName;
            const relationship = context.relationships.find((x) => x.name === relationTypeName);
            return aggregatePreComputedWhereFields({
                value,
                relationField,
                relationship,
                context,
                matchNode: targetElement,
            });
        }

        if (relationField) {
            return createRelationshipOperation({
                relationField,
                context,
                parentNode: targetElement as Cypher.Node,
                operator,
                value,
                isNot,
            });
        }

        const connectionField = node.connectionFields.find((x) => x.fieldName === fieldName);
        if (connectionField) {
            return createConnectionOperation({
                value,
                connectionField,
                context,
                parentNode: targetElement as Cypher.Node,
                operator,
            });
        }

        if (value === null) {
            if (isNot) {
                return {
                    predicate: Cypher.isNotNull(propertyRef),
                };
            }
            return {
                predicate: Cypher.isNull(propertyRef),
            };
        }
    }
    const pointField = element.pointFields.find((x) => x.fieldName === fieldName);
    const durationField = element.primitiveFields.find(
        (x) => x.fieldName === fieldName && x.typeMeta.name === "Duration"
    );

    const comparisonOp = createComparisonOperation({
        propertyRefOrCoalesce: propertyRef,
        param: new Cypher.Param(value),
        operator,
        durationField,
        pointField,
        neo4jDatabaseInfo: context.neo4jDatabaseInfo,
    });
    if (isNot) {
        return {
            predicate: Cypher.not(comparisonOp),
        };
    }
    return { predicate: comparisonOp };
}
