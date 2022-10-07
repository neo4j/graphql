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

import type { Integer } from "neo4j-driver";
import { int } from "neo4j-driver";
import { cursorToOffset } from "graphql-relay";
import type { Node } from "../classes";
import createProjectionAndParams, { ProjectionResult } from "./create-projection-and-params";
import type { GraphQLOptionsArg, GraphQLSortArg, Context } from "../types";
import { createAuthAndParams } from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { translateTopLevelMatch } from "./translate-top-level-match";
import * as Cypher from "./cypher-builder/CypherBuilder";

export function translateRead({
    node,
    context,
    isRootConnectionField,
}: {
    context: Context;
    node: Node;
    isRootConnectionField?: boolean;
}): Cypher.CypherResult {
    const { resolveTree } = context;
    const varName = "this";

    let matchAndWhereStr = "";
    let authStr = "";
    let projAuth = "";

    let cypherParams: { [k: string]: any } = context.cypherParams ? { cypherParams: context.cypherParams } : {};
    const interfaceStrs: string[] = [];

    const topLevelMatch = translateTopLevelMatch({
        node,
        context,
        varName,
        operation: "READ",
    });
    matchAndWhereStr = topLevelMatch.cypher;
    cypherParams = { ...cypherParams, ...topLevelMatch.params };

    const projection = createProjectionAndParams({
        node,
        context,
        resolveTree,
        varName,
    });

    cypherParams = { ...cypherParams, ...projection.params };

    if (projection.meta?.authValidateStrs?.length) {
        projAuth = `CALL apoc.util.validate(NOT (${projection.meta.authValidateStrs.join(
            " AND "
        )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

    const allowAndParams = createAuthAndParams({
        operations: "READ",
        entity: node,
        context,
        allow: {
            parentNode: node,
            varName,
        },
    });
    if (allowAndParams[0]) {
        cypherParams = { ...cypherParams, ...allowAndParams[1] };
        authStr = `CALL apoc.util.validate(NOT (${allowAndParams[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

    const projectionSubqueries = Cypher.concat(...projection.subqueries);
    const projectionSubqueriesBeforeSort = Cypher.concat(...projection.subqueriesBeforeSort);

    // TODO: concatenate with "translateTopLevelMatch" result to avoid param collision
    const readQuery = new Cypher.RawCypher((env: Cypher.Environment) => {
        const projectionSubqueriesStr = projectionSubqueries.getCypher(env);
        const subqueriesBeforeSort = projectionSubqueriesBeforeSort.getCypher(env);

        if (isRootConnectionField) {
            return translateRootConnectionField({
                context,
                varName,
                projection,
                subStr: {
                    projectionSubqueries: projectionSubqueriesStr,
                    matchAndWhereStr,
                    authStr,
                    projAuth,
                    interfaceStrs,
                    subqueriesBeforeSort,
                },
            });
        }

        return translateRootField({
            context,
            varName,
            projection,
            node,
            subStr: {
                projectionSubqueries: projectionSubqueriesStr,
                matchAndWhereStr,
                authStr,
                projAuth,
                interfaceStrs,
                subqueriesBeforeSort,
            },
        });
    });
    const result = readQuery.build(varName);
    return {
        cypher: result.cypher,
        params: { ...cypherParams, ...result.params },
    };
}

function translateRootField({
    context,
    varName,
    projection,
    node,
    subStr,
}: {
    node: Node;
    context: Context;
    varName: string;
    projection: ProjectionResult;
    subStr: {
        matchAndWhereStr: string;
        authStr: string;
        projAuth: string;
        interfaceStrs: string[];
        projectionSubqueries: string;
        subqueriesBeforeSort: string;
    };
}): [string, Record<string, any>] {
    const { resolveTree } = context;

    const optionsInput = (resolveTree.args.options || {}) as GraphQLOptionsArg;

    let limit: number | Integer | undefined = optionsInput.limit;
    if (node.queryOptions) {
        limit = node.queryOptions.getLimit(optionsInput.limit);
    }

    const hasLimit = Boolean(limit) || limit === 0;
    const params = {} as Record<string, any>;
    const hasOffset = Boolean(optionsInput.offset) || optionsInput.offset === 0;

    const sortOffsetLimit: string[] = [`WITH *`];

    if (optionsInput.sort && optionsInput.sort.length) {
        const sortArr = optionsInput.sort.reduce((res: string[], sort: GraphQLSortArg) => {
            return [
                ...res,
                ...Object.entries(sort).map(([field, direction]) => {
                    if (node.cypherFields.some((f) => f.fieldName === field)) {
                        return `${varName}_${field} ${direction}`;
                    }
                    return `${varName}.${field} ${direction}`;
                }),
            ];
        }, []);

        sortOffsetLimit.push(`ORDER BY ${sortArr.join(", ")}`);
    }

    if (hasOffset) {
        params[`${varName}_offset`] = optionsInput.offset;
        sortOffsetLimit.push(`SKIP $${varName}_offset`);
    }

    if (hasLimit) {
        params[`${varName}_limit`] = limit;
        sortOffsetLimit.push(`LIMIT $${varName}_limit`);
    }

    const withStrs = subStr.projAuth ? [`WITH *`, subStr.projAuth] : [];

    const returnStrs = [`RETURN ${varName} ${projection.projection} as ${varName}`];

    const cypher: string[] = [
        subStr.matchAndWhereStr,
        subStr.subqueriesBeforeSort,
        ...(sortOffsetLimit.length > 1 ? sortOffsetLimit : []),
        subStr.authStr,
        ...withStrs,
        ...subStr.interfaceStrs,
        subStr.projectionSubqueries,
        ...returnStrs,
    ];

    return [cypher.filter(Boolean).join("\n"), params];
}

function translateRootConnectionField({
    context,
    varName,
    subStr,
    projection,
}: {
    context: Context;
    varName: string;
    projection: ProjectionResult;
    subStr: {
        matchAndWhereStr: string;
        authStr: string;
        projAuth: string;
        interfaceStrs: string[];
        projectionSubqueries: string;
        subqueriesBeforeSort: string;
    };
}): [string, Record<string, any>] {
    const { resolveTree } = context;

    const afterInput = resolveTree.args.after as string | undefined;
    const firstInput = resolveTree.args.first as Integer | number | undefined;
    const sortInput = resolveTree.args.sort as GraphQLSortArg[];

    const cypherParams = {} as Record<string, any>;

    const hasAfter = Boolean(afterInput);
    const hasFirst = Boolean(firstInput);
    const hasSort = Boolean(sortInput && sortInput.length);

    const sortCypherFields = projection.meta?.cypherSortFields ?? [];

    let sortStr = "";
    if (hasSort) {
        const sortArr = sortInput.reduce((res: string[], sort: GraphQLSortArg) => {
            return [
                ...res,
                ...Object.entries(sort).map(([field, direction]) => {
                    // if the sort arg is a cypher field, substitaute "edges" for varName
                    const varOrEdgeName = sortCypherFields.find((x) => x === field) ? "edge.node" : varName;
                    return `${varOrEdgeName}.${field} ${direction}`;
                }),
            ];
        }, []);

        sortStr = `ORDER BY ${sortArr.join(", ")}`;
    }

    let offsetStr = "";
    if (hasAfter && typeof afterInput === "string") {
        const offset = cursorToOffset(afterInput) + 1;
        if (offset && offset !== 0) {
            offsetStr = `SKIP $${varName}_offset`;
            cypherParams[`${varName}_offset`] = int(offset);
        }
    }

    let limitStr = "";
    if (hasFirst) {
        limitStr = `LIMIT $${varName}_limit`;
        cypherParams[`${varName}_limit`] = firstInput;
    }

    const withStrs = subStr.projAuth ? [`WITH ${varName}`, subStr.projAuth] : [];
    const cypher = [
        subStr.matchAndWhereStr,
        subStr.authStr,
        ...withStrs,
        `WITH COLLECT(this) as edges`,
        `WITH edges, size(edges) as totalCount`,
        `UNWIND edges as ${varName}`,
        `WITH ${varName}, totalCount`,
        subStr.subqueriesBeforeSort,
        subStr.projectionSubqueries,
        `WITH { node: ${varName} ${projection.projection} } as edge, totalCount, ${varName}`,
        ...(sortStr ? [sortStr] : []),
        ...(offsetStr ? [offsetStr] : []),
        ...(limitStr ? [limitStr] : []),
        `WITH COLLECT(edge) as edges, totalCount`,
        ...subStr.interfaceStrs,
        `RETURN { edges: edges, totalCount: totalCount } as ${varName}`,
    ];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}
