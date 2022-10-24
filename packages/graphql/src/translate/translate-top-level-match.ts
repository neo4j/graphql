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

import type { AuthOperations, Context, GraphQLWhereArg } from "../types";
import type { Node } from "../classes";
import { createAuthAndParams } from "./create-auth-and-params";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { createWherePredicate } from "./where/create-where-predicate";

export function translateTopLevelMatch({
    node,
    context,
    varName,
    operation,
}: {
    context: Context;
    node: Node;
    varName: string;
    operation: AuthOperations;
}): CypherBuilder.CypherResult {
    const matchQuery = createMatchClause({ node, context, varName, operation });

    const result = matchQuery.build();
    return result;
}

export function createMatchClause({
    node,
    context,
    varName,
    operation,
}: {
    context: Context;
    node: Node;
    varName: string;
    operation: AuthOperations;
}): CypherBuilder.Match | CypherBuilder.db.FullTextQueryNodes {
    const { resolveTree } = context;
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const fulltextInput = (resolveTree.args.fulltext || {}) as Record<string, { phrase: string }>;

    const matchNode = new CypherBuilder.NamedNode(varName, { labels: node.getLabels(context) });

    let matchQuery: CypherBuilder.Match<CypherBuilder.Node> | CypherBuilder.db.FullTextQueryNodes;

    if (Object.entries(fulltextInput).length) {
        // This is only for fulltext search
        if (Object.entries(fulltextInput).length > 1) {
            throw new Error("Can only call one search at any given time");
        }
        const [indexName, indexInput] = Object.entries(fulltextInput)[0];
        const phraseParam = new CypherBuilder.Param(indexInput.phrase);

        matchQuery = new CypherBuilder.db.FullTextQueryNodes(matchNode, indexName, phraseParam);

        const labelsChecks = node.getLabels(context).map((label) => {
            return CypherBuilder.in(new CypherBuilder.Literal(label), CypherBuilder.labels(matchNode));
        });

        const andChecks = CypherBuilder.and(...labelsChecks);
        if (andChecks) matchQuery.where(andChecks);
    } else {
        matchQuery = new CypherBuilder.Match(matchNode);
    }

    if (whereInput) {
        const whereOp = createWherePredicate({
            whereInput,
            element: node,
            context,
            targetElement: matchNode,
        });

        if (whereOp) matchQuery.where(whereOp);
    }

    const whereAuth = createAuthAndParams({
        operations: operation,
        entity: node,
        context,
        where: { varName, node },
    });
    if (whereAuth[0]) {
        const authQuery = new CypherBuilder.RawCypher(() => {
            return whereAuth;
        });

        matchQuery.where(authQuery);
    }

    return matchQuery;
}
