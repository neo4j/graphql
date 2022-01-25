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
import { GraphQLOptionsArg, GraphQLSortArg, Context, ConnectionField, RelationField } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createConnectionAndParams from "./connection/create-connection-and-params";
import createInterfaceProjectionAndParams from "./create-interface-projection-and-params";
import translateTopLevelMatch from "./translate-top-level-match";

function translateRead({ node, context }: { context: Context; node: Node }): [string, any] {
    const { resolveTree } = context;
    const varName = "this";

    let matchAndWhereStr = "";
    let authStr = "";
    let projAuth = "";
    let projStr = "";

    const optionsInput = resolveTree.args.options as GraphQLOptionsArg;
    let limitStr = "";
    let offsetStr = "";
    let sortStr = "";

    let cypherParams: { [k: string]: any } = {};
    const connectionStrs: string[] = [];
    const interfaceStrs: string[] = [];

    const topLevelMatch = translateTopLevelMatch({ node, context, varName, operation: "READ" });
    matchAndWhereStr = topLevelMatch[0];
    cypherParams = { ...cypherParams, ...topLevelMatch[1] };

    const projection = createProjectionAndParams({
        node,
        context,
        resolveTree,
        varName,
    });
    [projStr] = projection;
    cypherParams = { ...cypherParams, ...projection[1] };
    if (projection[2]?.authValidateStrs?.length) {
        projAuth = `CALL apoc.util.validate(NOT(${projection[2].authValidateStrs.join(
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
        projection[2].interfaceFields.forEach((interfaceResolveTree) => {
            const relationshipField = node.relationFields.find(
                (x) => x.fieldName === interfaceResolveTree.name
            ) as RelationField;
            const interfaceProjection = createInterfaceProjectionAndParams({
                resolveTree: interfaceResolveTree,
                field: relationshipField,
                context,
                node,
                nodeVariable: varName,
            });
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
        authStr = `CALL apoc.util.validate(NOT(${allowAndParams[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
    }

    if (optionsInput) {
        const hasOffset = Boolean(optionsInput.offset) || optionsInput.offset === 0;
        const hasLimit = Boolean(optionsInput.limit) || optionsInput.limit === 0;

        if (hasOffset) {
            offsetStr = `SKIP $${varName}_offset`;
            cypherParams[`${varName}_offset`] = optionsInput.offset;
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
        matchAndWhereStr,
        authStr,
        ...(projAuth ? [`WITH ${varName}`, projAuth] : []),
        ...connectionStrs,
        ...interfaceStrs,
        `RETURN ${varName} ${projStr} as ${varName}`,
        ...(sortStr ? [sortStr] : []),
        offsetStr,
        limitStr,
    ];

    return [cypher.filter(Boolean).join("\n"), cypherParams];
}

export default translateRead;
