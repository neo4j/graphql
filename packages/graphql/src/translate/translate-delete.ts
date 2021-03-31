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
import { Context, GraphQLWhereArg } from "../types";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createWhereAndParams from "./create-where-and-params";
import createAuthAndParams from "./create-auth-and-params";
import createDeleteAndParams from "./create-delete-and-params";

function translateDelete({ context, node }: { context: Context; node: Node }): [string, any] {
    const { resolveTree } = context;
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const deleteInput = resolveTree.args.delete;
    const varName = "this";
    const matchStr = `MATCH (${varName}:${node.name})`;
    let whereStr = "";
    let allowStr = "";
    let deleteStr = "";
    let cypherParams: { [k: string]: any } = {};
    const whereStrs: string[] = [];

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
        operation: "DELETE",
        entity: node,
        context,
        where: { varName, node },
    });
    if (whereAuth[0]) {
        whereStrs.push(whereAuth[0]);
        cypherParams = { ...cypherParams, ...whereAuth[1] };
    }

    if (whereStrs.length) {
        whereStr = `WHERE ${whereStrs.join(" AND ")}`;
    }

    const allowAuth = createAuthAndParams({
        operation: "DELETE",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
    });
    if (allowAuth[0]) {
        cypherParams = { ...cypherParams, ...allowAuth[1] };
        allowStr = `WITH ${varName}\nCALL apoc.util.validate(NOT(${allowAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

    if (deleteInput) {
        const deleteAndParams = createDeleteAndParams({
            context,
            node,
            deleteInput,
            varName,
            parentVar: varName,
            withVars: [varName],
        });
        [deleteStr] = deleteAndParams;
        cypherParams = { ...cypherParams, ...deleteAndParams[1] };
    }

    const cypher = [matchStr, whereStr, deleteStr, allowStr, `DETACH DELETE ${varName}`];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

export default translateDelete;
