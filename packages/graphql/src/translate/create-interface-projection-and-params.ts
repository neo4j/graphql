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

import type { ResolveTree } from "graphql-parse-resolve-info";
import { asArray, removeDuplicates } from "../utils/utils";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import type { ConnectionField, Context, GraphQLOptionsArg, InterfaceWhereArg, RelationField } from "../types";
import filterInterfaceNodes from "../utils/filter-interface-nodes";
import createConnectionAndParams from "./connection/create-connection-and-params";
import { createAuthAndParams } from "./create-auth-and-params";
import createProjectionAndParams from "./create-projection-and-params";
import { getRelationshipDirectionStr } from "../utils/get-relationship-direction";
import createElementWhereAndParams from "./where/create-element-where-and-params";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { addSortAndLimitOptionsToClause } from "./projection/subquery/add-sort-and-limit-to-clause";
import { compileCypherIfExists } from "./cypher-builder/utils/utils";

function createInterfaceProjectionAndParams({
    resolveTree,
    field,
    context,
    nodeVariable,
    parameterPrefix,
    withVars,
}: {
    resolveTree: ResolveTree;
    field: RelationField;
    context: Context;
    nodeVariable: string;
    parameterPrefix?: string;
    withVars?: string[];
}): { cypher: string; params: Record<string, any> } {
    let globalParams = {};
    let params: { args?: any } = {};
    const fullWithVars = removeDuplicates([...asArray(withVars), nodeVariable]);
    const relTypeStr = `[:${field.type}]`;

    const { inStr, outStr } = getRelationshipDirectionStr(field, resolveTree.args);

    const whereInput = resolveTree.args.where as InterfaceWhereArg;

    const referenceNodes = context.nodes.filter(
        (node) => field.interface?.implementations?.includes(node.name) && filterInterfaceNodes({ node, whereInput })
    );

    let whereArgs: { _on?: any; [str: string]: any } = {};

    const subqueries = referenceNodes.map((refNode) => {
        const param = `${nodeVariable}_${refNode.name}`;
        const subquery = [
            `WITH ${fullWithVars.join(", ")}`,
            `MATCH (${nodeVariable})${inStr}${relTypeStr}${outStr}(${param}:${refNode.name})`,
        ];

        const allowAndParams = createAuthAndParams({
            operations: "READ",
            entity: refNode,
            context,
            allow: {
                parentNode: refNode,
                varName: param,
            },
        });
        if (allowAndParams[0]) {
            globalParams = { ...globalParams, ...allowAndParams[1] };
            subquery.push(`CALL apoc.util.validate(NOT (${allowAndParams[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
        }

        const whereStrs: string[] = [];

        if (resolveTree.args.where) {
            // For root filters
            const rootNodeWhereAndParams = createElementWhereAndParams({
                whereInput: {
                    ...Object.entries(whereInput).reduce((args, [k, v]) => {
                        if (k !== "_on") {
                            // If this where key is also inside _on for this implementation, use the one in _on instead
                            if (whereInput?._on?.[refNode.name]?.[k]) {
                                return args;
                            }
                            return { ...args, [k]: v };
                        }

                        return args;
                    }, {}),
                },
                context,
                element: refNode,
                varName: param,
                parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
                    resolveTree.alias
                }.args.where`,
            });
            if (rootNodeWhereAndParams[0]) {
                whereStrs.push(rootNodeWhereAndParams[0]);
                whereArgs = { ...whereArgs, ...rootNodeWhereAndParams[1] };
            }

            // For _on filters
            if (whereInput?._on?.[refNode.name]) {
                const onTypeNodeWhereAndParams = createElementWhereAndParams({
                    whereInput: {
                        ...Object.entries(whereInput).reduce((args, [k, v]) => {
                            if (k !== "_on") {
                                return { ...args, [k]: v };
                            }

                            if (Object.prototype.hasOwnProperty.call(v, refNode.name)) {
                                return { ...args, ...v[refNode.name] };
                            }

                            return args;
                        }, {}),
                    },
                    context,
                    element: refNode,
                    varName: param,
                    parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
                        resolveTree.alias
                    }.args.where._on.${refNode.name}`,
                });
                if (onTypeNodeWhereAndParams[0]) {
                    whereStrs.push(onTypeNodeWhereAndParams[0]);
                    if (whereArgs._on) {
                        whereArgs._on[refNode.name] = onTypeNodeWhereAndParams[1];
                    } else {
                        whereArgs._on = { [refNode.name]: onTypeNodeWhereAndParams[1] };
                    }
                }
            }
        }

        const whereAuth = createAuthAndParams({
            operations: "READ",
            entity: refNode,
            context,
            where: { varName: param, node: refNode },
        });
        if (whereAuth[0]) {
            whereStrs.push(whereAuth[0]);
            globalParams = { ...globalParams, ...whereAuth[1] };
        }

        if (whereStrs.length) {
            subquery.push(`WHERE ${whereStrs.join(" AND ")}`);
        }

        const {
            projection: projectionStr,
            params: projectionParams,
            meta,
            subqueries: projectionSubQueries,
        } = createProjectionAndParams({
            resolveTree,
            node: refNode,
            context,
            varName: param,
            literalElements: true,
            resolveType: true,
        });
        if (meta?.connectionFields?.length) {
            meta.connectionFields.forEach((connectionResolveTree) => {
                const connectionField = refNode.connectionFields.find(
                    (x) => x.fieldName === connectionResolveTree.name
                ) as ConnectionField;
                const connection = createConnectionAndParams({
                    resolveTree: connectionResolveTree,
                    field: connectionField,
                    context,
                    nodeVariable: param,
                });
                subquery.push(connection[0]);
                params = { ...params, ...projectionParams };
            });
        }

        if (meta?.interfaceFields?.length) {
            const prevRelationshipFields: string[] = [];
            meta.interfaceFields.forEach((interfaceResolveTree) => {
                const relationshipField = refNode.relationFields.find(
                    (x) => x.fieldName === interfaceResolveTree.name
                ) as RelationField;
                const interfaceProjection = createInterfaceProjectionAndParams({
                    resolveTree: interfaceResolveTree,
                    field: relationshipField,
                    context,
                    nodeVariable: param,
                    withVars: prevRelationshipFields,
                });
                prevRelationshipFields.push(relationshipField.dbPropertyName || relationshipField.fieldName);
                subquery.push(interfaceProjection.cypher);
                params = { ...params, ...interfaceProjection.params };
            });
        }

        const projectionSubqueryClause = CypherBuilder.concat(...projectionSubQueries);
        return new CypherBuilder.RawCypher((env) => {
            const subqueryStr = compileCypherIfExists(projectionSubqueryClause, env);
            const returnStatement = `RETURN ${projectionStr} AS ${field.fieldName}`;

            return [[...subquery, subqueryStr, returnStatement].join("\n"), {}]; // TODO: pass params here instead of globalParams
        });
    });

    const optionsInput = resolveTree.args.options as GraphQLOptionsArg | undefined;
    let withClause: CypherBuilder.With | undefined;
    if (optionsInput) {
        withClause = new CypherBuilder.With("*");
        addSortAndLimitOptionsToClause({
            optionsInput,
            projectionClause: withClause,
            target: new CypherBuilder.NamedNode(field.fieldName),
        });
    }

    const unionClause = new CypherBuilder.Union(...subqueries);
    const call = new CypherBuilder.Call(unionClause);

    return new CypherBuilder.RawCypher((env) => {
        const subqueryStr = call.getCypher(env);
        const withStr = compileCypherIfExists(withClause, env, { suffix: "\n" });

        let interfaceProjection = [`WITH ${fullWithVars.join(", ")}`, subqueryStr];
        if (field.typeMeta.array) {
            interfaceProjection = [
                `WITH ${fullWithVars.join(", ")}`,
                "CALL {",
                ...interfaceProjection,
                `${withStr}RETURN collect(${field.fieldName}) AS ${field.fieldName}`,
                "}",
            ];
        }

        if (Object.keys(whereArgs).length) {
            params.args = { where: whereArgs };
        }

        return [
            interfaceProjection.join("\n"),
            {
                ...globalParams,
                ...(Object.keys(params).length ? { [`${nodeVariable}_${resolveTree.alias}`]: params } : {}),
            },
        ];
    }).build(`${nodeVariable}_`);
}

export default createInterfaceProjectionAndParams;
