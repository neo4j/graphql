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

import { AUTH_FORBIDDEN_ERROR } from "../../constants";
import createAuthAndParams from "../create-auth-and-params";
import { Context } from "../../types";
import { Node } from "../../classes";

export function createFieldAggregationAuth({
    node,
    context,
    subQueryNodeAlias,
}: {
    node: Node;
    context: Context;
    subQueryNodeAlias: string;
}) {
    const varName = subQueryNodeAlias;
    let cypherParams: { [k: string]: any } = {};
    const whereStrs: string[] = [];
    const cypherStrs: string[] = [];

    const whereAuth = createAuthAndParams({
        operation: "READ",
        entity: node,
        context,
        where: { varName, node },
        escapeQuotes: true,
    });
    if (whereAuth[0]) {
        whereStrs.push(whereAuth[0]);
        cypherParams = { ...cypherParams, ...whereAuth[1] };
    }

    if (whereStrs.length) {
        cypherStrs.push(`WHERE ${whereStrs.join(" AND ")}`);
    }

    const allowAuth = createAuthAndParams({
        operation: "READ",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
        escapeQuotes: true,
    });

    if (allowAuth[0]) {
        cypherStrs.push(`CALL apoc.util.validate(NOT(${allowAuth[0]}), \\"${AUTH_FORBIDDEN_ERROR}\\", [0])`);
        cypherParams = { ...cypherParams, ...allowAuth[1] };
    }

    // const selections = fieldsByTypeName[`${node.name}AggregateSelection`];
    // const projections: string[] = [];
    // const authStrs: string[] = [];

    // Do auth first so we can throw out before aggregating
    // Object.entries(selections).forEach((selection) => {
    //     const authField = node.authableFields.find((x) => x.fieldName === selection[0]);
    //     if (authField) {
    //         if (authField.auth) {
    //             const allowAndParams = createAuthAndParams({
    //                 entity: authField,
    //                 operation: "READ",
    //                 context,
    //                 allow: { parentNode: node, varName, chainStr: authField.fieldName },
    //             });
    //             if (allowAndParams[0]) {
    //                 authStrs.push(allowAndParams[0]);
    //                 cypherParams = { ...cypherParams, ...allowAndParams[1] };
    //             }
    //         }
    //     }
    // });

    // if (authStrs.length) {
    //     cypherStrs.push(`CALL apoc.util.validate(NOT(${authStrs.join(" AND ")}), \\"${AUTH_FORBIDDEN_ERROR}\\", [0])`);
    // }
    if (cypherStrs.length > 0) {
        return { cypherStrs, cypherParams };
    }
    return { cypherStrs: [], cypherParams: {} };
}
