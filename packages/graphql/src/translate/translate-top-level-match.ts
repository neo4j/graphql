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
import type { Node } from "../classes";
import type { AuthorizationOperation } from "../schema-model/annotation/AuthorizationAnnotation";
import type { GraphQLWhereArg } from "../types";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { getEntityAdapterFromNode } from "../utils/get-entity-adapter-from-node";
import { createAuthorizationBeforePredicate } from "./authorization/create-authorization-before-predicate";
import { buildClause } from "./utils/build-clause";
import { createWhereNodePredicate } from "./where/create-where-predicate";

export function translateTopLevelMatch({
    matchNode,
    matchPattern,
    node,
    context,
    operation,
    where,
}: {
    matchNode: Cypher.Node;
    matchPattern: Cypher.Pattern;
    context: Neo4jGraphQLTranslationContext;
    node: Node;
    operation: AuthorizationOperation;
    where: GraphQLWhereArg | undefined;
}): Cypher.CypherResult {
    const { matchClause, preComputedWhereFieldSubqueries, whereClause } = createMatchClause({
        matchNode,
        matchPattern,
        node,
        context,
        operation,
        where,
    });

    return buildClause(Cypher.utils.concat(matchClause, preComputedWhereFieldSubqueries, whereClause), { context });
}

type CreateMatchClauseReturn = {
    matchClause: Cypher.Match | Cypher.Yield;
    preComputedWhereFieldSubqueries: Cypher.CompositeClause | undefined;
    whereClause: Cypher.Match | Cypher.Yield | Cypher.With | undefined;
};

function createMatchClause({
    matchNode,
    matchPattern,
    node,
    context,
    operation,
    where,
}: {
    matchNode: Cypher.Node;
    matchPattern: Cypher.Pattern;
    context: Neo4jGraphQLTranslationContext;
    node: Node;
    operation: AuthorizationOperation;
    where: GraphQLWhereArg | undefined;
}): CreateMatchClauseReturn {
    const matchClause: Cypher.Match | Cypher.Yield = new Cypher.Match(matchPattern);
    const whereOperators: Cypher.Predicate[] = [];

    let whereClause: Cypher.Match | Cypher.Yield | Cypher.With | undefined;

    const authorizationPredicateReturn = createAuthorizationBeforePredicate({
        context,
        nodes: [
            {
                variable: matchNode,
                node,
            },
        ],
        operations: [operation],
    });
    if (authorizationPredicateReturn?.predicate) {
        whereClause = new Cypher.With("*");
    } else {
        whereClause = matchClause;
    }

    let preComputedWhereFieldSubqueries: Cypher.CompositeClause | undefined;
    if (where) {
        const entity = getEntityAdapterFromNode(node, context);

        const { predicate: whereOp, preComputedSubqueries } = createWhereNodePredicate({
            targetElement: matchNode,
            whereInput: where,
            context,
            entity,
        });

        preComputedWhereFieldSubqueries = preComputedSubqueries;

        if (preComputedWhereFieldSubqueries && !preComputedWhereFieldSubqueries.empty) {
            whereClause = new Cypher.With("*");
        }
        if (whereOp) whereClause.where(whereOp);
    }

    if (whereOperators && whereOperators.length) {
        const andChecks = Cypher.and(...whereOperators);
        whereClause.where(andChecks);
    }

    if (authorizationPredicateReturn) {
        const { predicate, preComputedSubqueries } = authorizationPredicateReturn;

        if (predicate) {
            whereClause.where(predicate);
        }

        if (preComputedSubqueries && !preComputedSubqueries.empty) {
            preComputedWhereFieldSubqueries = Cypher.utils.concat(
                preComputedWhereFieldSubqueries,
                preComputedSubqueries
            );
        }
    }

    if (matchClause === whereClause) {
        whereClause = undefined;
    }

    return {
        matchClause,
        preComputedWhereFieldSubqueries,
        whereClause,
    };
}
