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
import createProjectionAndParams from "./create-projection-and-params";
import { GraphQLOptionsArg, Context } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import translateTopLevelMatch from "./translate-top-level-match";
import createOptionsAndParams from "./create-options-and-params";

function translateRead({ node, context }: { context: Context; node: Node }): [string, any] {
    const { resolveTree } = context;
    const varName = "this";

    const optionsInput = (resolveTree.args.options || {}) as GraphQLOptionsArg;

    if (node.queryOptions) {
        optionsInput.limit = node.queryOptions.getLimit(optionsInput.limit);
    }

    const [topLevelMatch, topLevelMatchParams] = translateTopLevelMatch({ node, context, varName, operation: "READ" });

    const [projection, projectionParams, projectionMeta] = createProjectionAndParams({
        node,
        context,
        resolveTree,
        varName,
    });

    const [authAllow, authAllowParams] = createAuthAndParams({
        operations: "READ",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
    });

    const [options, optionsParams] = createOptionsAndParams({ optionsInput, varName });

    const cypherParams = {
        ...topLevelMatchParams,
        ...authAllowParams,
        ...projectionParams,
        ...optionsParams,
    };

    const cypher = [
        topLevelMatch,
        authAllow ? `CALL apoc.util.validate(NOT(${authAllow}), "${AUTH_FORBIDDEN_ERROR}", [0])` : "",
        projectionMeta.authValidateStrs.length
            ? `WITH ${varName}\nCALL apoc.util.validate(NOT(${projectionMeta.authValidateStrs.join(
                  " AND "
              )}), "${AUTH_FORBIDDEN_ERROR}", [0])`
            : "",
        projectionMeta.subQueries.join("\n"),
        `RETURN ${varName} ${projection} as ${varName}`,
        options,
    ];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

export default translateRead;
