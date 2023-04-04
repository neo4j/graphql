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

import type { Context, GraphQLWhereArg } from "../types";
import type { AuthOperations } from "../types/deprecated/auth/auth-operations";
import type { Node } from "../classes";
import { createAuthAndParams } from "./create-auth-and-params";
import Cypher from "@neo4j/cypher-builder";
import { createWherePredicate } from "./where/create-where-predicate";
import { SCORE_FIELD } from "../graphql/directives/fulltext";

export function translateTopLevelMatch({
    matchNode,
    node,
    context,
    operation,
    where,
}: {
    matchNode: Cypher.Node;
    context: Context;
    node: Node;
    operation: AuthOperations;
    where: GraphQLWhereArg | undefined;
}): Cypher.CypherResult {
    const { matchClause, preComputedWhereFieldSubqueries, whereClause } = createMatchClause({
        matchNode,
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

export function createMatchClause({
    matchNode,
    node,
    context,
    operation,
    where,
}: {
    matchNode: Cypher.Node;
    context: Context;
    node: Node;
    operation: AuthOperations;
    where: GraphQLWhereArg | undefined;
}): CreateMatchClauseReturn {
    const { resolveTree } = context;
    const fulltextInput = (resolveTree.args.fulltext || {}) as Record<string, { phrase: string }>;
    let matchClause: Cypher.Match | Cypher.Yield = new Cypher.Match(matchNode);
    let whereOperators: Cypher.Predicate[] = [];

    // TODO: removed deprecated fulltext translation
    if (Object.entries(fulltextInput).length) {
        if (Object.entries(fulltextInput).length > 1) {
            throw new Error("Can only call one search at any given time");
        }
        const [indexName, indexInput] = Object.entries(fulltextInput)[0];
        const phraseParam = new Cypher.Param(indexInput.phrase);

        matchClause = Cypher.db.index.fulltext.queryNodes(indexName, phraseParam).yield(["node", matchNode]);

        whereOperators = node.getLabels(context).map((label) => {
            return Cypher.in(new Cypher.Literal(label), Cypher.labels(matchNode));
        });
    } else if (context.fulltextIndex) {
        ({ matchClause, whereOperators } = createFulltextMatchClause(matchNode, where, node, context));
        where = where?.[node.singular];
    }

    let whereClause: Cypher.Match | Cypher.Yield | Cypher.With | undefined = matchClause;
    let preComputedWhereFieldSubqueries: Cypher.CompositeClause | undefined;
    if (where) {
        const { predicate: whereOp, preComputedSubqueries } = createWherePredicate({
            targetElement: matchNode,
            whereInput: where,
            context,
            element: node,
        });

        preComputedWhereFieldSubqueries = preComputedSubqueries;

        if (preComputedWhereFieldSubqueries && !preComputedWhereFieldSubqueries.empty) {
            if (
                preComputedWhereFieldSubqueries.children.length === 1 &&
                preComputedWhereFieldSubqueries.children[0] instanceof Cypher.Match
            ) {
                whereClause = preComputedWhereFieldSubqueries.children[0];
                preComputedWhereFieldSubqueries = undefined;
            } else {
                whereClause = new Cypher.With("*");
            }
        }

        if (whereOp) whereClause.where(whereOp);
    }

    if (whereOperators && whereOperators.length) {
        const andChecks = Cypher.and(...whereOperators);
        whereClause.where(andChecks);
    }

    const { cypher: authCypher, params: authParams } = createAuthAndParams({
        operations: operation,
        entity: node,
        context,
        where: { varName: matchNode, node },
    });
    if (authCypher) {
        const authQuery = new Cypher.RawCypher(() => {
            return [authCypher, authParams];
        });

        whereClause.where(authQuery);
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
    context: Context
): {
    matchClause: Cypher.Yield;
    whereOperators: Cypher.Predicate[];
} {
    // TODO: remove indexName assignment and undefined check once the name argument has been removed.
    const indexName = context.fulltextIndex.indexName || context.fulltextIndex.name;
    if (indexName === undefined) {
        throw new Error("The name of the fulltext index should be defined using the indexName argument.");
    }
    const phraseParam = new Cypher.Param(context.resolveTree.args.phrase);
    const scoreVar = context.fulltextIndex.scoreVariable;

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
