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
import type { Node } from "../../../classes";
import { AUTH_FORBIDDEN_ERROR } from "../../../constants";
import type { AuthorizationValidateRule } from "../../../schema-model/annotation/AuthorizationAnnotation";
import type { Context, PredicateReturn } from "../../../types";
import type { AuthorizationOperation, AuthorizationValidateWhen } from "../../../types/authorization";
import { getOrCreateCypherNode } from "../../utils/get-or-create-cypher-variable";
import { createAuthorizationWherePredicate } from "../where/create-authorization-where-predicate";

export function createAuthorizationValidatePredicate({
    when,
    context,
    node,
    rules,
    variable,
    operations,
}: {
    when: AuthorizationValidateWhen;
    context: Context;
    node: Node;
    rules: AuthorizationValidateRule[];
    variable: string | Cypher.Node;
    operations: AuthorizationOperation[];
}): PredicateReturn | undefined {
    const cypherNode = getOrCreateCypherNode(variable);

    const matchedRules = rules.filter(
        (rule) => rule.when.includes(when) && rule.operations.filter((operation) => operations.includes(operation))
    );

    const predicates: Cypher.Predicate[] = [];
    let subqueries: Cypher.CompositeClause | undefined;

    matchedRules.forEach((rule) => {
        const { predicate, preComputedSubqueries } = createAuthorizationWherePredicate({
            where: rule.where,
            node,
            context,
            target: cypherNode,
        });

        if (predicate) {
            predicates.push(predicate);
        }

        if (preComputedSubqueries && !preComputedSubqueries.empty) {
            subqueries = Cypher.concat(subqueries, preComputedSubqueries);
        }
    });

    if (predicates.length) {
        const wherePredicate = Cypher.or(...predicates);
        const validatePredicate = Cypher.apoc.util.validatePredicate(Cypher.not(wherePredicate), AUTH_FORBIDDEN_ERROR);

        return {
            predicate: validatePredicate,
            preComputedSubqueries: subqueries,
        };
    }

    return undefined;
}
