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
import type { ConnectionField, ConnectionWhereArg, Context, PredicateReturn } from "../../../types";
import type { Node, Relationship } from "../../../classes";
import { getListPredicate, ListPredicate } from "../utils";
import type { WhereOperator } from "../types";
// Recursive function

import { createWherePredicate } from "../create-where-predicate";
import { asArray, filterTruthy } from "../../../utils/utils";
import { getCypherLogicalOperator, isLogicalOperator } from "../../utils/logical-operators";
import { createRelationshipPredicate } from "./create-relationship-operation";
import { getCypherRelationshipDirection } from "../../../utils/get-relationship-direction";

export function createConnectionOperation({
    connectionField,
    value,
    context,
    parentNode,
    operator,
    requiredVariables,
}: {
    connectionField: ConnectionField;
    value: any;
    context: Context;
    parentNode: Cypher.Node;
    operator: string | undefined;
    requiredVariables: Cypher.Variable[];
}): PredicateReturn {
    let nodeEntries: Record<string, any>;

    if (!connectionField?.relationship.union) {
        nodeEntries = { [connectionField.relationship.typeMeta.name]: value };
    } else {
        nodeEntries = value;
    }

    let subqueries: Cypher.CompositeClause | undefined;
    const operations: (Cypher.Predicate | undefined)[] = [];
    const aggregatingVariables: Cypher.Variable[] = [];
    const matchPatterns: Cypher.Pattern[] = [];

    Object.entries(nodeEntries).forEach((entry) => {
        let nodeOnValue: string | undefined = undefined;
        const nodeOnObj = entry[1]?.node?._on;
        if (nodeOnObj) {
            nodeOnValue = Object.keys(nodeOnObj)[0];
        }

        let refNode = context.nodes.find((x) => x.name === nodeOnValue || x.name === entry[0]) as Node;
        if (!refNode) {
            refNode = context.nodes.find((x) => x.interfaces.some((i) => i.name.value === entry[0])) as Node;
        }

        const relationField = connectionField.relationship;

        let labelsOfNodesImplementingInterface;
        let labels = refNode.getLabels(context);

        const hasOnlyNodeObjectFilter = entry[1]?.node && !nodeOnObj;
        if (hasOnlyNodeObjectFilter) {
            const nodesImplementingInterface = context.nodes.filter((x) =>
                x.interfaces.some((i) => i.name.value === entry[0])
            );
            labelsOfNodesImplementingInterface = nodesImplementingInterface.map((n) => n.getLabels(context)).flat();
            if (labelsOfNodesImplementingInterface?.length) {
                // set labels to an empty array. We check for the possible interface implementations in the WHERE clause instead (that is Neo4j 4.x safe)
                labels = [];
            }
        }

        const childNode = new Cypher.Node({ labels });

        let orOperatorMultipleNodeLabels;
        if (labelsOfNodesImplementingInterface?.length) {
            orOperatorMultipleNodeLabels = Cypher.or(
                ...labelsOfNodesImplementingInterface.map((label: string) => childNode.hasLabel(label))
            );
        }

        const relationship = new Cypher.Relationship({ type: relationField.type });

        const direction = getCypherRelationshipDirection(relationField);
        const matchPattern = new Cypher.Pattern(parentNode)
            .withoutLabels()
            .related(relationship)
            .withDirection(direction)
            .to(childNode);

        let listPredicateStr = getListPredicate(operator as WhereOperator);

        const contextRelationship = context.relationships.find(
            (x) => x.name === connectionField.relationshipTypeName
        ) as Relationship;
        const innerOperation = createConnectionWherePropertyOperation({
            context,
            whereInput: entry[1],
            edgeRef: relationship,
            targetNode: childNode,
            edge: contextRelationship,
            node: refNode,
            listPredicateStr,
        });

        if (orOperatorMultipleNodeLabels) {
            innerOperation.predicate = Cypher.and(innerOperation.predicate, orOperatorMultipleNodeLabels);
        }

        subqueries = Cypher.concat(subqueries, innerOperation.preComputedSubqueries);
        requiredVariables.push(...innerOperation.requiredVariables);
        aggregatingVariables.push(...innerOperation.aggregatingVariables);
        matchPatterns.push(matchPattern);
        if (listPredicateStr === "any" && !connectionField.relationship.typeMeta.array) {
            listPredicateStr = "single";
        }

        const predicate = createRelationshipPredicate({
            matchPattern,
            listPredicateStr,
            childNode,
            innerOperation: innerOperation.predicate,
            edgePredicate: true,
        });

        operations.push(predicate);
    });

    if (aggregatingVariables && aggregatingVariables.length) {
        const aggregatingWithClause = new Cypher.With(
            parentNode,
            ...requiredVariables,
            ...(aggregatingVariables.map((returnVar) => [Cypher.collect(returnVar), returnVar]) as any)
        );

        return {
            predicate: Cypher.and(...operations),
            preComputedSubqueries: Cypher.concat(
                ...matchPatterns.map((matchPattern) => new Cypher.OptionalMatch(matchPattern)),
                subqueries,
                aggregatingWithClause
            ),
            requiredVariables: [...requiredVariables, ...aggregatingVariables],
            aggregatingVariables: [],
        };
    }
    return {
        predicate: Cypher.and(...operations),
        preComputedSubqueries: subqueries,
        requiredVariables: requiredVariables,
        aggregatingVariables: [],
    };
}

export function createConnectionWherePropertyOperation({
    context,
    whereInput,
    edgeRef,
    targetNode,
    node,
    edge,
    listPredicateStr,
}: {
    whereInput: ConnectionWhereArg;
    context: Context;
    node: Node;
    edge: Relationship;
    edgeRef: Cypher.Variable;
    targetNode: Cypher.Node;
    listPredicateStr?: ListPredicate;
}): PredicateReturn {
    const requiredVariables: Cypher.Variable[] = [];
    const aggregatingVariables: Cypher.Variable[] = [];
    const preComputedSubqueriesResult: (Cypher.CompositeClause | undefined)[] = [];
    const params: (Cypher.Predicate | undefined)[] = [];
    Object.entries(whereInput).forEach(([key, value]) => {
        if (isLogicalOperator(key)) {
            const subOperations: (Cypher.Predicate | undefined)[] = [];
            asArray(value).forEach((input) => {
                const {
                    predicate,
                    preComputedSubqueries,
                    requiredVariables: innerRequiredVariables,
                    aggregatingVariables: innerAggregatingVariables,
                } = createConnectionWherePropertyOperation({
                    context,
                    whereInput: input,
                    edgeRef,
                    targetNode,
                    node,
                    edge,
                    listPredicateStr,
                });
                subOperations.push(predicate);
                if (preComputedSubqueries && !preComputedSubqueries.empty)
                    preComputedSubqueriesResult.push(preComputedSubqueries);
                requiredVariables.push(...innerRequiredVariables);
                aggregatingVariables.push(...innerAggregatingVariables);
            });
            const cypherLogicalOperator = getCypherLogicalOperator(key);
            params.push(cypherLogicalOperator(...filterTruthy(subOperations)));
            return;
        }

        if (key.startsWith("edge")) {
            const nestedProperties: Record<string, any> = value;
            const {
                predicate: result,
                preComputedSubqueries,
                requiredVariables: innerRequiredVariables,
                aggregatingVariables: innerAggregatingVariables,
            } = createWherePredicate({
                targetElement: edgeRef,
                whereInput: nestedProperties,
                context,
                element: edge,
                listPredicateStr,
            });

            params.push(result);
            if (preComputedSubqueries && !preComputedSubqueries.empty)
                preComputedSubqueriesResult.push(preComputedSubqueries);
            requiredVariables.push(...innerRequiredVariables);
            aggregatingVariables.push(...innerAggregatingVariables);
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

            const {
                predicate: result,
                preComputedSubqueries,
                requiredVariables: innerRequiredVariables,
                aggregatingVariables: innerAggregatingVariables,
            } = createWherePredicate({
                targetElement: targetNode,
                whereInput: nestedProperties,
                context,
                element: node,
                listPredicateStr,
            });

            // NOTE: _NOT is handled by the size()=0
            params.push(result);
            if (preComputedSubqueries && !preComputedSubqueries.empty)
                preComputedSubqueriesResult.push(preComputedSubqueries);
            requiredVariables.push(...innerRequiredVariables);
            aggregatingVariables.push(...innerAggregatingVariables);
            return;
        }
    });
    return {
        predicate: Cypher.and(...filterTruthy(params)),
        preComputedSubqueries: preComputedSubqueriesResult.length
            ? Cypher.concat(...preComputedSubqueriesResult)
            : undefined,
        requiredVariables,
        aggregatingVariables,
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
