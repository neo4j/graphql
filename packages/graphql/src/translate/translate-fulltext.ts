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

import { translateRead } from "./translate-read";
import type { Context } from "../types";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import type { Node } from "../classes";

export function translateFulltext({ node, context }: { node: Node; context: Context }): CypherBuilder.CypherResult {
    const scoreVariable = new CypherBuilder.Variable();
    const { resolveTree } = context;
    let result: CypherBuilder.CypherResult;
    if (resolveTree.fieldsByTypeName[node.fulltextTypeNames.result][node.name]) {
        context.fulltextIndex.scoreVariable = scoreVariable;
        context.resolveTree = { ...resolveTree.fieldsByTypeName[node.fulltextTypeNames.result][node.name] };
        context.resolveTree.args = { ...resolveTree.args };
        // Sort context
        context.resolveTree.args.options = context.resolveTree.args.options || {};
        if (resolveTree.args.sort?.[node.name]) {
            (context.resolveTree.args.options as Record<string, any>).sort = [
                {
                    ...resolveTree.args.sort?.[node.name],
                },
            ];
        }
        result = translateRead({ node, context }, node.name);
    } else {
        result = translateRead({ node, context }, node.name);
    }
    if (resolveTree.fieldsByTypeName[node.fulltextTypeNames.result].score) {
        // TODO move into translateRead so var0 can be replaced by the actual var reference
        result.cypher = `${result.cypher}, var0 AS score`;
    }
    // TODO fix this broken sort code.
    // if ((resolveTree.args.sort as Record<string, string>)?.score) {
    //     // TODO move into translateRead so this can be done with cypher builder
    //     result.cypher = `${result.cypher}\nORDER BY score ${(resolveTree.args.sort as Record<string, string>)?.score}`;
    // } else {
    //     result.cypher = `${result.cypher}\nORDER BY score DESC`;
    // }
    return result;
}
