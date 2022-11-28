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

import type { Node, Relationship } from "../classes";
import type { Context } from "../types";
import { createAuthAndParams } from "./create-auth-and-params";
import createConnectionWhereAndParams from "./where/create-connection-where-and-params";
import { AUTH_FORBIDDEN_ERROR, META_CYPHER_VARIABLE } from "../constants";
import { createEventMetaObject } from "./subscriptions/create-event-meta";
import { createConnectionEventMetaObject } from "./subscriptions/create-connection-event-meta";
import { filterMetaVariable } from "./subscriptions/filter-meta-variable";

interface Res {
    strs: string[];
    params: any;
}

function createDeleteAndParams({
    deleteInput,
    varName,
    node,
    parentVar,
    chainStr,
    withVars,
    context,
    insideDoWhen,
    parameterPrefix,
    recursing,
}: {
    parentVar: string;
    deleteInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    withVars: string[];
    context: Context;
    insideDoWhen?: boolean;
    parameterPrefix: string;
    recursing?: boolean;
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]) {
        const relationField = node.relationFields.find((x) => key === x.fieldName);

        if (relationField) {
            const refNodes: Node[] = [];

            const relationship = context.relationships.find(
                (x) => x.properties === relationField.properties
            ) as unknown as Relationship;

            if (relationField.union) {
                Object.keys(value).forEach((unionTypeName) => {
                    refNodes.push(context.nodes.find((x) => x.name === unionTypeName) as Node);
                });
            } else if (relationField.interface) {
                relationField.interface.implementations?.forEach((implementationName) => {
                    refNodes.push(context.nodes.find((x) => x.name === implementationName) as Node);
                });
            } else {
                refNodes.push(context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";

            refNodes.forEach((refNode) => {
                const v = relationField.union ? value[refNode.name] : value;
                const deletes = relationField.typeMeta.array ? v : [v];
                deletes.forEach((d, index) => {
                    const variableName = chainStr
                        ? `${varName}${index}`
                        : `${varName}_${key}${
                              relationField.union || relationField.interface ? `_${refNode.name}` : ""
                          }${index}`;
                    const relationshipVariable = `${variableName}_relationship`;
                    const relTypeStr = `[${relationshipVariable}:${relationField.type}]`;
                    const withRelationshipStr = context.subscriptionsEnabled ? `, ${relationshipVariable}` : "";
                    const aggregateVariableName = `${variableName}_aggregate`;
                    const labels = refNode.getLabelString(context);

                    const whereStrs: string[] = [];
                    let preComputedWhereFields = "";
                    let whereClause = "";
                    let whereParams = {};
                    let predicateVariables: string[] | undefined;

                    if (d.where) {
                        try {
                            [preComputedWhereFields, whereClause, whereParams, predicateVariables] =
                                createConnectionWhereAndParams({
                                    nodeVariable: variableName,
                                    aggregateNodeVariable: aggregateVariableName,
                                    whereInput: d.where,
                                    node: refNode,
                                    context,
                                    relationshipVariable,
                                    relationship,
                                    parameterPrefix: `${parameterPrefix}${!recursing ? `.${key}` : ""}${
                                        relationField.union ? `.${refNode.name}` : ""
                                    }${relationField.typeMeta.array ? `[${index}]` : ""}.where`,
                                });
                            if (whereClause) {
                                whereStrs.push(whereClause);
                                res.params = { ...res.params, ...whereParams };
                            }
                        } catch {
                            return;
                        }
                    }

                    if (withVars) {
                        res.strs.push(`WITH ${withVars.join(", ")}`);
                    }

                    const whereAuth = createAuthAndParams({
                        operations: "DELETE",
                        entity: refNode,
                        context,
                        where: { varName: variableName, node: refNode },
                    });
                    if (whereAuth[0]) {
                        whereStrs.push(whereAuth[0]);
                        res.params = { ...res.params, ...whereAuth[1] };
                    }
                    if (preComputedWhereFields) {
                        res.strs.push(
                            `OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${aggregateVariableName}${labels})`
                        );
                        res.strs.push(preComputedWhereFields);
                        if (predicateVariables && predicateVariables.length) {
                            res.strs.push(
                                `WITH DISTINCT ${withVars.join(", ")}, ${predicateVariables.join(
                                    ", "
                                )}, ${relationshipVariable}`
                            );
                        } else {
                            res.strs.push(`WITH DISTINCT ${withVars.join(", ")}`);
                        }
                    }

                    res.strs.push(
                        `OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${variableName}${labels})`
                    );

                    if (whereStrs.length) {
                        res.strs.push(`WHERE ${whereStrs.join(" AND ")}`);
                    }

                    const allowAuth = createAuthAndParams({
                        entity: refNode,
                        operations: "DELETE",
                        context,
                        escapeQuotes: Boolean(insideDoWhen),
                        allow: { parentNode: refNode, varName: variableName },
                    });
                    if (allowAuth[0]) {
                        const quote = insideDoWhen ? `\\"` : `"`;
                        res.strs.push(`WITH ${[...withVars, variableName].join(", ")}${withRelationshipStr}`);
                        res.strs.push(
                            `CALL apoc.util.validate(NOT (${allowAuth[0]}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
                        );
                        res.params = { ...res.params, ...allowAuth[1] };
                    }

                    if (d.delete) {
                        const nestedDeleteInput = Object.entries(d.delete)
                            .filter(([k]) => {
                                if (k === "_on") {
                                    return false;
                                }

                                if (relationField.interface && d.delete?._on?.[refNode.name]) {
                                    const onArray = Array.isArray(d.delete._on[refNode.name])
                                        ? d.delete._on[refNode.name]
                                        : [d.delete._on[refNode.name]];
                                    if (onArray.some((onKey) => Object.prototype.hasOwnProperty.call(onKey, k))) {
                                        return false;
                                    }
                                }

                                return true;
                            })
                            .reduce((d1, [k1, v1]) => ({ ...d1, [k1]: v1 }), {});
                        const innerWithVars = context.subscriptionsEnabled
                            ? [...withVars, variableName, relationshipVariable]
                            : [...withVars, variableName];

                        const deleteAndParams = createDeleteAndParams({
                            context,
                            node: refNode,
                            deleteInput: nestedDeleteInput,
                            varName: variableName,
                            withVars: innerWithVars,
                            parentVar: variableName,
                            parameterPrefix: `${parameterPrefix}${!recursing ? `.${key}` : ""}${
                                relationField.union ? `.${refNode.name}` : ""
                            }${relationField.typeMeta.array ? `[${index}]` : ""}.delete`,
                            recursing: false,
                        });
                        res.strs.push(deleteAndParams[0]);
                        res.params = { ...res.params, ...deleteAndParams[1] };

                        if (relationField.interface && d.delete?._on?.[refNode.name]) {
                            const onDeletes = Array.isArray(d.delete._on[refNode.name])
                                ? d.delete._on[refNode.name]
                                : [d.delete._on[refNode.name]];

                            onDeletes.forEach((onDelete, onDeleteIndex) => {
                                const onDeleteAndParams = createDeleteAndParams({
                                    context,
                                    node: refNode,
                                    deleteInput: onDelete,
                                    varName: variableName,
                                    withVars: innerWithVars,
                                    parentVar: variableName,
                                    parameterPrefix: `${parameterPrefix}${!recursing ? `.${key}` : ""}${
                                        relationField.union ? `.${refNode.name}` : ""
                                    }${relationField.typeMeta.array ? `[${index}]` : ""}.delete._on.${
                                        refNode.name
                                    }[${onDeleteIndex}]`,
                                    recursing: false,
                                });
                                res.strs.push(onDeleteAndParams[0]);
                                res.params = { ...res.params, ...onDeleteAndParams[1] };
                            });
                        }
                    }

                    const nodeToDelete = `${variableName}_to_delete`;

                    res.strs.push(
                        `WITH ${[...withVars, `collect(DISTINCT ${variableName}) AS ${nodeToDelete}`].join(
                            ", "
                        )}${withRelationshipStr}`
                    );

                    if (context.subscriptionsEnabled) {
                        const metaObjectStr = createEventMetaObject({
                            event: "delete",
                            nodeVariable: "n",
                            typename: refNode.name,
                        });
                        const [fromVariable, toVariable] =
                            relationField.direction === "IN" ? ["n", parentVar] : [parentVar, "n"];
                        const [fromTypename, toTypename] =
                            relationField.direction === "IN" ? [refNode.name, node.name] : [node.name, refNode.name];
                        const eventWithMetaStr = createConnectionEventMetaObject({
                            event: "disconnect",
                            relVariable: relationshipVariable,
                            fromVariable,
                            toVariable,
                            typename: relationField.type,
                            fromTypename,
                            toTypename,
                        });
                        const reduceStr = `REDUCE(m=${META_CYPHER_VARIABLE}, n IN ${nodeToDelete} | m + ${metaObjectStr} + ${eventWithMetaStr}) AS ${META_CYPHER_VARIABLE}`;
                        res.strs.push(
                            `WITH ${[...filterMetaVariable(withVars), nodeToDelete].join(", ")}, ${reduceStr}`
                        );
                    }

                    res.strs.push("CALL {");
                    res.strs.push(`\tWITH ${variableName}_to_delete`);
                    res.strs.push(`\tUNWIND ${variableName}_to_delete AS x`);
                    res.strs.push(`\tDETACH DELETE x`);
                    res.strs.push("\tRETURN count(*) AS _"); // Avoids CANNOT END WITH DETACH DELETE ERROR
                    res.strs.push("}");
                    // TODO - relationship validation

                    if (context.subscriptionsEnabled) {
                        // Fixes https://github.com/neo4j/graphql/issues/440
                        res.strs.push(
                            `WITH ${filterMetaVariable(withVars).join(", ")}, collect(distinct meta) AS update_meta`
                        );
                        res.strs.push(
                            `WITH ${filterMetaVariable(withVars).join(
                                ", "
                            )}, REDUCE(m=[], n IN update_meta | m + n) AS meta`
                        );
                    }
                });
            });

            return res;
        }

        return res;
    }

    const { strs, params } = Object.entries(deleteInput).reduce(reducer, { strs: [], params: {} });

    return [strs.join("\n"), params];
}

export default createDeleteAndParams;
