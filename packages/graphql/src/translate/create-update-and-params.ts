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
import { Context, RelationField } from "../types";
import createConnectAndParams from "./create-connect-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import createCreateAndParams from "./create-create-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createDeleteAndParams from "./create-delete-and-params";
import createAuthParam from "./create-auth-param";
import createAuthAndParams from "./create-auth-and-params";
import createSetRelationshipProperties from "./create-set-relationship-properties";
import createConnectionWhereAndParams from "./where/create-connection-where-and-params";
import createSetRelationshipPropertiesAndParams from "./create-set-relationship-properties-and-params";

interface Res {
    strs: string[];
    params: any;
    meta?: UpdateMeta;
}

interface UpdateMeta {
    preAuthStrs: string[];
    postAuthStrs: string[];
}

function createUpdates({
    varName,
    parentVar,
    node,
    context,
    withVars,
    relationField,
    value,
    insideDoWhen,
    relationship,
    parameterPrefix,
    key,
    unionKey,
}: {
    parentVar: string;
    varName: string;
    node: Node;
    context: Context;
    withVars: string[];
    relationField: RelationField;
    value: any;
    insideDoWhen?: boolean;
    relationship: Relationship;
    parameterPrefix: string;
    key: string;
    unionKey?: string;
}): [string, any] {
    const strs: string[] = [];
    let params = {};

    const inStr = relationField.direction === "IN" ? "<-" : "-";
    const outStr = relationField.direction === "OUT" ? "->" : "-";

    const updates = relationField.typeMeta.array ? value : [value];
    updates.forEach((update, index) => {
        const relationshipVariable = `${varName}_${relationField.type.toLowerCase()}${index}`;
        const relTypeStr = `[${relationshipVariable}:${relationField.type}]`;
        const _varName = `${varName}${index}`;

        if (update.update || update.properties) {
            if (withVars) {
                strs.push(`WITH ${withVars.join(", ")}`);
            }

            strs.push(`OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${_varName}:${node.name})`);

            const whereStrs: string[] = [];

            if (update.where) {
                const where = createConnectionWhereAndParams({
                    whereInput: update.where,
                    node,
                    nodeVariable: _varName,
                    relationship,
                    relationshipVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${key}${unionKey ? `.${unionKey}` : ""}${
                        relationField.typeMeta.array ? `[${index}]` : ``
                    }.where`,
                });
                const [whereClause] = where;
                whereStrs.push(whereClause);
            }

            if (node.auth) {
                const whereAuth = createAuthAndParams({
                    operation: "UPDATE",
                    entity: node,
                    context,
                    where: { varName: _varName, node: node },
                });
                if (whereAuth[0]) {
                    whereStrs.push(whereAuth[0]);
                    params = { ...params, ...whereAuth[1] };
                }
            }
            if (whereStrs.length) {
                strs.push(`WHERE ${whereStrs.join(" AND ")}`);
            }

            if (update.update) {
                strs.push(`CALL apoc.do.when(${_varName} IS NOT NULL, ${insideDoWhen ? '\\"' : '"'}`);

                const auth = createAuthParam({ context });
                let innerApocParams = { auth };

                const updateAndParams = createUpdateAndParams({
                    context,
                    node: node,
                    updateInput: update.update,
                    varName: _varName,
                    withVars: [...withVars, _varName],
                    parentVar: _varName,
                    chainStr: _varName,
                    insideDoWhen: true,
                    parameterPrefix: `${parameterPrefix}.${key}${
                        relationField.typeMeta.array ? `[${index}]` : ``
                    }.update`,
                });
                params = { ...params, ...updateAndParams[1], auth };
                innerApocParams = { ...innerApocParams, ...updateAndParams[1] };

                const updateStrs = [updateAndParams[0], "RETURN count(*)"];
                const apocArgs = `{${parentVar}:${parentVar}, ${parameterPrefix?.split(".")[0]}: $${
                    parameterPrefix?.split(".")[0]
                }, ${_varName}:${_varName}REPLACE_ME}`;

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
                strs.push(updateStr);
            }

            if (update.properties) {
                strs.push(`CALL apoc.do.when(${relationshipVariable} IS NOT NULL, ${insideDoWhen ? '\\"' : '"'}`);

                const setProperties = createSetRelationshipProperties({
                    properties: update.properties,
                    varName: relationshipVariable,
                    relationship,
                    operation: "UPDATE",
                    parameterPrefix: `${parameterPrefix}.${key}[${index}].properties`,
                });

                const updateStrs = [setProperties, "RETURN count(*)"];
                const apocArgs = `{${relationshipVariable}:${relationshipVariable}, ${
                    parameterPrefix?.split(".")[0]
                }: $${parameterPrefix?.split(".")[0]}}`;

                if (insideDoWhen) {
                    updateStrs.push(`\\", \\"\\", ${apocArgs})`);
                } else {
                    updateStrs.push(`", "", ${apocArgs})`);
                }
                updateStrs.push(`YIELD value as ${relationshipVariable}_${key}${index}_properties`);
                strs.push(updateStrs.join("\n"));
            }
        }

        if (update.disconnect) {
            const disconnectAndParams = createDisconnectAndParams({
                context,
                refNode: node,
                value: update.disconnect,
                varName: `${_varName}_disconnect`,
                withVars,
                parentVar,
                relationField,
                parentNode: node,
                insideDoWhen,
                parameterPrefix: `${parameterPrefix}.${key}${
                    relationField.typeMeta.array ? `[${index}]` : ""
                }.disconnect`,
            });
            strs.push(disconnectAndParams[0]);
            params = { ...params, ...disconnectAndParams[1] };
        }

        if (update.connect) {
            const connectAndParams = createConnectAndParams({
                context,
                refNode: node,
                value: update.connect,
                varName: `${_varName}_connect`,
                withVars,
                parentVar,
                relationField,
                parentNode: node,
                insideDoWhen,
            });
            strs.push(connectAndParams[0]);
            params = { ...params, ...connectAndParams[1] };
        }

        if (update.delete) {
            const innerVarName = `${_varName}_delete`;

            const deleteAndParams = createDeleteAndParams({
                context,
                node,
                deleteInput: { [key]: update.delete }, // OBJECT ENTIERS key reused twice
                varName: innerVarName,
                chainStr: innerVarName,
                parentVar,
                withVars,
                insideDoWhen,
                parameterPrefix: `${parameterPrefix}.${key}${relationField.typeMeta.array ? `[${index}]` : ``}.delete`, // its use here
                recursing: true,
            });
            strs.push(deleteAndParams[0]);
            params = { ...params, ...deleteAndParams[1] };
        }

        if (update.create) {
            if (withVars) {
                strs.push(`WITH ${withVars.join(", ")}`);
            }

            const creates = relationField.typeMeta.array ? update.create : [update.create];
            creates.forEach((create, i) => {
                const baseName = `${_varName}_create${i}`;
                const nodeName = `${baseName}_node`;
                const propertiesName = `${baseName}_relationship`;

                const createAndParams = createCreateAndParams({
                    context,
                    node,
                    input: create.node,
                    varName: nodeName,
                    withVars: [...withVars, nodeName],
                    insideDoWhen,
                });
                strs.push(createAndParams[0]);
                params = { ...params, ...createAndParams[1] };
                strs.push(
                    `MERGE (${parentVar})${inStr}[${create.properties ? propertiesName : ""}:${
                        relationField.type
                    }]${outStr}(${nodeName})`
                );

                if (create.properties) {
                    const setA = createSetRelationshipPropertiesAndParams({
                        properties: create.properties,
                        varName: propertiesName,
                        relationship,
                        operation: "CREATE",
                    });
                    strs.push(setA[0]);
                    params = { ...params, ...setA[1] };
                }
            });
        }
    });

    return [strs.join("\n"), params];
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
    parameterPrefix,
}: {
    parentVar: string;
    updateInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    withVars: string[];
    insideDoWhen?: boolean;
    context: Context;
    parameterPrefix: string;
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

        if (relationField) {
            const relationship = (context.neoSchema.relationships.find(
                (x) => x.properties === relationField.properties
            ) as unknown) as Relationship;

            if (relationField.union) {
                Object.entries(value).forEach((entry) => {
                    const node = context.neoSchema.nodes.find((x) => x.name === entry[0]) as Node;

                    const [u, p] = createUpdates({
                        context,
                        node,
                        relationField,
                        value: entry[1],
                        withVars,
                        parentVar: varName,
                        varName: `${varName}_${node.name}`,
                        insideDoWhen,
                        key,
                        parameterPrefix,
                        relationship,
                        unionKey: node.name,
                    });
                    res.strs.push(u);
                    res.params = { ...res.params, ...p };
                });

                return res;
            }

            const node = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            const [u, p] = createUpdates({
                context,
                node,
                relationField,
                value,
                withVars,
                parentVar: varName,
                varName: `${param}`,
                insideDoWhen,
                key,
                parameterPrefix,
                relationship,
            });
            res.strs.push(u);
            res.params = { ...res.params, ...p };

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
