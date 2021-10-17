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
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { Context } from "../types";
import WithProjector from "../classes/WithProjector";
import mapToDbProperty from "../utils/map-to-db-property";
import createAuthAndParams from "./create-auth-and-params";
import createAuthParam from "./create-auth-param";
import createConnectAndParams from "./create-connect-and-params";
import createCreateAndParams from "./create-create-and-params";
import createDeleteAndParams from "./create-delete-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import createSetRelationshipProperties from "./create-set-relationship-properties";
import createConnectionWhereAndParams from "./where/create-connection-where-and-params";

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
    withProjector,
    context,
    parameterPrefix,
}: {
    parentVar: string;
    updateInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    withProjector: WithProjector,
    insideDoWhen?: boolean;
    context: Context;
    parameterPrefix: string;
}): [string, any] {
    let hasAppliedTimeStamps = false;

    /**
     * **NOTE**
     * Update input is now being sent to neo4j twice. Instead of flattening each input parameter,
     * perhaps we can utilize the object being sent to neo4j?
     * `objUpdateParams` is necessary for subscriptions to sent an object containing
     * the updated properties.
     */
    const objUpdateParams = {}; 

    function reducer(res: Res, [key, value]: [string, any]) {


        let param;

        objUpdateParams[key] = value;
        if (chainStr) {
            param = `${chainStr}_${key}`;
        } else {
            param = `${parentVar}_update_${key}`;
        }

        const relationField = node.relationFields.find((x) => key === x.fieldName);
        const pointField = node.pointFields.find((x) => key === x.fieldName);
        const dbFieldName = mapToDbProperty(node, key);

        if (relationField) {
            const refNodes: Node[] = [];

            const relationship = (context.neoSchema.relationships.find(
                (x) => x.properties === relationField.properties
            ) as unknown) as Relationship;

            if (relationField.union) {
                Object.keys(value).forEach((unionTypeName) => {
                    refNodes.push(context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node);
                });
            } else {
                refNodes.push(context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";

            refNodes.forEach((refNode) => {
                const v = relationField.union ? value[refNode.name] : value;
                const updates = relationField.typeMeta.array ? v : [v];
                updates.forEach((update, index) => {
                    const relationshipVariable = `${varName}_${relationField.type.toLowerCase()}${index}_relationship`;
                    const relTypeStr = `[${relationshipVariable}:${relationField.type}]`;
                    const _varName = `${varName}_${key}${relationField.union ? `_${refNode.name}` : ""}${index}`;

                    if (update.update) {
                        res.strs.push(withProjector.nextWith());

                        const labels = refNode.labelString;
                        res.strs.push(
                            `OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${_varName}${labels})`
                        );

                        const whereStrs: string[] = [];

                        if (update.where) {
                            const where = createConnectionWhereAndParams({
                                whereInput: update.where,
                                node: refNode,
                                nodeVariable: _varName,
                                relationship,
                                relationshipVariable,
                                context,
                                parameterPrefix: `${parameterPrefix}.${key}${
                                    relationField.union ? `.${refNode.name}` : ""
                                }${relationField.typeMeta.array ? `[${index}]` : ``}.where`,
                            });
                            const [whereClause] = where;
                            whereStrs.push(whereClause);
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

                        if (update.update.node) {
                            res.strs.push(`CALL apoc.do.when(${_varName} IS NOT NULL, ${insideDoWhen ? '\\"' : '"'}`);

                            const childWithProjector = withProjector.createChild();
                            childWithProjector.addVariable(_varName);

                            const auth = createAuthParam({ context });
                            let innerApocParams = { auth };

                            const updateAndParams = createUpdateAndParams({
                                context,
                                node: refNode,
                                updateInput: update.update.node,
                                varName: _varName,
                                withProjector: childWithProjector,
                                parentVar: _varName,
                                chainStr: `${param}${relationField.union ? `_${refNode.name}` : ""}${index}`,
                                insideDoWhen: true,
                                parameterPrefix: `${parameterPrefix}.${key}${
                                    relationField.union ? `.${refNode.name}` : ""
                                }${relationField.typeMeta.array ? `[${index}]` : ``}.update.node`,
                            });
                            res.params = { ...res.params, ...updateAndParams[1], auth };
                            innerApocParams = { ...innerApocParams, ...updateAndParams[1] };

                            const updateStrs = [updateAndParams[0], `RETURN id(${ _varName }) as _id`];
                            const apocArgs = `{${withProjector.variables.map((withVar) => `${withVar}:${withVar}`).join(", ")}, ${
                                parameterPrefix?.split(".")[0]
                            }: $${parameterPrefix?.split(".")[0]}, ${_varName}:${_varName}REPLACE_ME}`;

                            if (insideDoWhen) {
                                updateStrs.push(`\\", \\"\\", ${apocArgs})`);
                            } else {
                                updateStrs.push(`", "", ${apocArgs})`);
                            }
                            updateStrs.push("YIELD value");
                            withProjector.markMutationMeta({
                                type: 'Updated',
                                idVar: 'value._id',
                                name: refNode.name,
                                // properties: `$`,
                            });

                            const paramsString = Object.keys(innerApocParams)
                                .reduce((r: string[], k) => [...r, `${k}:$${k}`], [])
                                .join(",");

                            const updateStr = updateStrs.join("\n").replace(/REPLACE_ME/g, `, ${paramsString}`);
                            res.strs.push(updateStr);
                        }

                        if (update.update.edge) {
                            res.strs.push(
                                `CALL apoc.do.when(${relationshipVariable} IS NOT NULL, ${insideDoWhen ? '\\"' : '"'}`
                            );

                            const setProperties = createSetRelationshipProperties({
                                properties: update.update.edge,
                                varName: relationshipVariable,
                                relationship,
                                operation: "UPDATE",
                                parameterPrefix: `${parameterPrefix}.${key}${
                                    relationField.union ? `.${refNode.name}` : ""
                                }[${index}].update.edge`,
                            });

                            const updateStrs = [setProperties, `RETURN id(${ varName }) as _id, id(${ relationshipVariable }) as _relId, id(${ parentVar }) as _parentId`];
                            const apocArgs = `{${relationshipVariable}:${relationshipVariable}, ${
                                parameterPrefix?.split(".")[0]
                            }: $${parameterPrefix?.split(".")[0]}}`;

                            if (insideDoWhen) {
                                updateStrs.push(`\\", \\"\\", ${apocArgs})`);
                            } else {
                                updateStrs.push(`", "", ${apocArgs})`);
                            }
                            updateStrs.push(`YIELD value`);
                            // updateStrs.push(`YIELD value as ${relationshipVariable}_${key}${index}_edge`);
                            withProjector.markMutationMeta({
                                type: 'RelationshipUpdated',
                                name: node.name,
                                relationshipName: relationship.name,
                                toName: 'toName (temporary)',

                                idVar: 'value._id',
                                relationshipIDVar: 'val._relId',
                                toIDVar: 'val._parentId',

                                // properties: update.update.edge,
                            });
                            res.strs.push(updateStrs.join("\n"));
                        }
                    }

                    if (update.disconnect) {
                        const disconnectAndParams = createDisconnectAndParams({
                            context,
                            refNode,
                            value: update.disconnect,
                            varName: `${_varName}_disconnect`,
                            withVars: withProjector.variables, // TODO: use withProjector
                            parentVar,
                            relationField,
                            labelOverride: relationField.union ? refNode.name : "",
                            parentNode: node,
                            insideDoWhen,
                            parameterPrefix: `${parameterPrefix}.${key}${
                                relationField.union ? `.${refNode.name}` : ""
                            }${relationField.typeMeta.array ? `[${index}]` : ""}.disconnect`,
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
                            withVars: withProjector.variables, // TODO: use withProjector
                            parentVar,
                            relationField,
                            labelOverride: relationField.union ? refNode.name : "",
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
                            deleteInput: { [key]: update.delete }, // OBJECT ENTIERS key reused twice
                            varName: innerVarName,
                            chainStr: innerVarName,
                            parentVar,
                            withVars: withProjector.variables, // TODO: use withProjector
                            insideDoWhen,
                            parameterPrefix: `${parameterPrefix}.${key}${
                                relationField.typeMeta.array ? `[${index}]` : ``
                            }.delete`, // its use here
                            recursing: true,
                        });
                        res.strs.push(deleteAndParams[0]);
                        res.params = { ...res.params, ...deleteAndParams[1] };
                    }

                    if (update.create) {
                        res.strs.push(withProjector.nextWith());

                        const creates = relationField.typeMeta.array ? update.create : [update.create];
                        creates.forEach((create, i) => {
                            const baseName = `${_varName}_create${i}`;
                            const nodeName = `${baseName}_node`;
                            const propertiesName = `${baseName}_relationship`;
                            const withProjectorChild = withProjector.createChild();
                            withProjectorChild.addVariable(nodeName);

                            const createAndParams = createCreateAndParams({
                                context,
                                node: refNode,
                                input: create.node,
                                varName: nodeName,
                                withVars: withProjectorChild.variables,
                                insideDoWhen,
                            });
                            res.strs.push(createAndParams[0]);
                            res.params = { ...res.params, ...createAndParams[1] };
                            res.strs.push(
                                `MERGE (${parentVar})${inStr}[${create.edge ? propertiesName : ""}:${
                                    relationField.type
                                }]${outStr}(${nodeName})`
                            );

                            if (create.edge) {
                                const setA = createSetRelationshipProperties({
                                    properties: create.edge,
                                    varName: propertiesName,
                                    relationship,
                                    operation: "CREATE",
                                    parameterPrefix: `${parameterPrefix}.${key}${
                                        relationField.union ? `.${refNode.name}` : ""
                                    }[${index}].create[${i}].edge`,
                                });
                                res.strs.push(setA);
                            }
                        });
                    }
                });
            });

            return res;
        }

        if (!hasAppliedTimeStamps) {
            const timestampedFields = node.temporalFields.filter(
                (temporalField) =>
                    ["DateTime", "Time"].includes(temporalField.typeMeta.name) &&
                    temporalField.timestamps?.includes("UPDATE")
            );
            timestampedFields.forEach((field) => {
                // DateTime -> datetime(); Time -> time()
                res.strs.push(`SET ${varName}.${field.dbPropertyName} = ${field.typeMeta.name.toLowerCase()}()`);
            });

            hasAppliedTimeStamps = true;
        }

        const settableField = node.mutableFields.find((x) => x.fieldName === key);
        const authableField = node.authableFields.find((x) => x.fieldName === key);

        if (settableField) {
            if (pointField) {
                if (pointField.typeMeta.array) {
                    res.strs.push(`SET ${varName}.${dbFieldName} = [p in $${param} | point(p)]`);
                } else {
                    res.strs.push(`SET ${varName}.${dbFieldName} = point($${param})`);
                }
            } else {
                res.strs.push(`SET ${varName}.${dbFieldName} = $${param}`);
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

    // Must be generated before reducers are called
    // const preAuthWithStr = withProjector.nextWith();
    const preAuthWithStr = '';

    // eslint-disable-next-line prefer-const
    let { strs, params, meta = { preAuthStrs: [], postAuthStrs: [] } } = Object.entries(updateInput).reduce(reducer, {
        strs: [],
        params: {},
    });

    let preAuthStrs: string[] = [];
    let postAuthStrs: string[] = [];

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
        preAuthStr = `${preAuthWithStr}\n${apocStr}`;
    }

    if (postAuthStrs.length) {
        const apocStr = `CALL apoc.util.validate(NOT(${postAuthStrs.join(" AND ")}), ${forbiddenString}, [0])`;
        // TODO: postAuthStrs with updated node ids
        postAuthStr = `${ withProjector.nextWith() }\n${apocStr}`;
    }

    if (chainStr) {
        params[chainStr] = objUpdateParams;
    } else {
        params[`${parentVar}_update`] = objUpdateParams;
    }

    const str = `${preAuthStr}\n${strs.join("\n")}\n${postAuthStr}`;

    return [str, params];
}

export default createUpdateAndParams;
