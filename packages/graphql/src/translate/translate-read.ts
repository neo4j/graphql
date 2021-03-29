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
import createWhereAndParams from "./create-where-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import { GraphQLWhereArg, GraphQLOptionsArg, GraphQLSortArg, Context } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";

function translateRead({ node, context }: { context: Context; node: Node }): [string, any] {
    const { resolveTree } = context;
    const { fieldsByTypeName } = resolveTree;
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const optionsInput = resolveTree.args.options as GraphQLOptionsArg;

    const varName = "this";
    const matchStr = `MATCH (${varName}:${node.name})`;
    let whereStr = "";
    let authStr = "";
    let skipStr = "";
    let limitStr = "";
    let sortStr = "";
    let projAuth = "";
    let projStr = "";
    let cypherParams: { [k: string]: any } = {};
    const whereStrs: string[] = [];

    const projection = createProjectionAndParams({
        node,
        context,
        fieldsByTypeName,
        varName,
    });
    [projStr] = projection;
    cypherParams = { ...cypherParams, ...projection[1] };
    if (projection[2]?.authValidateStrs?.length) {
        projAuth = `CALL apoc.util.validate(NOT(${projection[2].authValidateStrs.join(
            " AND "
        )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
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
        operation: "read",
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

    const allowAndParams = createAuthAndParams({
        operation: "read",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
    });
    if (allowAndParams[0]) {
        cypherParams = { ...cypherParams, ...allowAndParams[1] };
        authStr = `CALL apoc.util.validate(NOT(${allowAndParams[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

    if (optionsInput) {
        const hasSkip = Boolean(optionsInput.skip) || optionsInput.skip === 0;
        const hasLimit = Boolean(optionsInput.limit) || optionsInput.limit === 0;

        if (hasSkip) {
            skipStr = `SKIP $${varName}_skip`;
            cypherParams[`${varName}_skip`] = optionsInput.skip;
        }

        if (hasLimit) {
            limitStr = `LIMIT $${varName}_limit`;
            cypherParams[`${varName}_limit`] = optionsInput.limit;
        }

        if (optionsInput.sort && optionsInput.sort.length) {
            const sortArr = optionsInput.sort.reduce((res: string[], sort: GraphQLSortArg) => {
                return [
                    ...res,
                    ...Object.entries(sort).map(([field, direction]) => {
                        return `${varName}.${field} ${direction}`;
                    }),
                ];
            }, []);

            sortStr = `ORDER BY ${sortArr.join(", ")}`;
        }
    }

    const cypher = [
        matchStr,
        whereStr,
        authStr,
        ...(sortStr ? [`WITH ${varName}`, sortStr] : []),
        ...(projAuth ? [`WITH ${varName}`, projAuth] : []),
        `RETURN ${varName} ${projStr} as ${varName}`,
        skipStr,
        limitStr,
    ];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

export default translateRead;
