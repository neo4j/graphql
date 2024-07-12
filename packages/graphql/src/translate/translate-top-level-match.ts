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
import { SCORE_FIELD } from "../constants";
import type { AuthorizationOperation } from "../schema-model/annotation/AuthorizationAnnotation";
import type { GraphQLWhereArg } from "../types";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { getEntityAdapterFromNode } from "../utils/get-entity-adapter-from-node";
import { createAuthorizationBeforePredicate } from "./authorization/create-authorization-before-predicate";
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

    return Cypher.concat(matchClause, preComputedWhereFieldSubqueries, whereClause).build();
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
    const { resolveTree } = context;
    const fulltextInput = (resolveTree.args.fulltext || {}) as Record<string, { phrase: string }>;
    let matchClause: Cypher.Match | Cypher.Yield = new Cypher.Match(matchPattern);
    let whereOperators: Cypher.Predicate[] = [];

    // TODO: removed deprecated fulltext translation
    const entries = Object.entries(fulltextInput);
    if (entries.length) {
        if (entries.length > 1) {
            throw new Error("Can only call one search at any given time");
        }
        const [indexName, indexInput] = entries[0] as [string, { phrase: string }];
        const phraseParam = new Cypher.Param(indexInput.phrase);

        matchClause = Cypher.db.index.fulltext.queryNodes(indexName, phraseParam).yield(["node", matchNode]);

        whereOperators = node.getLabels(context).map((label) => {
            return Cypher.in(new Cypher.Param(label), Cypher.labels(matchNode));
        });
    } else if (context.fulltext) {
        ({ matchClause, whereOperators } = createFulltextMatchClause(matchNode, where, node, context));
        where = where?.[node.singular];
    }

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
            preComputedWhereFieldSubqueries = Cypher.concat(preComputedWhereFieldSubqueries, preComputedSubqueries);
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

function createFulltextMatchClause(
    matchNode: Cypher.Node,
    whereInput: GraphQLWhereArg | undefined,
    node: Node,
    context: Neo4jGraphQLTranslationContext
): {
    matchClause: Cypher.Yield;
    whereOperators: Cypher.Predicate[];
} {
    if (!context.fulltext) {
        throw new Error("Full-text context not defined");
    }

    // TODO: remove indexName assignment and undefined check once the name argument has been removed.
    const indexName = context.fulltext.indexName || context.fulltext.name;
    if (indexName === undefined) {
        throw new Error("The name of the fulltext index should be defined using the indexName argument.");
    }
    const phraseParam = new Cypher.Param(context.resolveTree.args.phrase);
    const scoreVar = context.fulltext.scoreVariable;

    const matchClause = Cypher.db.index.fulltext
        .queryNodes(indexName, phraseParam)
        .yield(["node", matchNode], ["score", scoreVar]);

    const expectedLabels = node.getLabels(context);
    const labelsChecks = matchNode.hasLabels(...expectedLabels);
    const whereOperators: Cypher.Predicate[] = [];

    if (whereInput?.[SCORE_FIELD]) {
        if (whereInput[SCORE_FIELD].min || whereInput[SCORE_FIELD].min === 0) {
            const scoreMinOp = Cypher.gte(scoreVar, new Cypher.Param(whereInput[SCORE_FIELD].min));
            if (scoreMinOp) whereOperators.push(scoreMinOp);
        }
        if (whereInput[SCORE_FIELD].max || whereInput[SCORE_FIELD].max === 0) {
            const scoreMaxOp = Cypher.lte(scoreVar, new Cypher.Param(whereInput[SCORE_FIELD].max));
            if (scoreMaxOp) whereOperators.push(scoreMaxOp);
        }
    }

    if (labelsChecks) whereOperators.push(labelsChecks);

    return {
        matchClause,
        whereOperators,
    };
}
