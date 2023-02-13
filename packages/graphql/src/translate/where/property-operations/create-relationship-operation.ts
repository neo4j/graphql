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

import type { Context, GraphQLWhereArg, RelationField, PredicateReturn } from "../../../types";
import Cypher from "@neo4j/cypher-builder";

import { createWherePredicate } from "../create-where-predicate";
import { getListPredicate, ListPredicate } from "../utils";
import type { WhereOperator } from "../types";
import type { Node, Relationship } from "../../../classes";
import { createConnectionWherePropertyOperation } from "./create-connection-operation";
import { getCypherRelationshipDirection } from "../../../utils/get-relationship-direction";

export function createRelationshipOperation({
    relationField,
    context,
    parentNode,
    operator,
    value,
    isNot,
}: {
    relationField: RelationField;
    context: Context;
    parentNode: Cypher.Node;
    operator: string | undefined;
    value: GraphQLWhereArg;
    isNot: boolean;
}): PredicateReturn {
    const refNode = context.nodes.find((n) => n.name === relationField.typeMeta.name);
    if (!refNode) throw new Error("Relationship filters must reference nodes");

    const childNode = new Cypher.Node({ labels: refNode.getLabels(context) });

    const relationship = new Cypher.Relationship({ type: relationField.type });
    const direction = getCypherRelationshipDirection(relationField);

    const matchPattern = new Cypher.Pattern(parentNode)
        .withoutLabels()
        .related(relationship)
        .withoutVariable()
        .withDirection(direction)
        .to(childNode);

    // TODO: check null in return projection
    if (value === null) {
        const existsSubquery = new Cypher.Match(matchPattern);
        const exists = new Cypher.Exists(existsSubquery);
        if (!isNot) {
            // Bit confusing, but basically checking for not null is the same as checking for relationship exists
            return { predicate: Cypher.not(exists) };
        }
        return { predicate: exists };
    }

    return createRelationPredicate({
        targetNode: childNode,
        targetPattern: matchPattern,
        targetRelationship: relationship,
        parentNode,
        refNode,
        context,
        relationField,
        whereInput: value,
        whereOperator: operator as WhereOperator,
    });
}

export function createRelationPredicate({
    targetNode,
    targetPattern,
    targetRelationship,
    parentNode,
    refNode,
    context,
    relationField,
    whereInput,
    whereOperator,
    refEdge,
}: {
    parentNode: Cypher.Node;
    targetNode: Cypher.Node;
    targetPattern: Cypher.Pattern;
    targetRelationship: Cypher.Relationship;
    refNode: Node;
    context: Context;
    relationField: RelationField;
    whereInput: GraphQLWhereArg;
    whereOperator: WhereOperator;
    refEdge?: Relationship;
}): PredicateReturn {
    let labelsOfNodesImplementingInterface: string[] | undefined;
    let labels = refNode.getLabels(context);

    const nodeOnObj = whereInput?.node?._on;
    const hasOnlyNodeObjectFilter = whereInput?.node && !nodeOnObj;
    if (hasOnlyNodeObjectFilter) {
        const nodesImplementingInterface = context.nodes.filter((x) =>
            x.interfaces.some((i) => i.name.value === relationField.typeMeta.name)
        );
        labelsOfNodesImplementingInterface = nodesImplementingInterface.map((n) => n.getLabels(context)).flat();
        if (labelsOfNodesImplementingInterface?.length) {
            // set labels to an empty array. We check for the possible interface implementations in the WHERE clause instead (that is Neo4j 4.x safe)
            labels = [];
        }
    }

    let orOperatorMultipleNodeLabels: Cypher.Predicate | undefined;
    if (labelsOfNodesImplementingInterface?.length) {
        orOperatorMultipleNodeLabels = Cypher.or(
            ...labelsOfNodesImplementingInterface.map((label: string) => targetNode.hasLabel(label))
        );
    }

    targetNode.labels = labels;

    let listPredicateStr = getListPredicate(whereOperator);

    if (listPredicateStr === "any" && !relationField.typeMeta.array) {
        listPredicateStr = "single";
    }

    const innerOperation = refEdge
        ? createConnectionWherePropertyOperation({
              context,
              whereInput,
              edge: refEdge,
              node: refNode,
              targetNode,
              edgeRef: targetRelationship,
          })
        : createWherePredicate({
              whereInput,
              targetElement: targetNode,
              element: refNode,
              context,
          });

    if (orOperatorMultipleNodeLabels) {
        innerOperation.predicate = Cypher.and(innerOperation.predicate, orOperatorMultipleNodeLabels);
    }

    if (
        innerOperation.predicate &&
        innerOperation.preComputedSubqueries &&
        !innerOperation.preComputedSubqueries.empty
    ) {
        return createRelationPredicateWithSubqueries({
            parentNode,
            targetNode,
            targetPattern,
            targetRelationship,
            preComputedSubqueries: innerOperation.preComputedSubqueries,
            innerOperation: innerOperation.predicate,
            listPredicateStr,
            whereInput,
            context,
            refNode,
            refEdge,
        });
    }
    return {
        predicate: createSimpleRelationshipPredicate({
            childNode: targetNode,
            matchPattern: targetPattern,
            listPredicateStr,
            innerOperation: innerOperation.predicate,
            edgePredicate: refEdge ? true : false,
        }),
    };
}

function createSimpleRelationshipPredicate({
    matchPattern,
    listPredicateStr,
    childNode,
    innerOperation,
    edgePredicate,
}: {
    matchPattern: Cypher.Pattern;
    listPredicateStr: ListPredicate;
    childNode: Cypher.Node;
    innerOperation: Cypher.Predicate | undefined;
    edgePredicate?: boolean;
}): Cypher.Predicate | undefined {
    if (!innerOperation) return undefined;
    const matchClause = new Cypher.Match(matchPattern).where(innerOperation);

    switch (listPredicateStr) {
        case "all": {
            // Testing "ALL" requires testing that at least one element exists and that no elements not matching the filter exists
            const notExistsMatchClause = new Cypher.Match(matchPattern).where(Cypher.not(innerOperation));
            return Cypher.and(new Cypher.Exists(matchClause), Cypher.not(new Cypher.Exists(notExistsMatchClause)));
        }
        case "single": {
            // If there are edge properties used in the innerOperation predicate, it is not possible to use the
            // more performant single() function. Therefore, we fall back to size()
            if (edgePredicate) {
                const sizeFunction = Cypher.size(
                    new Cypher.PatternComprehension(matchPattern, new Cypher.Literal(1)).where(innerOperation)
                );
                return Cypher.eq(sizeFunction, new Cypher.Literal(1));
            }

            const patternComprehension = new Cypher.PatternComprehension(matchPattern, childNode);
            return Cypher.single(childNode, patternComprehension, innerOperation);
        }
        case "not":
        case "none":
        case "any":
        default: {
            const existsPredicate = new Cypher.Exists(matchClause);
            if (["not", "none"].includes(listPredicateStr)) {
                return Cypher.not(existsPredicate);
            }
            return existsPredicate;
        }
    }
}

function createRelationPredicateWithSubqueries({
    targetNode,
    targetPattern,
    targetRelationship,
    preComputedSubqueries,
    innerOperation,
    listPredicateStr,
    parentNode,
    refNode,
    context,
    whereInput,
    refEdge,
}: {
    parentNode: Cypher.Node;
    targetNode: Cypher.Node;
    targetPattern: Cypher.Pattern;
    targetRelationship: Cypher.Relationship;
    preComputedSubqueries: Cypher.CompositeClause;
    innerOperation: Cypher.Predicate;
    listPredicateStr: ListPredicate;
    refNode: Node;
    context: Context;
    whereInput: any;
    refEdge?: Relationship;
}): PredicateReturn {
    const matchPattern = new Cypher.Match(targetPattern);
    const subqueryWith = new Cypher.With("*");
    const returnVar = new Cypher.Variable();
    subqueryWith.where(innerOperation);
    const subqueryContents = Cypher.concat(
        new Cypher.With(parentNode),
        matchPattern,
        preComputedSubqueries,
        subqueryWith
    );
    switch (listPredicateStr) {
        case "all": {
            const subquery = new Cypher.Call(
                Cypher.concat(
                    subqueryContents,
                    new Cypher.Return([Cypher.gt(Cypher.count(targetNode), new Cypher.Literal(0)), returnVar])
                )
            );

            const notNoneInnerPredicates = refEdge
                ? createConnectionWherePropertyOperation({
                      context,
                      whereInput,
                      edge: refEdge,
                      node: refNode,
                      targetNode,
                      edgeRef: targetRelationship,
                  })
                : createWherePredicate({
                      whereInput,
                      targetElement: targetNode,
                      element: refNode,
                      context,
                  });

            if (notNoneInnerPredicates.predicate && notNoneInnerPredicates.preComputedSubqueries) {
                const { predicate: notExistsPredicate, preComputedSubqueries: notExistsSubquery } =
                    createRelationPredicateWithSubqueries({
                        targetNode,
                        parentNode,
                        targetPattern,
                        targetRelationship,
                        preComputedSubqueries: notNoneInnerPredicates.preComputedSubqueries,
                        innerOperation: Cypher.not(notNoneInnerPredicates.predicate),
                        listPredicateStr: "none",
                        whereInput,
                        refNode,
                        context,
                        refEdge,
                    });
                return {
                    predicate: Cypher.and(notExistsPredicate, Cypher.eq(returnVar, new Cypher.Literal(true))),
                    preComputedSubqueries: Cypher.concat(subquery, notExistsSubquery),
                };
            }
            return { predicate: undefined };
        }
        case "single": {
            const subquery = new Cypher.Call(
                Cypher.concat(
                    subqueryContents,
                    new Cypher.Return([Cypher.eq(Cypher.count(targetNode), new Cypher.Literal(1)), returnVar])
                )
            );
            return {
                predicate: Cypher.eq(returnVar, new Cypher.Literal(true)),
                preComputedSubqueries: Cypher.concat(subquery),
            };
        }
        case "not":
        case "none":
        case "any":
        default: {
            const subquery = new Cypher.Call(
                Cypher.concat(
                    subqueryContents,
                    new Cypher.Return([Cypher.gt(Cypher.count(targetNode), new Cypher.Literal(0)), returnVar])
                )
            );
            if (["not", "none"].includes(listPredicateStr)) {
                return {
                    predicate: Cypher.eq(returnVar, new Cypher.Literal(false)),
                    preComputedSubqueries: Cypher.concat(subquery),
                };
            }
            return {
                predicate: Cypher.eq(returnVar, new Cypher.Literal(true)),
                preComputedSubqueries: Cypher.concat(subquery),
            };
        }
    }
}
