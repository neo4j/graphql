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
import { GraphQLWhereArg, GraphQLOptionsArg, GraphQLSortArg, Context, ConnectionField, RelationField } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createConnectionAndParams from "./connection/create-connection-and-params";
import createInterfaceProjectionAndParams from "./create-interface-projection-and-params";

function translateRead({ node, context }: { context: Context; node: Node }): [string, any] {
    const { resolveTree } = context;
    const { fieldsByTypeName } = resolveTree;
    const whereInput = resolveTree.args.where as GraphQLWhereArg;
    const optionsInput = resolveTree.args.options as GraphQLOptionsArg;

    const labels = node.getLabelString(context);

    const varName = "this";
    const matchStr = `MATCH (${varName}${labels})`;
    let whereStr = "";
    let authStr = "";
    let offsetStr = "";
    let limitStr = "";
    let sortStr = "";
    let projAuth = "";
    let projStr = "";
    let cypherParams: { [k: string]: any } = {};
    const whereStrs: string[] = [];
    const connectionStrs: string[] = [];
    const interfaceStrs: string[] = [];

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
        operation: "READ",
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
        operation: "READ",
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
        matchStr,
        whereStr,
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
