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

import { dedent } from "graphql-compose";
import { Node } from "../classes";
import { AuthOperations, Context, GraphQLWhereArg } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import createWhereAndParams from "./create-where-and-params";

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
    const fulltextInput = (resolveTree.args.fulltext || {}) as Record<string, { phrase: string; score_EQUAL?: number }>;
    const whereStrs: string[] = [];

    if (!Object.entries(fulltextInput).length) {
        cyphers.push(`MATCH (${varName}${node.getLabelString(context)})`);
    } else {
        if (Object.entries(fulltextInput).length > 1) {
            throw new Error("Can only call one search at any given time");
        }

        const [indexName, indexInput] = Object.entries(fulltextInput)[0];
        const baseParamName = `${varName}_fulltext_${indexName}`;
        const paramPhraseName = `${baseParamName}_phrase`;
        cypherParams[paramPhraseName] = indexInput.phrase;

        cyphers.push(
            dedent(`
                CALL db.index.fulltext.queryNodes(
                    "${indexName}",
                    $${paramPhraseName}
                ) YIELD node as this, score as score
            `)
        );

        if (node.nodeDirective?.additionalLabels?.length) {
            node.getLabels(context).forEach((label) => {
                whereStrs.push(`"${label.replace(/`/g, "")}" IN labels(${varName})`);
            });
        }

        if (node.fulltextDirective) {
            const index = node.fulltextDirective.indexes.find((i) => i.name === indexName);
            let thresholdParamName = baseParamName;
            let threshold: number | undefined;

            if (indexInput.score_EQUAL) {
                thresholdParamName = `${thresholdParamName}_score_EQUAL`;
                threshold = indexInput.score_EQUAL;
            } else if (index?.defaultThreshold) {
                thresholdParamName = `${thresholdParamName}_defaultThreshold`;
                threshold = index.defaultThreshold;
            }

            if (threshold !== undefined) {
                cypherParams[thresholdParamName] = threshold;
                whereStrs.push(`score = ${thresholdParamName}`);
            }
        }
    }

    if (whereInput) {
        const where = createWhereAndParams({
            whereInput,
            varName,
            node,
            context,
            recursing: true,
        });
        if (where[0]) {
            whereStrs.push(where[0]);
            cypherParams = { ...cypherParams, ...where[1] };
        }
    }

    const whereAuth = createAuthAndParams({
        operation,
        entity: node,
        context,
        where: { varName, node },
    });
    if (whereAuth[0]) {
        whereStrs.push(whereAuth[0]);
        cypherParams = { ...cypherParams, ...whereAuth[1] };
    }

    if (whereStrs.length) {
        cyphers.push(`WHERE ${whereStrs.join(" AND ")}`);
    }

    return [cyphers.join("\n"), cypherParams];
}

export default translateTopLevelMatch;
