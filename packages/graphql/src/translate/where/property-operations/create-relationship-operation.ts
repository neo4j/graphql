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

import type { Context, GraphQLWhereArg, RelationField } from "../../../types";
import Cypher from "@neo4j/cypher-builder";

import { createWherePredicate } from "../create-where-predicate";
import { getListPredicate } from "../utils";
import type { WhereOperator } from "../types";

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
}): { predicate: Cypher.Predicate | undefined; preComputedSubquery?: Cypher.CompositeClause | undefined } {
    const refNode = context.nodes.find((n) => n.name === relationField.typeMeta.name);
    if (!refNode) throw new Error("Relationship filters must reference nodes");

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

    // TODO: check null in return projection
    if (value === null) {
        const existsSubquery = new Cypher.Match(matchPattern, {});
        const exists = new Cypher.Exists(existsSubquery);
        if (!isNot) {
            // Bit confusing, but basically checking for not null is the same as checking for relationship exists
            return { predicate: Cypher.not(exists) };
        }
        return { predicate: exists };
    }

    let listPredicateStr = getListPredicate(operator as WhereOperator);

    if (listPredicateStr === "any" && !relationField.typeMeta.array) {
        listPredicateStr = "single";
    }
    const innerOperation = createWherePredicate({
        // Nested properties here
        whereInput: value,
        targetElement: childNode,
        element: refNode,
        context,
    });

    const { predicate, preComputedSubquery } = createRelationshipSubqueryAndPredicate({
        parentNode,
        matchPattern,
        listPredicateStr,
        relationship,
        innerOperation,
    });

    if (listPredicateStr === "all") {
        const secondInnerOperation = createWherePredicate({
            // Nested properties here
            whereInput: value,
            targetElement: childNode,
            element: refNode,
            context,
        });

        const { predicate: secondPredicate, preComputedSubquery: secondSubquery } =
            createRelationshipSubqueryAndPredicate({
                parentNode,
                matchPattern,
                listPredicateStr: "none",
                relationship,
                innerOperation: secondInnerOperation,
            });

        if (secondPredicate) {
            return {
                predicate: Cypher.and(predicate, Cypher.not(secondPredicate)),
                preComputedSubquery: Cypher.concat(preComputedSubquery, secondSubquery),
            };
        }
    }

    return {
        predicate,
        preComputedSubquery: Cypher.concat(preComputedSubquery),
    };
}

export function createRelationshipSubqueryAndPredicate({
    matchPattern,
    listPredicateStr,
    relationship,
    parentNode,
    innerOperation,
}: {
    matchPattern: Cypher.Pattern;
    listPredicateStr: string;
    relationship: Cypher.Relationship;
    parentNode: Cypher.Node;
    innerOperation: {
        predicate: Cypher.Predicate | undefined;
        preComputedSubqueries?: Cypher.CompositeClause | undefined;
    };
}): { predicate: Cypher.Predicate | undefined; preComputedSubquery?: Cypher.Call | undefined } {
    const { predicate: relationOperator, preComputedSubqueries } = innerOperation;

    if (!relationOperator) {
        return { predicate: undefined };
    }

    const matchClause = new Cypher.Match(matchPattern);
    const countRef = new Cypher.Variable();

    let whereClause: Cypher.Match | Cypher.With = matchClause;
    let innerSubqueriesAndWhereClause: Cypher.CompositeClause | undefined;

    if (preComputedSubqueries && !preComputedSubqueries.empty) {
        whereClause = new Cypher.With("*");
        innerSubqueriesAndWhereClause = Cypher.concat(preComputedSubqueries, whereClause);
    }

    const newWhereOperator = listPredicateStr === "all" ? Cypher.not(relationOperator) : relationOperator;
    whereClause.where(newWhereOperator);

    const subqueryContents = Cypher.concat(
        matchClause,
        innerSubqueriesAndWhereClause,
        new Cypher.Return([Cypher.count(relationship), countRef])
    );

    const subqueryCall = new Cypher.Call(subqueryContents).innerWith(parentNode);

    return {
        predicate: getCountOperation(listPredicateStr, countRef),
        preComputedSubquery: subqueryCall,
    };
}

function getCountOperation(listPredicate: string, countRef: Cypher.Variable): Cypher.Predicate {
    switch (listPredicate) {
        case "all":
        case "none":
            return Cypher.eq(countRef, new Cypher.Literal(0));
        case "any":
            return Cypher.gt(countRef, new Cypher.Literal(0));
        case "single":
            return Cypher.eq(countRef, new Cypher.Literal(1));
        default:
            throw new Error(`Unknown predicate ${listPredicate}`);
    }
}
