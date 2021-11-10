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

import { Node } from "../classes";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { Context } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import translateTopLevelMatch from "./translate-top-level-match";

function translateCount({ node, context }: { node: Node; context: Context }): [string, any] {
    let cypherParams: { [k: string]: any } = {};
    const cypherStrs: string[] = [];
    const varName = "this";

    const topLevelMatch = translateTopLevelMatch({ node, context, varName, operation: "READ" });
    cypherStrs.push(topLevelMatch[0]);
    cypherParams = { ...cypherParams, ...topLevelMatch[1] };

    const allowAuth = createAuthAndParams({
        operation: "READ",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
    });
    if (allowAuth[0]) {
        cypherStrs.push(`CALL apoc.util.validate(NOT(${allowAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
        cypherParams = { ...cypherParams, ...allowAuth[1] };
    }

    cypherStrs.push(`RETURN count(${varName})`);

    return [cypherStrs.filter(Boolean).join("\n"), cypherParams];
}

export default translateCount;
