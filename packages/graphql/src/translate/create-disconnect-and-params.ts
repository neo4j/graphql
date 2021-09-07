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
    refNode,
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
    refNode: Node;
    labelOverride?: string;
    parentNode: Node;
    insideDoWhen?: boolean;
    parameterPrefix: string;
}): [string, any] {
    function reducer(res: Res, disconnect: { where: any; disconnect: any }, index): Res {
        const _varName = `${varName}${index}`;
        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relVarName = `${_varName}_rel`;
        const relTypeStr = `[${relVarName}:${relationField.type}]`;

        const labels = refNode?.nodeDirective?.getLabelsString(refNode.name) || `:${refNode?.name}`;
        // TODO: How should labelOverride be handled?
        const label = labelOverride ? `:${labelOverride}` : labels;

        if (parentNode.auth) {
            const whereAuth = createAuthAndParams({
                operation: "DISCONNECT",
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

        res.disconnects.push(`WITH ${withVars.join(", ")}`);
        res.disconnects.push(`OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${_varName}${label})`);

        const whereStrs: string[] = [];

        const relationship = (context.neoSchema.relationships.find(
            (x) => x.properties === relationField.properties
        ) as unknown) as Relationship;

        if (disconnect.where) {
            const whereAndParams = createConnectionWhereAndParams({
                nodeVariable: _varName,
                whereInput: disconnect.where,
                node: refNode,
                context,
                relationshipVariable: relVarName,
                relationship,
                parameterPrefix: `${parameterPrefix}${relationField.typeMeta.array ? `[${index}]` : ""}.where`,
            });
            if (whereAndParams[0]) {
                whereStrs.push(whereAndParams[0]);
            }
        }

        if (refNode.auth) {
            const whereAuth = createAuthAndParams({
                operation: "DISCONNECT",
                entity: refNode,
                context,
                where: { varName: _varName, node: refNode },
            });
            if (whereAuth[0]) {
                whereStrs.push(whereAuth[0]);
                res.params = { ...res.params, ...whereAuth[1] };
            }
        }

        if (whereStrs.length) {
            res.disconnects.push(`WHERE ${whereStrs.join(" AND ")}`);
        }

        const preAuth = [parentNode, refNode].reduce(
            (result: Res, node, i) => {
                if (!node.auth) {
                    return result;
                }

                const [str, params] = createAuthAndParams({
                    entity: node,
                    operation: "DISCONNECT",
                    context,
                    escapeQuotes: Boolean(insideDoWhen),
                    allow: { parentNode: node, varName: _varName, chainStr: `${_varName}${node.name}${i}_allow` },
                });

                if (!str) {
                    return result;
                }

                result.disconnects.push(str);
                result.params = { ...result.params, ...params };

                return result;
            },
            { disconnects: [], params: {} }
        );

        if (preAuth.disconnects.length) {
            const quote = insideDoWhen ? `\\"` : `"`;
            res.disconnects.push(`WITH ${[...withVars, _varName, relVarName].join(", ")}`);
            res.disconnects.push(
                `CALL apoc.util.validate(NOT(${preAuth.disconnects.join(
                    " AND "
                )}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
            );
            res.params = { ...res.params, ...preAuth.params };
        }

        /*
           Replace with subclauses https://neo4j.com/developer/kb/conditional-cypher-execution/
           https://neo4j.slack.com/archives/C02PUHA7C/p1603458561099100
        */
        res.disconnects.push(`FOREACH(_ IN CASE ${_varName} WHEN NULL THEN [] ELSE [1] END | `);
        res.disconnects.push(`DELETE ${_varName}_rel`);
        res.disconnects.push(`)`); // close FOREACH

        if (disconnect.disconnect) {
            const disconnects = Array.isArray(disconnect.disconnect) ? disconnect.disconnect : [disconnect.disconnect];

            disconnects.forEach((c, i) => {
                const reduced = Object.entries(c).reduce(
                    (r: Res, [k, v]: [string, any]) => {
                        const relField = refNode.relationFields.find((x) => k.startsWith(x.fieldName)) as RelationField;
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
                                refNode: newRefNode,
                                parentNode: refNode,
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

                res.disconnects.push(reduced.disconnects.join("\n"));
                res.params = { ...res.params, ...reduced.params };
            });
        }

        const postAuth = [parentNode, refNode].reduce(
            (result: Res, node, i) => {
                if (!node.auth) {
                    return result;
                }

                const [str, params] = createAuthAndParams({
                    entity: node,
                    operation: "DISCONNECT",
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
                result.params = { ...result.params, ...params };

                return result;
            },
            { disconnects: [], params: {} }
        );

        if (postAuth.disconnects.length) {
            const quote = insideDoWhen ? `\\"` : `"`;
            res.disconnects.push(`WITH ${[...withVars, _varName].join(", ")}`);
            res.disconnects.push(
                `CALL apoc.util.validate(NOT(${postAuth.disconnects.join(
                    " AND "
                )}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
            );
            res.params = { ...res.params, ...postAuth.params };
        }

        res.disconnects.push("RETURN count(*)");
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
