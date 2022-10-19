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
import type { RelationField, Context } from "../types";
import { createAuthAndParams } from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createConnectionWhereAndParams from "./where/create-connection-where-and-params";

interface Res {
    disconnects: string[];
    params: any;
}

function createDisconnectAndParams({
    withVars,
    value,
    varName,
    relationField,
    parentVar,
    refNodes,
    context,
    labelOverride,
    parentNode,
    insideDoWhen,
    parameterPrefix,
}: {
    withVars: string[];
    value: any;
    varName: string;
    relationField: RelationField;
    parentVar: string;
    context: Context;
    refNodes: Node[];
    labelOverride?: string;
    parentNode: Node;
    insideDoWhen?: boolean;
    parameterPrefix: string;
}): [string, any] {
    function createSubqueryContents(
        relatedNode: Node,
        disconnect: any,
        index: number
    ): { subquery: string; params: Record<string, any> } {
        const variableName = `${varName}${index}`;
        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relVarName = `${variableName}_rel`;
        const relTypeStr = `[${relVarName}:${relationField.type}]`;

        const subquery: string[] = [];
        let params;
        const labels = relatedNode.getLabelString(context);
        const label = labelOverride ? `:${labelOverride}` : labels;

        subquery.push(`WITH ${withVars.join(", ")}`);
        subquery.push(`OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${variableName}${label})`);

        const relationship = context.relationships.find(
            (x) => x.properties === relationField.properties
        ) as unknown as Relationship;

        const whereStrs: string[] = [];

        if (disconnect.where) {
            try {
                const whereAndParams = createConnectionWhereAndParams({
                    nodeVariable: variableName,
                    whereInput: disconnect.where,
                    node: relatedNode,
                    context,
                    relationshipVariable: relVarName,
                    relationship,
                    parameterPrefix: `${parameterPrefix}${relationField.typeMeta.array ? `[${index}]` : ""}.where`,
                });
                if (whereAndParams[0]) {
                    whereStrs.push(whereAndParams[0]);
                    params = { ...params, ...whereAndParams[1] };
                }
            } catch {
                return { subquery: "", params: {} };
            }
        }

        if (relatedNode.auth) {
            const whereAuth = createAuthAndParams({
                operations: "DISCONNECT",
                entity: relatedNode,
                context,
                where: { varName: variableName, node: relatedNode },
            });
            if (whereAuth[0]) {
                whereStrs.push(whereAuth[0]);
                params = { ...params, ...whereAuth[1] };
            }
        }

        if (whereStrs.length) {
            subquery.push(`WHERE ${whereStrs.join(" AND ")}`);
        }

        const nodeMatrix: { node: Node; name: string }[] = [
            { node: parentNode, name: parentVar },
            { node: relatedNode, name: variableName },
        ];

        const preAuth = nodeMatrix.reduce(
            (result: Res, { node, name }, i) => {
                if (!node.auth) {
                    return result;
                }

                const [str, p] = createAuthAndParams({
                    entity: node,
                    operations: "DISCONNECT",
                    context,
                    escapeQuotes: Boolean(insideDoWhen),
                    allow: { parentNode: node, varName: name, chainStr: `${name}${node.name}${i}_allow` },
                });

                if (!str) {
                    return result;
                }

                result.disconnects.push(str);
                result.params = { ...result.params, ...p };

                return result;
            },
            { disconnects: [], params: {} }
        );

        if (preAuth.disconnects.length) {
            const quote = insideDoWhen ? `\\"` : `"`;
            subquery.push(`WITH ${[...withVars, variableName, relVarName].join(", ")}`);
            subquery.push(
                `CALL apoc.util.validate(NOT (${preAuth.disconnects.join(
                    " AND "
                )}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
            );
            params = { ...params, ...preAuth.params };
        }

        subquery.push("CALL {");
        // Trick to avoid execution on null values
        subquery.push(`\tWITH ${variableName}, ${variableName}_rel`);
        subquery.push(`\tWITH collect(${variableName}) as ${variableName}, ${variableName}_rel`);
        subquery.push(`\tUNWIND ${variableName} as x`);
        subquery.push(`\tDELETE ${variableName}_rel`);
        subquery.push(`\tRETURN count(*) AS _`); // Avoids CANNOT END WITH DETACH DELETE ERROR
        subquery.push(`}`);

        // TODO - relationship validation - Blocking, if this were to be enforced it would stop someone from 'reconnecting'

        if (disconnect.disconnect) {
            const disconnects: Array<any> = Array.isArray(disconnect.disconnect)
                ? disconnect.disconnect
                : [disconnect.disconnect];

            disconnects.forEach((c, i) => {
                const reduced = Object.entries(c)
                    .filter(([k]) => {
                        if (k === "_on") {
                            return false;
                        }

                        if (relationField.interface && c?._on?.[relatedNode.name]) {
                            const onArray = Array.isArray(c._on[relatedNode.name])
                                ? c._on[relatedNode.name]
                                : [c._on[relatedNode.name]];
                            if (onArray.some((onKey) => Object.prototype.hasOwnProperty.call(onKey, k))) {
                                return false;
                            }
                        }

                        return true;
                    })
                    .reduce(
                        (r: Res, [k, v]: [string, any]) => {
                            const relField = relatedNode.relationFields.find((x) =>
                                k.startsWith(x.fieldName)
                            ) as RelationField;
                            const newRefNodes: Node[] = [];

                            if (relField.union) {
                                Object.keys(v).forEach((modelName) => {
                                    newRefNodes.push(context.nodes.find((x) => x.name === modelName) as Node);
                                });
                            } else {
                                newRefNodes.push(context.nodes.find((x) => x.name === relField.typeMeta.name) as Node);
                            }

                            newRefNodes.forEach((newRefNode) => {
                                const recurse = createDisconnectAndParams({
                                    withVars: [...withVars, variableName],
                                    value: relField.union ? v[newRefNode.name] : v,
                                    varName: `${variableName}_${k}${relField.union ? `_${newRefNode.name}` : ""}`,
                                    relationField: relField,
                                    parentVar: variableName,
                                    context,
                                    refNodes: [newRefNode],
                                    parentNode: relatedNode,
                                    parameterPrefix: `${parameterPrefix}${
                                        relField.typeMeta.array ? `[${i}]` : ""
                                    }.disconnect.${k}${relField.union ? `.${newRefNode.name}` : ""}`,
                                    labelOverride: relField.union ? newRefNode.name : "",
                                });
                                r.disconnects.push(recurse[0]);
                                r.params = { ...r.params, ...recurse[1] };
                            });

                            return r;
                        },
                        { disconnects: [], params: {} }
                    );

                subquery.push(reduced.disconnects.join("\n"));
                params = { ...params, ...reduced.params };

                if (relationField.interface && c?._on?.[relatedNode.name]) {
                    const onDisconnects = Array.isArray(c._on[relatedNode.name])
                        ? c._on[relatedNode.name]
                        : [c._on[relatedNode.name]];

                    onDisconnects.forEach((onDisconnect, onDisconnectIndex) => {
                        const onReduced = Object.entries(onDisconnect).reduce(
                            (r: Res, [k, v]: [string, any]) => {
                                const relField = relatedNode.relationFields.find((x) =>
                                    k.startsWith(x.fieldName)
                                ) as RelationField;
                                const newRefNodes: Node[] = [];

                                if (relField.union) {
                                    Object.keys(v).forEach((modelName) => {
                                        newRefNodes.push(context.nodes.find((x) => x.name === modelName) as Node);
                                    });
                                } else {
                                    newRefNodes.push(
                                        context.nodes.find((x) => x.name === relField.typeMeta.name) as Node
                                    );
                                }

                                newRefNodes.forEach((newRefNode) => {
                                    const recurse = createDisconnectAndParams({
                                        withVars: [...withVars, variableName],
                                        value: relField.union ? v[newRefNode.name] : v,
                                        varName: `${variableName}_${k}${relField.union ? `_${newRefNode.name}` : ""}`,
                                        relationField: relField,
                                        parentVar: variableName,
                                        context,
                                        refNodes: [newRefNode],
                                        parentNode: relatedNode,
                                        parameterPrefix: `${parameterPrefix}${
                                            relField.typeMeta.array ? `[${i}]` : ""
                                        }.disconnect._on.${relatedNode.name}${
                                            relField.typeMeta.array ? `[${onDisconnectIndex}]` : ""
                                        }.${k}${relField.union ? `.${newRefNode.name}` : ""}`,
                                        labelOverride: relField.union ? newRefNode.name : "",
                                    });
                                    r.disconnects.push(recurse[0]);
                                    r.params = { ...r.params, ...recurse[1] };
                                });

                                return r;
                            },
                            { disconnects: [], params: {} }
                        );

                        subquery.push(onReduced.disconnects.join("\n"));
                        params = { ...params, ...onReduced.params };
                    });
                }
            });
        }

        const postAuth = [parentNode, relatedNode].reduce(
            (result: Res, node, i) => {
                if (!node.auth) {
                    return result;
                }

                const [str, p] = createAuthAndParams({
                    entity: node,
                    operations: "DISCONNECT",
                    context,
                    escapeQuotes: Boolean(insideDoWhen),
                    skipRoles: true,
                    skipIsAuthenticated: true,
                    bind: { parentNode: node, varName: variableName, chainStr: `${variableName}${node.name}${i}_bind` },
                });

                if (!str) {
                    return result;
                }

                result.disconnects.push(str);
                result.params = { ...result.params, ...p };

                return result;
            },
            { disconnects: [], params: {} }
        );

        if (postAuth.disconnects.length) {
            const quote = insideDoWhen ? `\\"` : `"`;
            subquery.push(`WITH ${[...withVars, variableName].join(", ")}`);
            subquery.push(
                `CALL apoc.util.validate(NOT (${postAuth.disconnects.join(
                    " AND "
                )}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
            );
            params = { ...params, ...postAuth.params };
        }

        subquery.push(`RETURN count(*) AS disconnect_${varName}_${relatedNode.name}`);

        return { subquery: subquery.join("\n"), params };
    }

    function reducer(res: Res, disconnect: { where: any; disconnect: any }, index: number): Res {
        if (parentNode.auth) {
            const whereAuth = createAuthAndParams({
                operations: "DISCONNECT",
                entity: parentNode,
                context,
                where: { varName: parentVar, node: parentNode },
            });
            if (whereAuth[0]) {
                res.disconnects.push(`WITH ${withVars.join(", ")}`);
                res.disconnects.push(`WHERE ${whereAuth[0]}`);
                res.params = { ...res.params, ...whereAuth[1] };
            }
        }

        res.disconnects.push(`WITH ${withVars.join(", ")}`);
        res.disconnects.push("CALL {");

        if (relationField.interface) {
            const subqueries: string[] = [];
            refNodes.forEach((refNode) => {
                const subquery = createSubqueryContents(refNode, disconnect, index);
                if (subquery.subquery) {
                    subqueries.push(subquery.subquery);
                    res.params = { ...res.params, ...subquery.params };
                }
            });
            res.disconnects.push(subqueries.join("\n}\nCALL {\n\t"));
        } else {
            const subquery = createSubqueryContents(refNodes[0], disconnect, index);
            res.disconnects.push(subquery.subquery);
            res.params = { ...res.params, ...subquery.params };
        }

        res.disconnects.push("}");

        return res;
    }

    const { disconnects, params } = ((relationField.typeMeta.array ? value : [value]) as any[]).reduce(reducer, {
        disconnects: [],
        params: {},
    });

    return [disconnects.join("\n"), params];
}

export default createDisconnectAndParams;
