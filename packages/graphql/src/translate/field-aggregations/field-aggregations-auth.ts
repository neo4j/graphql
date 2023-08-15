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

import type { PredicateReturn } from "../../types";
import type { Node } from "../../classes";
import Cypher from "@neo4j/cypher-builder";
import { createAuthorizationBeforePredicate } from "../authorization/create-authorization-before-predicate";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";

export type AggregationAuth = {
    params: Record<string, string>;
    whereQuery: string;
};

export function createFieldAggregationAuth({
    node,
    context,
    subqueryNodeAlias,
}: {
    node: Node;
    context: Neo4jGraphQLTranslationContext;
    subqueryNodeAlias: Cypher.Node;
}): PredicateReturn | undefined {
    const authPredicates: Cypher.Predicate[] = [];
    let preComputedSubqueries: Cypher.CompositeClause | undefined;

    const authorizationPredicateReturn = createAuthorizationBeforePredicate({
        context,
        nodes: [
            {
                variable: subqueryNodeAlias,
                node,
            },
        ],
        operations: ["AGGREGATE"],
    });

    if (authorizationPredicateReturn) {
        const { predicate: authorizationPredicate, preComputedSubqueries: authorizationSubqueries } =
            authorizationPredicateReturn;

        if (authorizationPredicate) {
            authPredicates.push(authorizationPredicate);
        }

        if (authorizationSubqueries && !authorizationSubqueries.empty) {
            preComputedSubqueries = Cypher.concat(preComputedSubqueries, authorizationSubqueries);
        }
    }

    return { predicate: Cypher.and(...authPredicates), preComputedSubqueries };
}
