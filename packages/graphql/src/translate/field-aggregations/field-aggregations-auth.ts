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

import { ResolveTree } from "graphql-parse-resolve-info";
import { AUTH_FORBIDDEN_ERROR } from "../../constants";
import createAuthAndParams from "../create-auth-and-params";
import { Context } from "../../types";
import { Node, Relationship } from "../../classes";

export type AggregationAuth = {
    query: string;
    params: Record<string, string>;
    whereQuery: string;
};

export function createFieldAggregationAuth({
    node,
    context,
    subQueryNodeAlias,
    nodeFields,
}: {
    node: Node;
    context: Context;
    subQueryNodeAlias: string;
    nodeFields: Record<string, ResolveTree> | undefined;
    relationship: Relationship;
}): AggregationAuth {
    const varName = subQueryNodeAlias;
    let cypherParams: { [k: string]: any } = {};
    const whereStrs: string[] = [];
    const cypherStrs: string[] = [];

    const whereAuth = createAuthAndParams({
        operation: "READ",
        entity: node,
        context,
        where: { varName, node },
        escapeQuotes: false,
    });

    if (whereAuth[0]) {
        whereStrs.push(whereAuth[0]);
        cypherParams = { ...cypherParams, ...whereAuth[1] };
    }

    const allowAuth = createAuthAndParams({
        operation: "READ",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
        escapeQuotes: false,
    });

    if (allowAuth[0]) {
        cypherStrs.push(`CALL apoc.util.validate(NOT(${allowAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
        cypherParams = { ...cypherParams, ...allowAuth[1] };
    }

    const nodeAuth = getFieldAuthQueries(nodeFields, node, context, node, varName);

    const authStrs = [...nodeAuth.query];
    cypherParams = { ...cypherParams, ...nodeAuth.params };
    if (authStrs.length) {
        cypherStrs.push(`CALL apoc.util.validate(NOT(${authStrs.join(" AND ")}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
    }
    if (cypherStrs.length > 0 || whereStrs.length > 0) {
        return { query: cypherStrs.join("\n"), params: cypherParams, whereQuery: whereStrs.join("\n") };
    }
    return { query: "", params: {}, whereQuery: "" };
}

function getFieldAuthQueries(
    fields: Record<string, ResolveTree> | undefined,
    nodeOrRelation: Node,
    context: Context,
    parentNode: Node,
    varName: string
): { query: string[]; params: Record<string, string> } {
    const authStrs: string[] = [];
    let authParams: Record<string, string> = {};
    if (fields) {
        Object.entries(fields).forEach((selection) => {
            const authField = nodeOrRelation.authableFields.find((x) => x.fieldName === selection[0]);
            if (authField) {
                if (authField.auth) {
                    const allowAndParams = createAuthAndParams({
                        entity: authField,
                        operation: "READ",
                        context,
                        allow: { parentNode, varName, chainStr: authField.fieldName },
                        escapeQuotes: false,
                    });
                    if (allowAndParams[0]) {
                        authStrs.push(allowAndParams[0]);
                        authParams = { ...authParams, ...allowAndParams[1] };
                    }
                }
            }
        });
    }

    return {
        query: authStrs,
        params: authParams,
    };
}
