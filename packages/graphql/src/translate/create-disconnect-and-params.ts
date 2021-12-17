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

import { Node, Relationship } from "../classes";
import { RelationField, Context } from "../types";
import createAuthAndParams from "./create-auth-and-params";
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
        const _varName = `${varName}${index}`;
        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relVarName = `${_varName}_rel`;
        const relTypeStr = `[${relVarName}:${relationField.type}]`;

        const subquery: string[] = [];
        let params;
        const labels = relatedNode.getLabelString(context);
        const label = labelOverride ? `:${labelOverride}` : labels;

        subquery.push(`WITH ${withVars.join(", ")}`);
        subquery.push(`OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${_varName}${label})`);

        const relationship = (context.neoSchema.relationships.find(
            (x) => x.properties === relationField.properties
        ) as unknown) as Relationship;

        const whereStrs: string[] = [];

        if (disconnect.where) {
            try {
                const whereAndParams = createConnectionWhereAndParams({
                    nodeVariable: _varName,
                    whereInput: disconnect.where,
                    node: relatedNode,
                    context,
                    relationshipVariable: relVarName,
                    relationship,
                    parameterPrefix: `${parameterPrefix}${relationField.typeMeta.array ? `[${index}]` : ""}.where`,
                });
                if (whereAndParams[0]) {
                    whereStrs.push(whereAndParams[0]);
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
                where: { varName: _varName, node: relatedNode },
            });
            if (whereAuth[0]) {
                whereStrs.push(whereAuth[0]);
                params = { ...params, ...whereAuth[1] };
            }
        }

        if (whereStrs.length) {
            subquery.push(`WHERE ${whereStrs.join(" AND ")}`);
        }

        const preAuth = [parentNode, relatedNode].reduce(
            (result: Res, node, i) => {
                if (!node.auth) {
                    return result;
                }

                const [str, p] = createAuthAndParams({
                    entity: node,
                    operations: "DISCONNECT",
                    context,
                    escapeQuotes: Boolean(insideDoWhen),
                    allow: { parentNode: node, varName: _varName, chainStr: `${_varName}${node.name}${i}_allow` },
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
            subquery.push(`WITH ${[...withVars, _varName, relVarName].join(", ")}`);
            subquery.push(
                `CALL apoc.util.validate(NOT(${preAuth.disconnects.join(
                    " AND "
                )}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
            );
            params = { ...params, ...preAuth.params };
        }

        /*
           Replace with subclauses https://neo4j.com/developer/kb/conditional-cypher-execution/
           https://neo4j.slack.com/archives/C02PUHA7C/p1603458561099100
        */
        subquery.push(`FOREACH(_ IN CASE ${_varName} WHEN NULL THEN [] ELSE [1] END | `);
        subquery.push(`DELETE ${_varName}_rel`);
        subquery.push(`)`); // close FOREACH

        if (disconnect.disconnect) {
            const disconnects = Array.isArray(disconnect.disconnect) ? disconnect.disconnect : [disconnect.disconnect];

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
                                    newRefNodes.push(context.neoSchema.nodes.find((x) => x.name === modelName) as Node);
                                });
                            } else {
                                newRefNodes.push(
                                    context.neoSchema.nodes.find((x) => x.name === relField.typeMeta.name) as Node
                                );
                            }

                            newRefNodes.forEach((newRefNode) => {
                                const recurse = createDisconnectAndParams({
                                    withVars: [...withVars, _varName],
                                    value: relField.union ? v[newRefNode.name] : v,
                                    varName: `${_varName}_${k}${relField.union ? `_${newRefNode.name}` : ""}`,
                                    relationField: relField,
                                    parentVar: _varName,
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
                                        newRefNodes.push(
                                            context.neoSchema.nodes.find((x) => x.name === modelName) as Node
                                        );
                                    });
                                } else {
                                    newRefNodes.push(
                                        context.neoSchema.nodes.find((x) => x.name === relField.typeMeta.name) as Node
                                    );
                                }

                                newRefNodes.forEach((newRefNode) => {
                                    const recurse = createDisconnectAndParams({
                                        withVars: [...withVars, _varName],
                                        value: relField.union ? v[newRefNode.name] : v,
                                        varName: `${_varName}_${k}${relField.union ? `_${newRefNode.name}` : ""}`,
                                        relationField: relField,
                                        parentVar: _varName,
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
                    bind: { parentNode: node, varName: _varName, chainStr: `${_varName}${node.name}${i}_bind` },
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
            subquery.push(`WITH ${[...withVars, _varName].join(", ")}`);
            subquery.push(
                `CALL apoc.util.validate(NOT(${postAuth.disconnects.join(
                    " AND "
                )}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
            );
            params = { ...params, ...postAuth.params };
        }

        subquery.push("RETURN count(*)");

        return { subquery: subquery.join("\n"), params };
    }

    function reducer(res: Res, disconnect: { where: any; disconnect: any }, index): Res {
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
            res.disconnects.push(subqueries.join("\nUNION\n"));
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
