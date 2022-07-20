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

import type { ConnectionField, ConnectionWhereArg, Context } from "../../../types";
import * as CypherBuilder from "../../cypher-builder/CypherBuilder";
import type { Node, Relationship } from "../../../classes";
import { getListPredicate } from "../utils";
import { listPredicateToSizeFunction } from "../list-predicate-to-size-function";
import type { WhereOperator } from "../types";
// Recursive function
// eslint-disable-next-line import/no-cycle
import { createCypherWhereParams } from "../create-cypher-where-params";
import { filterTruthy } from "../../../utils/utils";
import { compileCypherIfExists } from "../../cypher-builder/utils";

export function createConnectionOperation({
    connectionField,
    value,
    context,
    parentNode,
    operator,
}: {
    connectionField: ConnectionField;
    value: any;
    context: Context;
    parentNode: CypherBuilder.Node;
    operator: string | undefined;
}): CypherBuilder.BooleanOp | CypherBuilder.RawCypher | undefined {
    let nodeEntries: Record<string, any>;

    if (!connectionField?.relationship.union) {
        nodeEntries = { [connectionField.relationship.typeMeta.name]: value };
    } else {
        nodeEntries = value;
    }

    const operations = Object.entries(nodeEntries).map((entry) => {
        const refNode = context.nodes.find(
            (x) => x.name === entry[0] || x.interfaces.some((i) => i.name.value === entry[0])
        ) as Node;

        const relationField = connectionField.relationship;

        const childNode = new CypherBuilder.Node({ labels: refNode.getLabels(context) });
        const relationship = new CypherBuilder.Relationship({
            source: relationField.direction === "IN" ? childNode : parentNode,
            target: relationField.direction === "IN" ? parentNode : childNode,
            type: relationField.type,
        });

        const matchPattern = new CypherBuilder.Pattern(relationship, {
            source: relationField.direction === "IN" ? { variable: true } : { labels: false },
            target: relationField.direction === "IN" ? { labels: false } : { variable: true },
            relationship: { variable: true },
        });

        let listPredicateStr = getListPredicate(operator as WhereOperator);

        const contextRelationship = context.relationships.find(
            (x) => x.name === connectionField.relationshipTypeName
        ) as Relationship;
        const whereOperator = createConnectionWherePropertyOperation({
            context,
            whereInput: entry[1] as any,
            relationshipRef: relationship,
            targetNode: childNode,
            edge: contextRelationship,
            node: refNode,
        });

        if (listPredicateStr === "any" && !connectionField.relationship.typeMeta.array) {
            listPredicateStr = "single";
        }
        const subquery = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
            const patternStr = matchPattern.getCypher(env);
            const whereStr = compileCypherIfExists(whereOperator, env, {});
            const clause = listPredicateToSizeFunction(listPredicateStr, patternStr, whereStr);
            return [clause, {}];
        });

        return subquery;
    });

    return CypherBuilder.and(...operations) as CypherBuilder.BooleanOp | undefined;
}

function createConnectionWherePropertyOperation({
    context,
    whereInput,
    relationshipRef,
    targetNode,
    node,
    edge,
}: {
    whereInput: ConnectionWhereArg;
    context: Context;
    node: Node;
    edge: Relationship;
    relationshipRef: CypherBuilder.Relationship;
    targetNode: CypherBuilder.Node;
}): CypherBuilder.ComparisonOp | CypherBuilder.BooleanOp | CypherBuilder.RawCypher | CypherBuilder.Exists | undefined {
    const params = Object.entries(whereInput).map(([key, value]) => {
        if (key === "AND" || key === "OR") {
            const subOperations = (value as Array<any>).map((input) => {
                return createConnectionWherePropertyOperation({
                    context,
                    whereInput: input,
                    relationshipRef,
                    targetNode,
                    node,
                    edge,
                });
            });
            if (key === "AND") {
                return CypherBuilder.and(...filterTruthy(subOperations));
            }
            if (key === "OR") {
                return CypherBuilder.or(...filterTruthy(subOperations));
            }
        }

        if (key.startsWith("edge")) {
            const nestedProperties: Record<string, any> = value;
            const result = createCypherWhereParams({
                targetElement: relationshipRef,
                whereInput: nestedProperties,
                context,
                element: edge,
            });

            return result;
        }

        if (key.startsWith("node") || key.startsWith(node.name)) {
            // TODO: improve nodeOn properties generation
            const nodeOnProperties = value._on?.[node.name] || {};
            const nestedProperties = { ...value, ...nodeOnProperties };
            delete nestedProperties._on;

            if (
                Object.keys(value as Record<string, any>).length === 1 &&
                value._on &&
                !Object.prototype.hasOwnProperty.call(value._on, node.name)
            ) {
                throw new Error("_on is used as the only argument and node is not present within");
            }

            const result = createCypherWhereParams({
                targetElement: targetNode,
                whereInput: nestedProperties,
                context,
                element: node,
            });

            // NOTE: _NOT is handled by the size()=0
            return result;
        }
        return undefined;
    });
    return CypherBuilder.and(...filterTruthy(params));
}
