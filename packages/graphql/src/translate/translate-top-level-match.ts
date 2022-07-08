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
import createAuthAndParams from "./create-auth-and-params";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { addWhereToStatement } from "./where/add-where-to-statement";

function translateTopLevelMatch({
    node,
    context,
    varName,
    operation,
}: {
    context: Context;
    node: Node;
    varName: string;
    operation: AuthOperations;
}): [string, Record<string, unknown>] {
    const cyphers: string[] = [];
    let cypherParams = {};
    const { resolveTree } = context;
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const fulltextInput = (resolveTree.args.fulltext || {}) as Record<string, { phrase: string }>;
    const whereStrs: string[] = [];

    const matchNode = new CypherBuilder.NamedNode(varName, { labels: node.getLabels(context) });
    let matchQuery: CypherBuilder.Match<CypherBuilder.Node> | CypherBuilder.db.FullTextQueryNodes =
        new CypherBuilder.Match(matchNode);

    let fulltextWhere: CypherBuilder.RawCypherWithCallback | undefined;
    if (Object.entries(fulltextInput).length) {
        // THIS is only for fulltext search
        if (Object.entries(fulltextInput).length > 1) {
            throw new Error("Can only call one search at any given time");
        }
        // TODO: add fulltext search
        const [indexName, indexInput] = Object.entries(fulltextInput)[0];
        const baseParamName = `${varName}_fulltext_${indexName}`;
        const paramPhraseName = `${baseParamName}_phrase`;
        cypherParams[paramPhraseName] = indexInput.phrase; // TODO: pass this param

        matchQuery = new CypherBuilder.db.FullTextQueryNodes(matchNode, indexName, paramPhraseName);

        // TODO: move this to FullTextQueryNodes
        fulltextWhere = new CypherBuilder.RawCypherWithCallback(
            (cypherContext: CypherBuilder.CypherContext, _children: string) => {
                let fullTextWhereStr: string;
                const matchId = cypherContext.getVariableId(matchNode);
                if (node.nodeDirective?.additionalLabels?.length) {
                    const labelsWhereStrs = node.getLabels(context).map((label) => {
                        return `"${label}" IN labels(${matchId})`;
                    });
                    fullTextWhereStr = labelsWhereStrs.join(" AND ");
                } else {
                    fullTextWhereStr = `"${node.getMainLabel()}" IN labels(${matchId})`;
                }

                return [fullTextWhereStr, {}];
            }
        );

        if (fulltextWhere) {
            matchQuery.where(fulltextWhere);
        }
    } else {
        // Not fulltext, normal match
        matchQuery = new CypherBuilder.Match(matchNode);
    }

    if (whereInput) {
        addWhereToStatement({
            whereInput,
            node,
            context,
            matchStatement: matchQuery,
            targetElement: matchNode,
        });
    }

    const whereAuth = createAuthAndParams({
        operations: operation,
        entity: node,
        context,
        where: { varName, node },
    });
    if (whereAuth[0]) {
        const authQuery = new CypherBuilder.RawCypher(whereAuth[0], whereAuth[1] as Record<string, any>);
        matchQuery.where(authQuery);
    }

    const result = matchQuery.build();
    cyphers.push(result.cypher);
    cypherParams = { ...cypherParams, ...result.params };

    return [cyphers.join("\n"), cypherParams];
}

export default translateTopLevelMatch;
