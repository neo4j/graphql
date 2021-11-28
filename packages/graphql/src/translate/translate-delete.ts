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
import WithProjector from "../classes/WithProjector";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { Context } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import createDeleteAndParams from "./create-delete-and-params";
import translateTopLevelMatch from "./translate-top-level-match";

function translateDelete({ context, node }: { context: Context; node: Node }): [string, any] {
    const { resolveTree } = context;
    const deleteInput = resolveTree.args.delete;
    const varName = "this";
    let matchAndWhereStr = "";
    let allowStr = "";
    let deleteStr = "";
    let cypherParams: { [k: string]: any } = {};

    const topLevelMatch = translateTopLevelMatch({ node, context, varName, operation: "DELETE" });
    matchAndWhereStr = topLevelMatch[0];
    cypherParams = { ...cypherParams, ...topLevelMatch[1] };
    const withProjector = new WithProjector({ variables: [ varName ] });

    const allowAuth = createAuthAndParams({
        operations: "DELETE",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
    });
    if (allowAuth[0]) {
        cypherParams = { ...cypherParams, ...allowAuth[1] };
        allowStr = withProjector.nextWith();
        allowStr = `CALL apoc.util.validate(NOT(${allowAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

    if (deleteInput) {
        const deleteAndParams = createDeleteAndParams({
            context,
            node,
            deleteInput,
            varName,
            parentVar: varName,
            withProjector,
            parameterPrefix: `${varName}_${resolveTree.name}.args.delete`,
        });
        [deleteStr] = deleteAndParams;
        cypherParams = {
            ...cypherParams,
            ...(deleteStr.includes(resolveTree.name)
                ? { [`${varName}_${resolveTree.name}`]: { args: { delete: deleteInput } } }
                : {}),
            ...deleteAndParams[1],
        };
    }

    withProjector.markMutationMeta({
        type: 'Deleted',
        idVar: `id(${ varName })`,
        name: node.name,
    });

    const cypher = [
        matchAndWhereStr,
        deleteStr,
        allowStr,
        withProjector.nextWith(),
        `DETACH DELETE ${varName}`,
        withProjector.nextReturn([], {
            excludeVariables: withProjector.variables,
        }),
    ];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

export default translateDelete;
