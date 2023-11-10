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

import Cypher from "@neo4j/cypher-builder";
import type { ConnectionWhereArg, PredicateReturn } from "../../../types";
import type { Node, Relationship } from "../../../classes";
// Recursive function

import { createWhereNodePredicate, createWhereEdgePredicate } from "../create-where-predicate";
import { asArray, filterTruthy } from "../../../utils/utils";
import { getLogicalPredicate, isLogicalOperator } from "../../utils/logical-operators";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { getEntityAdapterFromNode } from "../../../utils/get-entity-adapter-from-node";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";

export function createConnectionWherePropertyOperation({
    context,
    whereInput,
    edgeRef,
    targetNode,
    node,
    edge,
    useExistExpr = true,
    checkParameterExistence,
}: {
    whereInput: ConnectionWhereArg;
    context: Neo4jGraphQLTranslationContext;
    node: Node;
    edge: Relationship;
    edgeRef: Cypher.Variable;
    targetNode: Cypher.Node;
    useExistExpr?: boolean;
    checkParameterExistence?: boolean;
}): PredicateReturn {
    const preComputedSubqueriesResult: (Cypher.CompositeClause | undefined)[] = [];
    const params: (Cypher.Predicate | undefined)[] = [];
    Object.entries(whereInput).forEach(([key, value]) => {
        if (isLogicalOperator(key)) {
            const subOperations: (Cypher.Predicate | undefined)[] = [];
            asArray(value).forEach((input) => {
                const { predicate, preComputedSubqueries } = createConnectionWherePropertyOperation({
                    context,
                    whereInput: input,
                    edgeRef,
                    targetNode,
                    node,
                    edge,
                    useExistExpr,
                    checkParameterExistence,
                });
                subOperations.push(predicate);
                if (preComputedSubqueries && !preComputedSubqueries.empty)
                    preComputedSubqueriesResult.push(preComputedSubqueries);
            });

            const logicalPredicate = getLogicalPredicate(key, filterTruthy(subOperations));
            params.push(logicalPredicate);
            return;
        }

        if (key.startsWith("edge")) {
            const entity = context.schemaModel.getConcreteEntityAdapter(edge.source);
            if (!entity) {
                throw new Error(`Transpilation error: entity not found: ${edge.source}`);
            }
            const relationshipAdapter = [...entity.relationships.values()].find(
                (r: RelationshipAdapter): r is RelationshipAdapter =>
                    r.operations.relationshipFieldTypename === edge.name
            );
            if (!relationshipAdapter) {
                throw new Error(`No relationship found for ${edge.name}`);
            }

            const { predicate: result, preComputedSubqueries } = createWhereEdgePredicate({
                targetElement: targetNode,
                relationshipVariable: edgeRef as Cypher.Relationship,
                relationship: relationshipAdapter,
                context,
                whereInput: value,
            });

            params.push(result);
            if (preComputedSubqueries && !preComputedSubqueries.empty) {
                preComputedSubqueriesResult.push(preComputedSubqueries);
            }
            return;
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
            const entity = getEntityAdapterFromNode(node, context);
            const { predicate: result, preComputedSubqueries } = createWhereNodePredicate({
                entity,
                context,
                whereInput: nestedProperties,
                targetElement: targetNode,
            });

            // NOTE: _NOT is handled by the size()=0
            params.push(result);
            if (preComputedSubqueries && !preComputedSubqueries.empty)
                preComputedSubqueriesResult.push(preComputedSubqueries);
            return;
        }
    });
    return {
        predicate: Cypher.and(...filterTruthy(params)),
        preComputedSubqueries: preComputedSubqueriesResult.length
            ? Cypher.concat(...preComputedSubqueriesResult)
            : undefined,
    };
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
