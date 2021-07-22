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
import { Context } from "../types";
import createConnectAndParams from "./create-connect-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import createWhereAndParams from "./create-where-and-params";
import createCreateAndParams from "./create-create-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createDeleteAndParams from "./create-delete-and-params";
import createAuthParam from "./create-auth-param";
import createAuthAndParams from "./create-auth-and-params";

interface Res {
    strs: string[];
    params: any;
    meta?: UpdateMeta;
}

interface UpdateMeta {
    preAuthStrs: string[];
    postAuthStrs: string[];
}

function createUpdateAndParams({
    updateInput,
    varName,
    node,
    parentVar,
    chainStr,
    insideDoWhen,
    withVars,
    context,
}: {
    parentVar: string;
    updateInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    withVars: string[];
    insideDoWhen?: boolean;
    context: Context;
}): [string, any] {
    let hasAppliedTimeStamps = false;

    function reducer(res: Res, [key, value]: [string, any]) {
        let param;

        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${parentVar}_update_${key}`;
        }

        const relationField = node.relationFields.find((x) => key.startsWith(x.fieldName));
        const pointField = node.pointFields.find((x) => key.startsWith(x.fieldName));
        let unionTypeName = "";

        if (relationField) {
            let refNode: Node;

            if (relationField.union) {
                [unionTypeName] = key.split(`${relationField.fieldName}_`).join("").split("_");
                refNode = context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node;
            } else {
                refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            }

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";
            const relTypeStr = `[:${relationField.type}]`;

            const updates = relationField.typeMeta.array ? value : [value];
            updates.forEach((update, index) => {
                const _varName = `${varName}_${key}${index}`;

                if (update.update) {
                    if (withVars) {
                        res.strs.push(`WITH ${withVars.join(", ")}`);
                    }

                    res.strs.push(
                        `OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${_varName}:${refNode.name})`
                    );

                    const whereStrs: string[] = [];
                    if (update.where) {
                        const whereAndParams = createWhereAndParams({
                            varName: _varName,
                            whereInput: update.where,
                            node: refNode,
                            context,
                            recursing: true,
                        });
                        if (whereAndParams[0]) {
                            whereStrs.push(whereAndParams[0]);
                            res.params = { ...res.params, ...whereAndParams[1] };
                        }
                    }
                    if (node.auth) {
                        const whereAuth = createAuthAndParams({
                            operation: "UPDATE",
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
                        res.strs.push(`WHERE ${whereStrs.join(" AND ")}`);
                    }

                    res.strs.push(`CALL apoc.do.when(${_varName} IS NOT NULL, ${insideDoWhen ? '\\"' : '"'}`);

                    const auth = createAuthParam({ context });
                    let innerApocParams = { auth };

                    const updateAndParams = createUpdateAndParams({
                        context,
                        node: refNode,
                        updateInput: update.update,
                        varName: _varName,
                        withVars: [...withVars, _varName],
                        parentVar: _varName,
                        chainStr: `${param}${index}`,
                        insideDoWhen: true,
                    });
                    res.params = { ...res.params, ...updateAndParams[1], auth };
                    innerApocParams = { ...innerApocParams, ...updateAndParams[1] };

                    const updateStrs = [updateAndParams[0], "RETURN count(*)"];
                    const apocArgs = `{${withVars
                        .map((withVar) => `${withVar}:${withVar}`)
                        .join(", ")}, ${_varName}:${_varName}REPLACE_ME}`;

                    if (insideDoWhen) {
                        updateStrs.push(`\\", \\"\\", ${apocArgs})`);
                    } else {
                        updateStrs.push(`", "", ${apocArgs})`);
                    }
                    updateStrs.push("YIELD value as _");

                    const paramsString = Object.keys(innerApocParams)
                        .reduce((r: string[], k) => [...r, `${k}:$${k}`], [])
                        .join(",");

                    const updateStr = updateStrs.join("\n").replace(/REPLACE_ME/g, `, ${paramsString}`);
                    res.strs.push(updateStr);
                }

                if (update.disconnect) {
                    const disconnectAndParams = createDisconnectAndParams({
                        context,
                        refNode,
                        value: update.disconnect,
                        varName: `${_varName}_disconnect`,
                        withVars,
                        parentVar,
                        relationField,
                        labelOverride: unionTypeName,
                        parentNode: node,
                        insideDoWhen,
                    });
                    res.strs.push(disconnectAndParams[0]);
                    res.params = { ...res.params, ...disconnectAndParams[1] };
                }

                if (update.connect) {
                    const connectAndParams = createConnectAndParams({
                        context,
                        refNode,
                        value: update.connect,
                        varName: `${_varName}_connect`,
                        withVars,
                        parentVar,
                        relationField,
                        labelOverride: unionTypeName,
                        parentNode: node,
                        insideDoWhen,
                    });
                    res.strs.push(connectAndParams[0]);
                    res.params = { ...res.params, ...connectAndParams[1] };
                }

                if (update.delete) {
                    const innerVarName = `${_varName}_delete`;

                    const deleteAndParams = createDeleteAndParams({
                        context,
                        node,
                        deleteInput: { [key]: update.delete },
                        varName: innerVarName,
                        chainStr: innerVarName,
                        parentVar,
                        withVars,
                        insideDoWhen,
                    });
                    res.strs.push(deleteAndParams[0]);
                    res.params = { ...res.params, ...deleteAndParams[1] };
                }

                if (update.create) {
                    if (withVars) {
                        res.strs.push(`WITH ${withVars.join(", ")}`);
                    }

                    const creates = relationField.typeMeta.array ? update.create : [update.create];
                    creates.forEach((create, i) => {
                        const innerVarName = `${_varName}_create${i}`;

                        const createAndParams = createCreateAndParams({
                            context,
                            node: refNode,
                            input: create,
                            varName: innerVarName,
                            withVars: [...withVars, innerVarName],
                            insideDoWhen,
                        });
                        res.strs.push(createAndParams[0]);
                        res.params = { ...res.params, ...createAndParams[1] };
                        res.strs.push(`MERGE (${parentVar})${inStr}${relTypeStr}${outStr}(${innerVarName})`);
                    });
                }
            });

            return res;
        }

        if (!hasAppliedTimeStamps) {
            const timestamps = node.dateTimeFields.filter((x) => x.timestamps && x.timestamps.includes("UPDATE"));
            timestamps.forEach((ts) => {
                res.strs.push(`SET ${varName}.${ts.fieldName} = datetime()`);
            });

            hasAppliedTimeStamps = true;
        }

        const settableField = node.mutableFields.find((x) => x.fieldName === key);
        const authableField = node.authableFields.find((x) => x.fieldName === key);

        if (settableField) {
            if (pointField) {
                if (pointField.typeMeta.array) {
                    res.strs.push(`SET ${varName}.${key} = [p in $${param} | point(p)]`);
                } else {
                    res.strs.push(`SET ${varName}.${key} = point($${param})`);
                }
            } else {
                res.strs.push(`SET ${varName}.${key} = $${param}`);
            }

            res.params[param] = value;
        }

        if (authableField) {
            if (authableField.auth) {
                const preAuth = createAuthAndParams({
                    entity: authableField,
                    operation: "UPDATE",
                    context,
                    allow: { varName, parentNode: node, chainStr: param },
                    escapeQuotes: Boolean(insideDoWhen),
                });
                const postAuth = createAuthAndParams({
                    entity: authableField,
                    operation: "UPDATE",
                    skipRoles: true,
                    skipIsAuthenticated: true,
                    context,
                    bind: { parentNode: node, varName, chainStr: param },
                    escapeQuotes: Boolean(insideDoWhen),
                });

                if (!res.meta) {
                    res.meta = { preAuthStrs: [], postAuthStrs: [] };
                }

                if (preAuth[0]) {
                    res.meta.preAuthStrs.push(preAuth[0]);
                    res.params = { ...res.params, ...preAuth[1] };
                }

                if (postAuth[0]) {
                    res.meta.postAuthStrs.push(postAuth[0]);
                    res.params = { ...res.params, ...postAuth[1] };
                }
            }
        }

        return res;
    }

    // eslint-disable-next-line prefer-const
    let { strs, params, meta = { preAuthStrs: [], postAuthStrs: [] } } = Object.entries(updateInput).reduce(reducer, {
        strs: [],
        params: {},
    });

    let preAuthStrs: string[] = [];
    let postAuthStrs: string[] = [];
    const withStr = `WITH ${withVars.join(", ")}`;

    const preAuth = createAuthAndParams({
        entity: node,
        context,
        allow: { parentNode: node, varName },
        operation: "UPDATE",
        escapeQuotes: Boolean(insideDoWhen),
    });
    if (preAuth[0]) {
        preAuthStrs.push(preAuth[0]);
        params = { ...params, ...preAuth[1] };
    }

    const postAuth = createAuthAndParams({
        entity: node,
        context,
        skipIsAuthenticated: true,
        skipRoles: true,
        operation: "UPDATE",
        bind: { parentNode: node, varName },
        escapeQuotes: Boolean(insideDoWhen),
    });
    if (postAuth[0]) {
        postAuthStrs.push(postAuth[0]);
        params = { ...params, ...postAuth[1] };
    }

    if (meta) {
        preAuthStrs = [...preAuthStrs, ...meta.preAuthStrs];
        postAuthStrs = [...postAuthStrs, ...meta.postAuthStrs];
    }

    let preAuthStr = "";
    let postAuthStr = "";

    const forbiddenString = insideDoWhen ? `\\"${AUTH_FORBIDDEN_ERROR}\\"` : `"${AUTH_FORBIDDEN_ERROR}"`;

    if (preAuthStrs.length) {
        const apocStr = `CALL apoc.util.validate(NOT(${preAuthStrs.join(" AND ")}), ${forbiddenString}, [0])`;
        preAuthStr = `${withStr}\n${apocStr}`;
    }

    if (postAuthStrs.length) {
        const apocStr = `CALL apoc.util.validate(NOT(${postAuthStrs.join(" AND ")}), ${forbiddenString}, [0])`;
        postAuthStr = `${withStr}\n${apocStr}`;
    }

    const str = `${preAuthStr}\n${strs.join("\n")}\n${postAuthStr}`;

    return [str, params];
}

export default createUpdateAndParams;
