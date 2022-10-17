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
import { Cypher } from "../../cypher-builder/CypherBuilder";
import type { Node, Relationship } from "../../../classes";
import { getListPredicate } from "../utils";
import { listPredicateToSizeFunction } from "../list-predicate-to-size-function";
import type { WhereOperator } from "../types";
// Recursive function

import { createWherePredicate } from "../create-where-predicate";
import { filterTruthy } from "../../../utils/utils";

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
    parentNode: Cypher.Node;
    operator: string | undefined;
}): Cypher.BooleanOp | Cypher.RawCypher | undefined {
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

        const childNode = new Cypher.Node({ labels: refNode.getLabels(context) });
        const relationship = new Cypher.Relationship({
            source: relationField.direction === "IN" ? childNode : parentNode,
            target: relationField.direction === "IN" ? parentNode : childNode,
            type: relationField.type,
        });

        const matchPattern = relationship.pattern({
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
            whereInput: entry[1],
            edgeRef: relationship,
            targetNode: childNode,
            edge: contextRelationship,
            node: refNode,
        });

        if (listPredicateStr === "any" && !connectionField.relationship.typeMeta.array) {
            listPredicateStr = "single";
        }
        const subquery = new Cypher.RawCypher((env: Cypher.Environment) => {
            const patternStr = matchPattern.getCypher(env);
            const whereStr = whereOperator ? whereOperator.getCypher(env) : "";
            const clause = listPredicateToSizeFunction(listPredicateStr, patternStr, whereStr);
            return [clause, {}];
        });

        return subquery;
    });

    return Cypher.and(...operations) as Cypher.BooleanOp | undefined;
}

export function createConnectionWherePropertyOperation({
    context,
    whereInput,
    edgeRef,
    targetNode,
    node,
    edge,
}: {
    whereInput: ConnectionWhereArg;
    context: Context;
    node: Node;
    edge: Relationship;
    edgeRef: Cypher.Variable;
    targetNode: Cypher.Node;
}): Cypher.Predicate | undefined {
    const params = Object.entries(whereInput).map(([key, value]) => {
        if (key === "AND" || key === "OR") {
            const subOperations = (value as Array<any>).map((input) => {
                return createConnectionWherePropertyOperation({
                    context,
                    whereInput: input,
                    edgeRef,
                    targetNode,
                    node,
                    edge,
                });
            });
            if (key === "AND") {
                return Cypher.and(...filterTruthy(subOperations));
            }
            if (key === "OR") {
                return Cypher.or(...filterTruthy(subOperations));
            }
        }

        if (key.startsWith("edge")) {
            const nestedProperties: Record<string, any> = value;
            const result = createWherePredicate({
                targetElement: edgeRef,
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

            const result = createWherePredicate({
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
    return Cypher.and(...filterTruthy(params));
}

/** Checks if a where property has an explicit interface inside _on */
export function hasExplicitNodeInInterfaceWhere({
    whereInput,
    node,
}: {
    whereInput: ConnectionWhereArg;
    node: Node;
}): boolean {
    for (const [key, value] of Object.entries(whereInput)) {
        if (key.startsWith("node") || key.startsWith(node.name)) {
            if (
                Object.keys(value as Record<string, any>).length === 1 &&
                value._on &&
                !Object.prototype.hasOwnProperty.call(value._on, node.name)
            ) {
                return false;
            }

            return true;
        }
    }
    return true;
}
