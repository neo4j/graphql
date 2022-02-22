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
import { Node } from "../../classes";

export type AggregationAuth = {
    query: string;
    params: Record<string, string>;
    whereQuery: string;
};

type PartialAuthQueries = {
    queries: string[];
    params: Record<string, string>;
};

export function createFieldAggregationAuth({
    node,
    context,
    subqueryNodeAlias,
    nodeFields,
}: {
    node: Node;
    context: Context;
    subqueryNodeAlias: string;
    nodeFields: Record<string, ResolveTree> | undefined;
}): AggregationAuth {
    const allowAuth = getAllowAuth({ node, context, varName: subqueryNodeAlias });
    const whereAuth = getWhereAuth({ node, context, varName: subqueryNodeAlias });
    const nodeAuth = getFieldAuth({ fields: nodeFields, node, context, varName: subqueryNodeAlias });

    const cypherStrs = [...nodeAuth.queries, ...allowAuth.queries];
    const cypherParams = { ...nodeAuth.params, ...allowAuth.params, ...whereAuth.params };

    return { query: cypherStrs.join("\n"), params: cypherParams, whereQuery: whereAuth.queries.join("\n") };
}

function getAllowAuth({
    node,
    context,
    varName,
}: {
    node: Node;
    context: Context;
    varName: string;
}): PartialAuthQueries {
    const allowAuth = createAuthAndParams({
        operations: "READ",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
        escapeQuotes: false,
    });

    if (allowAuth[0]) {
        return {
            queries: [`CALL apoc.util.validate(NOT(${allowAuth[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`],
            params: allowAuth[1],
        };
    }

    return {
        queries: [],
        params: {},
    };
}

function getWhereAuth({
    node,
    context,
    varName,
}: {
    node: Node;
    context: Context;
    varName: string;
}): PartialAuthQueries {
    const whereAuth = createAuthAndParams({
        operations: "READ",
        entity: node,
        context,
        where: { varName, node },
    });

    if (whereAuth[0]) {
        return {
            queries: [whereAuth[0]],
            params: whereAuth[1],
        };
    }

    return {
        queries: [],
        params: {},
    };
}

function getFieldAuth({
    fields = {},
    node,
    context,
    varName,
}: {
    fields: Record<string, ResolveTree> | undefined;
    node: Node;
    context: Context;
    varName: string;
}): PartialAuthQueries {
    const authStrs: string[] = [];
    let authParams: Record<string, string> = {};

    Object.entries(fields).forEach((selection) => {
        const authField = node.authableFields.find((x) => x.fieldName === selection[0]);
        if (authField && authField.auth) {
            const allowAndParams = createAuthAndParams({
                entity: authField,
                operations: "READ",
                context,
                allow: { parentNode: node, varName, chainStr: authField.fieldName },
                escapeQuotes: false,
            });
            if (allowAndParams[0]) {
                authStrs.push(allowAndParams[0]);
                authParams = { ...authParams, ...allowAndParams[1] };
            }
        }
    });

    if (authStrs.length > 0) {
        return {
            queries: [`CALL apoc.util.validate(NOT(${authStrs.join(" AND ")}), "${AUTH_FORBIDDEN_ERROR}", [0])`],
            params: authParams,
        };
    }
    return {
        queries: [],
        params: {},
    };
}
