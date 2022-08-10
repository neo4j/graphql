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
import createProjectionAndParams, { ProjectionMeta } from "./create-projection-and-params";
import type { GraphQLOptionsArg, GraphQLSortArg, Context, ConnectionField, RelationField } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createConnectionAndParams from "./connection/create-connection-and-params";
import createInterfaceProjectionAndParams from "./create-interface-projection-and-params";
import { translateTopLevelMatch } from "./translate-top-level-match";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";

export function translateRead({
    node,
    context,
    isRootConnectionField,
}: {
    context: Context;
    node: Node;
    isRootConnectionField?: boolean;
}): CypherBuilder.CypherResult {
    const { resolveTree } = context;
    const varName = "this";

    let matchAndWhereStr = "";
    let authStr = "";
    let projAuth = "";

    let cypherParams: { [k: string]: any } = {};
    const connectionStrs: string[] = [];
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
        isRootConnectionField,
    });
    cypherParams = { ...cypherParams, ...projection[1] };

    if (projection[2]?.authValidateStrs?.length) {
        projAuth = `CALL apoc.util.validate(NOT (${projection[2].authValidateStrs.join(
            " AND "
        )}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

    if (projection[2]?.connectionFields?.length) {
        projection[2].connectionFields.forEach((connectionResolveTree) => {
            const connectionField = node.connectionFields.find(
                (x) => x.fieldName === connectionResolveTree.name
            ) as ConnectionField;
            const connection = createConnectionAndParams({
                resolveTree: connectionResolveTree,
                field: connectionField,
                context,
                nodeVariable: varName,
            });
            connectionStrs.push(connection[0]);
            cypherParams = { ...cypherParams, ...connection[1] };
        });
    }

    if (projection[2]?.interfaceFields?.length) {
        const prevRelationshipFields: string[] = [];
        projection[2].interfaceFields.forEach((interfaceResolveTree) => {
            const relationshipField = node.relationFields.find(
                (x) => x.fieldName === interfaceResolveTree.name
            ) as RelationField;
            const interfaceProjection = createInterfaceProjectionAndParams({
                resolveTree: interfaceResolveTree,
                field: relationshipField,
                context,
                nodeVariable: varName,
                withVars: prevRelationshipFields,
            });
            prevRelationshipFields.push(relationshipField.dbPropertyName || relationshipField.fieldName);
            interfaceStrs.push(interfaceProjection.cypher);
            cypherParams = { ...cypherParams, ...interfaceProjection.params };
        });
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
    // TODO: concatenate with "translateTopLevelMatch" result to avoid param collision
    const readQuery = new CypherBuilder.RawCypher((_env: CypherBuilder.Environment) => {
        if (isRootConnectionField) {
            return translateRootConnectionField({
                context,
                varName,
                projection,
                subStr: {
                    matchAndWhereStr,
                    authStr,
                    projAuth,
                    connectionStrs,
                    interfaceStrs,
                },
            });
        }

        return translateRootField({
            context,
            varName,
            projection,
            node,
            subStr: {
                matchAndWhereStr,
                authStr,
                projAuth,
                connectionStrs,
                interfaceStrs,
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
    projection: [string, Record<string, any>, ProjectionMeta | undefined];
    subStr: {
        matchAndWhereStr: string;
        authStr: string;
        projAuth: string;
        connectionStrs: string[];
        interfaceStrs: string[];
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

    const sortCypherFields = projection[2]?.cypherSortFields ?? [];
    const sortCypherProj = sortCypherFields.map(({ alias, apocStr }) => `${apocStr} AS ${alias}`);
    const sortOffsetLimit: string[] = [[`WITH ${varName}`, ...sortCypherProj].join(", ")];

    if (optionsInput.sort && optionsInput.sort.length) {
        const sortArr = optionsInput.sort.reduce((res: string[], sort: GraphQLSortArg) => {
            return [
                ...res,
                ...Object.entries(sort).map(([field, direction]) => {
                    if (node.cypherFields.some((f) => f.fieldName === field)) {
                        return `${field} ${direction}`;
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

    const withStrs = subStr.projAuth ? [`WITH ${varName}`, subStr.projAuth] : [];

    const returnStrs = [`RETURN ${varName} ${projection[0]} as ${varName}`];

    const cypher: string[] = [
        subStr.matchAndWhereStr,
        ...(sortOffsetLimit.length > 1 ? sortOffsetLimit : []),
        subStr.authStr,
        ...withStrs,
        ...subStr.connectionStrs,
        ...subStr.interfaceStrs,
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
    projection: [string, Record<string, any>, ProjectionMeta | undefined];
    subStr: {
        matchAndWhereStr: string;
        authStr: string;
        projAuth: string;
        connectionStrs: string[];
        interfaceStrs: string[];
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

    const sortCypherFields = projection[2]?.cypherSortFields ?? [];
    const sortCypherProj = sortCypherFields.map(({ alias, apocStr }) => `${alias}: ${apocStr}`);

    let sortStr = "";
    if (hasSort) {
        const sortArr = sortInput.reduce((res: string[], sort: GraphQLSortArg) => {
            return [
                ...res,
                ...Object.entries(sort).map(([field, direction]) => {
                    // if the sort arg is a cypher field, substitaute "edges" for varName
                    const varOrEdgeName = sortCypherFields.find((x) => x.alias === field) ? "edges" : varName;
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

    const returnStrs: string[] = [
        `WITH COLLECT({ node: ${varName} ${projection[0]} }) as edges, totalCount`,
        `RETURN { edges: edges, totalCount: totalCount } as ${varName}`,
    ];

    const withStrs = subStr.projAuth ? [`WITH ${varName}`, subStr.projAuth] : [];
    const cypher = [
        "CALL {",
        subStr.matchAndWhereStr,
        subStr.authStr,
        ...withStrs,
        `WITH COLLECT(this) as edges`,
        `WITH edges, size(edges) as totalCount`,
        `UNWIND edges as ${varName}`,
        `WITH ${varName}, totalCount, { ${sortCypherProj.join(", ")}} as edges`,
        `RETURN ${varName}, totalCount, edges`,
        ...(sortStr ? [sortStr] : []),
        ...(offsetStr ? [offsetStr] : []),
        ...(limitStr ? [limitStr] : []),
        "}",
        ...subStr.connectionStrs,
        ...subStr.interfaceStrs,
        ...returnStrs,
    ];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}
