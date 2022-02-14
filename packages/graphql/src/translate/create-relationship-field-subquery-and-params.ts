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
import { mergeDeep } from "@graphql-tools/utils";
import { Context, GraphQLOptionsArg, GraphQLWhereArg, RelationField } from "../types";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createAuthAndParams from "./create-auth-and-params";
// eslint-disable-next-line import/no-cycle
import createProjectionAndParams from "./create-projection-and-params";
import createElementWhereAndParams from "./where/create-element-where-and-params";
import createOptionsAndParams from "./create-options-and-params";
import { getRelationshipDirection } from "./cypher-builder/get-relationship-direction";
import filterInterfaceNodes from "../utils/filter-interface-nodes";

function createRelationshipFieldSubqueryAndParams({
    resolveTree,
    field,
    context,
    nodeVariable,
}: {
    field: RelationField;
    context: Context;
    nodeVariable: string;
    resolveTree: ResolveTree;
    parameterPrefix?: string;
}): [string, Record<string, any>] {
    let params = {};
    const targetVariable = `${nodeVariable}_${resolveTree.alias}`;

    const optionsInput = (resolveTree.args.options ?? {}) as GraphQLOptionsArg;
    const whereInput = (resolveTree.args.where ?? {}) as GraphQLWhereArg;

    const isAbstractType = Boolean(field.union || field.interface);

    const nodeSubquery = context.nodes
        .filter(
            (node) =>
                node.name === field.typeMeta.name ||
                (field.interface?.implementations?.includes(node.name) && filterInterfaceNodes({ node, whereInput })) ||
                (field.union?.nodes?.includes(node.name) &&
                    (!resolveTree.args.where ||
                        Object.prototype.hasOwnProperty.call(resolveTree.args.where, node.name)))
        )
        .map((node) => {
            const sourceNode = `(${nodeVariable})`;

            const { inStr, outStr } = getRelationshipDirection(field, resolveTree.args);
            const targetRelationship = `${inStr}[:${field.type}]${outStr}`;

            const labels = node.getLabelString(context);
            const targetNode = `(${targetVariable}${labels})`;

            const queryLimit = node.queryOptions?.getLimit(optionsInput.limit);
            if (queryLimit) {
                if (!isAbstractType) {
                    optionsInput.limit = queryLimit;
                } else {
                    params = { ...params, [`${targetVariable}_${node.name}_limit`]: queryLimit };
                }
            }

            // Auth

            const [authAllow, authAllowParams] = createAuthAndParams({
                entity: node,
                operations: "READ",
                context,
                allow: {
                    parentNode: node,
                    varName: targetVariable,
                },
            });

            // Auth Where

            const [authWhere, authWhereParams] = createAuthAndParams({
                entity: node,
                operations: "READ",
                context,
                where: {
                    varName: targetVariable,
                    chainStr: isAbstractType ? `${targetVariable}_${node.name}` : "",
                    node,
                },
            });

            // Where
            const [nodeWhere, nodeWhereParams] = createElementWhereAndParams({
                whereInput: transformWhere({ field, whereInput, nodeName: node.name }),
                varName: targetVariable,
                element: node,
                context,
                parameterPrefix: isAbstractType ? `${targetVariable}.${node.name}` : targetVariable,
            });

            // Projection
            const [projection, projectionParams, projectionMeta] = createProjectionAndParams({
                resolveTree,
                node,
                context,
                varName: targetVariable,
                resolveType: isAbstractType,
            });

            const where = [
                authAllow ? `apoc.util.validatePredicate(NOT(${authAllow}), "${AUTH_FORBIDDEN_ERROR}", [0])` : "",
                projectionMeta.authValidateStrs.length
                    ? `apoc.util.validatePredicate(NOT(${projectionMeta.authValidateStrs.join(
                          " AND "
                      )}), "${AUTH_FORBIDDEN_ERROR}", [0])`
                    : "",
                nodeWhere,
                authWhere,
            ]
                .filter(Boolean)
                .join(" AND ");

            params = mergeDeep([
                params,
                projectionParams,
                authAllowParams,
                authWhereParams,
                !isEmptyObject(nodeWhereParams)
                    ? {
                          [targetVariable]: transformWhereParams({
                              field,
                              params: nodeWhereParams,
                              nodeName: node.name,
                          }),
                      }
                    : {},
            ]);
            return [
                isAbstractType ? `WITH ${nodeVariable}` : "",
                `OPTIONAL MATCH ${sourceNode}${targetRelationship}${targetNode}`,
                where ? `WHERE ${where}` : "",
                projectionMeta.subQueries.join("\n"),
                `RETURN ${targetVariable} ${projection} AS ${targetVariable}`,
                isAbstractType && queryLimit ? `LIMIT $${targetVariable}_${node.name}_limit` : "",
            ]
                .filter(Boolean)
                .join("\n");
        })
        .join("\nUNION\n");

    const [options, optionsParams] = createOptionsAndParams({
        optionsInput,
        varName: targetVariable,
    });
    params = mergeDeep([params, optionsParams]);

    const subquery = [
        "CALL {",
        `WITH ${nodeVariable}`,
        isAbstractType ? ["CALL {", nodeSubquery, "}"].join("\n") : nodeSubquery,
        isAbstractType ? `RETURN ${targetVariable}` : "",
        options,
        "}",
    ]
        .filter(Boolean)
        .join("\n");

    return [subquery, params];
}

const transformWhere = ({
    field,
    whereInput,
    nodeName,
}: {
    field: RelationField;
    whereInput: GraphQLWhereArg;
    nodeName: string;
}) => {
    if (!(field.union || field.interface)) {
        return whereInput;
    }
    if (field.union) {
        return whereInput[nodeName] ?? {};
    }
    return Object.entries(whereInput)
        .filter(([k]) => !Object.keys(whereInput._on?.[nodeName] ?? {}).includes(k))
        .reduce((args, [k, v]) => {
            if (k !== "_on") {
                return { ...args, [k]: v };
            }
            return { ...args, ...v[nodeName] };
        }, {});
};

const transformWhereParams = ({
    field,
    params,
    nodeName,
}: {
    field: RelationField;
    params: Record<string, any>;
    nodeName: string;
}) => {
    if (!(field.union || field.interface)) {
        return params;
    }
    return { [nodeName]: params };
};

const isEmptyObject = (obj: Record<string, any>) => Object.keys(obj).length === 0;

export default createRelationshipFieldSubqueryAndParams;
