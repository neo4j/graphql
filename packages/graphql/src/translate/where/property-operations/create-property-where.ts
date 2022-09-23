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

import type { Context } from "../../../types";
import * as CypherBuilder from "../../cypher-builder/CypherBuilder";
import { GraphElement, Node } from "../../../classes";
import { whereRegEx, WhereRegexGroups } from "../utils";
import mapToDbProperty from "../../../utils/map-to-db-property";
import { createGlobalNodeOperation } from "./create-global-node-operation";
import { createAggregateOperation } from "./create-aggregate-operation";
// Recursive function
// eslint-disable-next-line import/no-cycle
import { createConnectionOperation } from "./create-connection-operation";
import { createComparisonOperation } from "./create-comparison-operation";
// Recursive function
// eslint-disable-next-line import/no-cycle
import { createRelationshipOperation } from "./create-relationship-operation";

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
    targetElement: CypherBuilder.Variable;
    context: Context;
}): CypherBuilder.Predicate | undefined {
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

    let propertyRef: CypherBuilder.PropertyRef | CypherBuilder.Function = targetElement.property(dbFieldName);

    if (element instanceof Node) {
        const node = element;
        if (node.isGlobalNode && key === "id") {
            return createGlobalNodeOperation({
                node,
                value,
                targetElement,
                coalesceValue,
            });
        }

        if (coalesceValue) {
            propertyRef = CypherBuilder.coalesce(
                propertyRef,
                new CypherBuilder.RawCypher(`${coalesceValue}`) // TODO: move into CypherBuilder.literal
            );
        }

        const relationField = node.relationFields.find((x) => x.fieldName === fieldName);

        if (isAggregate) {
            if (!relationField) throw new Error("Aggregate filters must be on relationship fields");

            return createAggregateOperation({
                relationField,
                context,
                value,
                parentNode: targetElement as CypherBuilder.Node,
            });
        }

        if (relationField) {
            return createRelationshipOperation({
                relationField,
                context,
                parentNode: targetElement as CypherBuilder.Node,
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
                parentNode: targetElement as CypherBuilder.Node,
                operator,
            });
        }

        if (value === null) {
            if (isNot) {
                return CypherBuilder.isNotNull(propertyRef);
            }
            return CypherBuilder.isNull(propertyRef);
        }
    }
    const pointField = element.pointFields.find((x) => x.fieldName === fieldName);
    const durationField = element.primitiveFields.find(
        (x) => x.fieldName === fieldName && x.typeMeta.name === "Duration"
    );

    const comparisonOp = createComparisonOperation({
        propertyRefOrCoalesce: propertyRef,
        param: new CypherBuilder.Param(value),
        operator,
        durationField,
        pointField,
        neo4jDatabaseInfo: context.neo4jDatabaseInfo,
    });
    if (isNot) {
        return CypherBuilder.not(comparisonOp);
    }
    return comparisonOp;
}
