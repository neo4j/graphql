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

import type { Union } from "../classes/Union";
import type Node from "../classes/Node";
import type { Context } from "../types";
import { translateRead } from "./translate-read";

function translateToplevelUnionRead({ union, context }: { union: Union; context: Context }): [string, any] {
    const cypher: string[] = [];
    const returnEntries: string[] = [];
    let cypherParams = {};

    Object.entries(context.resolveTree.fieldsByTypeName).forEach((entry, i) => {
        if (entry[0] === union.name) {
            return;
        }

        const toNode = context.nodes.find((n) => n.name === entry[0]) as Node;
        const whereInput = context.resolveTree.args?.where?.[toNode.name] as Record<string, unknown>;
        const varName = `this_${toNode.name}${i}`;

        const translatedMember = translateRead({
            node: toNode,
            context,
            overrideVarName: varName,
            resolveType: true,
            whereInput,
        });

        cypherParams = { ...cypherParams, ...translatedMember.params };
        // Two CALL so we can collect and ensure that a NULL MATCH does not break query
        cypher.push(`CALL {`);
        cypher.push(`CALL {`);
        cypher.push(translatedMember.cypher);
        cypher.push(`}`);
        cypher.push(`RETURN collect(${varName}) AS ${entry[0]}`);
        cypher.push(`}`);
        returnEntries.push(entry[0]);
    });

    cypher.push(`RETURN ${returnEntries.join(", ")}`);

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

export default translateToplevelUnionRead;
