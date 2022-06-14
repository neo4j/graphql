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
import { Context } from "../types";
import createConnectAndParams from "./create-connect-and-params";
import createDisconnectAndParams from "./create-disconnect-and-params";
import createCreateAndParams from "./create-create-and-params";
import { AUTH_FORBIDDEN_ERROR, META_CYPHER_VARIABLE, META_OLD_PROPS_CYPHER_VARIABLE } from "../constants";
import createDeleteAndParams from "./create-delete-and-params";
import createAuthParam from "./create-auth-param";
import createAuthAndParams from "./create-auth-and-params";
import createSetRelationshipProperties from "./create-set-relationship-properties";
import createConnectionWhereAndParams from "./where/create-connection-where-and-params";
import mapToDbProperty from "../utils/map-to-db-property";
import { createConnectOrCreateAndParams } from "./create-connect-or-create-and-params";
import createRelationshipValidationStr from "./create-relationship-validation-string";
import { createEventMeta } from "./subscriptions/create-event-meta";
import { filterMetaVariable } from "./subscriptions/filter-meta-variable";
import { escapeQuery } from "./utils/escape-query";
import { CallbackBucket } from "../classes/CallbackBucket";
import { addCallbackAndSetParam } from "./utils/callback-utils";
import { indentBlock } from "./utils/indent-block";

interface Res {
    strs: string[];
    params: any;
    meta?: UpdateMeta;
}

interface UpdateMeta {
    preAuthStrs: string[];
    postAuthStrs: string[];
}

export default function createUpdateAndParams({
    updateInput,
    varName,
    node,
    parentVar,
    chainStr,
    withVars,
    context,
    callbackBucket,
    parameterPrefix,
    includeRelationshipValidation,
}: {
    parentVar: string;
    updateInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    withVars: string[];
    context: Context;
    callbackBucket: CallbackBucket;
    parameterPrefix: string;
    includeRelationshipValidation?: boolean;
}): [string, any] {
    let hasAppliedTimeStamps = false;

    function reducer(res: Res, [key, value]: [string, any]) {
        let param: string;

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

            const relationship = context.relationships.find(
                (x) => x.properties === relationField.properties
            ) as unknown as Relationship;

            if (relationField.union) {
                Object.keys(value).forEach((unionTypeName) => {
                    refNodes.push(context.nodes.find((x) => x.name === unionTypeName) as Node);
                });
            } else if (relationField.interface) {
                relationField.interface?.implementations?.forEach((implementationName) => {
                    refNodes.push(context.nodes.find((x) => x.name === implementationName) as Node);
                });
            } else {
                refNodes.push(context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";

            const subqueries: string[] = [];

            refNodes.forEach((refNode) => {
                const v = relationField.union ? value[refNode.name] : value;
                const updates = relationField.typeMeta.array ? v : [v];
                const subquery: string[] = [];

                updates.forEach((update, index) => {
                    const relationshipVariable = `${varName}_${relationField.type.toLowerCase()}${index}_relationship`;
                    const relTypeStr = `[${relationshipVariable}:${relationField.type}]`;
                    const _varName = `${varName}_${key}${relationField.union ? `_${refNode.name}` : ""}${index}`;

                    if (update.update) {
                        const whereStrs: string[] = [];

                        if (update.where) {
                            try {
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
                                if (whereClause) {
                                    whereStrs.push(whereClause);
                                }
                            } catch {
                                return;
                            }
                        }

                        if (withVars) {
                            subquery.push(`WITH ${withVars.join(", ")}`);
                        }

                        const labels = refNode.getLabelString(context);
                        subquery.push(
                            `OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${_varName}${labels})`
                        );

                        if (node.auth) {
                            const whereAuth = createAuthAndParams({
                                operations: "UPDATE",
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
                            subquery.push(`WHERE ${whereStrs.join(" AND ")}`);
                        }

                        if (update.update.node) {
                            subquery.push(`CALL apoc.do.when(${_varName} IS NOT NULL, "`);
                            const nestedWithVars = [...withVars, _varName];
                            const auth = createAuthParam({ context });
                            let innerApocParams = { auth };

                            const nestedUpdateInput = Object.entries(update.update.node)
                                .filter(([k]) => {
                                    if (k === "_on") {
                                        return false;
                                    }

                                    if (relationField.interface && update.update.node?._on?.[refNode.name]) {
                                        const onArray = Array.isArray(update.update.node._on[refNode.name])
                                            ? update.update.node._on[refNode.name]
                                            : [update.update.node._on[refNode.name]];
                                        if (onArray.some((onKey) => Object.prototype.hasOwnProperty.call(onKey, k))) {
                                            return false;
                                        }
                                    }

                                    return true;
                                })
                                .reduce((d1, [k1, v1]) => ({ ...d1, [k1]: v1 }), {});

                            const updateAndParams = createUpdateAndParams({
                                context,
                                callbackBucket,
                                node: refNode,
                                updateInput: nestedUpdateInput,
                                varName: _varName,
                                withVars: nestedWithVars,
                                parentVar: _varName,
                                chainStr: `${param}${relationField.union ? `_${refNode.name}` : ""}${index}`,
                                parameterPrefix: `${parameterPrefix}.${key}${
                                    relationField.union ? `.${refNode.name}` : ""
                                }${relationField.typeMeta.array ? `[${index}]` : ``}.update.node`,
                                includeRelationshipValidation: true,
                            });
                            res.params = { ...res.params, ...updateAndParams[1], auth };
                            innerApocParams = { ...innerApocParams, ...updateAndParams[1] };
                            const updateStrs = [escapeQuery(updateAndParams[0])];

                            if (relationField.interface && update.update.node?._on?.[refNode.name]) {
                                const onUpdateAndParams = createUpdateAndParams({
                                    context,
                                    callbackBucket,
                                    node: refNode,
                                    updateInput: update.update.node._on[refNode.name],
                                    varName: _varName,
                                    withVars: nestedWithVars,
                                    parentVar: _varName,
                                    chainStr: `${param}${relationField.union ? `_${refNode.name}` : ""}${index}_on_${
                                        refNode.name
                                    }`,
                                    parameterPrefix: `${parameterPrefix}.${key}${
                                        relationField.union ? `.${refNode.name}` : ""
                                    }${relationField.typeMeta.array ? `[${index}]` : ``}.update.node._on.${
                                        refNode.name
                                    }`,
                                });
                                res.params = { ...res.params, ...onUpdateAndParams[1], auth };
                                innerApocParams = { ...innerApocParams, ...onUpdateAndParams[1] };
                                updateStrs.push(escapeQuery(onUpdateAndParams[0]));
                            }
                            if (context.subscriptionsEnabled) {
                                updateStrs.push(`RETURN ${META_CYPHER_VARIABLE}`);
                            } else {
                                updateStrs.push("RETURN count(*)");
                            }
                            const apocArgs = `{${withVars.map((withVar) => `${withVar}:${withVar}`).join(", ")}, ${
                                parameterPrefix?.split(".")[0]
                            }: $${parameterPrefix?.split(".")[0]}, ${_varName}:${_varName}REPLACE_ME}`;

                            updateStrs.push(
                                `", ${
                                    context.subscriptionsEnabled ? `"RETURN ${META_CYPHER_VARIABLE}"` : `""`
                                }, ${apocArgs})`
                            );
                            if (context.subscriptionsEnabled) {
                                updateStrs.push("YIELD value");
                                updateStrs.push(`WITH ${filterMetaVariable(withVars).join(", ")}, value.meta AS meta`);
                            } else {
                                updateStrs.push("YIELD value AS _");
                            }

                            const paramsString = Object.keys(innerApocParams)
                                .reduce((r: string[], k) => [...r, `${k}:$${k}`], [])
                                .join(",");

                            const updateStr = updateStrs.join("\n").replace(/REPLACE_ME/g, `, ${paramsString}`);
                            subquery.push(updateStr);
                        }

                        if (update.update.edge) {
                            subquery.push(`CALL apoc.do.when(${relationshipVariable} IS NOT NULL, "`);

                            const setProperties = createSetRelationshipProperties({
                                properties: update.update.edge,
                                varName: relationshipVariable,
                                relationship,
                                callbackBucket,
                                operation: "UPDATE",
                                parameterPrefix: `${parameterPrefix}.${key}${
                                    relationField.union ? `.${refNode.name}` : ""
                                }${relationField.typeMeta.array ? `[${index}]` : ``}.update.edge`,
                            });

                            const updateStrs = [escapeQuery(setProperties), escapeQuery("RETURN count(*)")];

                            const apocArgs = `{${relationshipVariable}:${relationshipVariable}, ${
                                parameterPrefix?.split(".")[0]
                            }: $${parameterPrefix?.split(".")[0]}, resolvedCallbacks: $resolvedCallbacks}`;

                            updateStrs.push(`", "", ${apocArgs})`);
                            updateStrs.push(`YIELD value AS ${relationshipVariable}_${key}${index}_edge`);
                            subquery.push(updateStrs.join("\n"));
                        }
                    }

                    if (update.disconnect) {
                        const disconnectAndParams = createDisconnectAndParams({
                            context,
                            refNodes: [refNode],
                            value: update.disconnect,
                            varName: `${_varName}_disconnect`,
                            withVars,
                            parentVar,
                            relationField,
                            labelOverride: relationField.union ? refNode.name : "",
                            parentNode: node,
                            parameterPrefix: `${parameterPrefix}.${key}${
                                relationField.union ? `.${refNode.name}` : ""
                            }${relationField.typeMeta.array ? `[${index}]` : ""}.disconnect`,
                        });
                        subquery.push(disconnectAndParams[0]);
                        res.params = { ...res.params, ...disconnectAndParams[1] };
                    }

                    if (update.connect) {
                        const connectAndParams = createConnectAndParams({
                            context,
                            callbackBucket,
                            refNodes: [refNode],
                            value: update.connect,
                            varName: `${_varName}_connect`,
                            withVars,
                            parentVar,
                            relationField,
                            labelOverride: relationField.union ? refNode.name : "",
                            parentNode: node,
                        });
                        subquery.push(connectAndParams[0]);
                        res.params = { ...res.params, ...connectAndParams[1] };
                    }

                    if (update.connectOrCreate) {
                        const { cypher, params } = createConnectOrCreateAndParams({
                            input: update.connectOrCreate,
                            varName: `${_varName}_connectOrCreate`,
                            parentVar: varName,
                            relationField,
                            refNode,
                            context,
                            withVars,
                        });
                        subquery.push(cypher);
                        res.params = { ...res.params, ...params };
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
                            parameterPrefix: `${parameterPrefix}.${key}${
                                relationField.typeMeta.array ? `[${index}]` : ``
                            }.delete`, // its use here
                            recursing: true,
                        });
                        subquery.push(deleteAndParams[0]);
                        res.params = { ...res.params, ...deleteAndParams[1] };
                    }

                    if (update.create) {
                        if (withVars) {
                            subquery.push(`WITH ${withVars.join(", ")}`);
                        }
                        const creates = relationField.typeMeta.array ? update.create : [update.create];
                        creates.forEach((create, i) => {
                            const baseName = `${_varName}_create${i}`;
                            const nodeName = `${baseName}_node`;
                            const propertiesName = `${baseName}_relationship`;

                            const createAndParams = createCreateAndParams({
                                context,
                                callbackBucket,
                                node: refNode,
                                input: create.node,
                                varName: nodeName,
                                withVars: [...withVars, nodeName],
                                includeRelationshipValidation: false,
                            });
                            subquery.push(createAndParams[0]);
                            res.params = { ...res.params, ...createAndParams[1] };
                            subquery.push(
                                `MERGE (${parentVar})${inStr}[${create.edge ? propertiesName : ""}:${
                                    relationField.type
                                }]${outStr}(${nodeName})`
                            );

                            if (create.edge) {
                                const setA = createSetRelationshipProperties({
                                    properties: create.edge,
                                    varName: propertiesName,
                                    relationship,
                                    callbackBucket,
                                    operation: "CREATE",
                                    parameterPrefix: `${parameterPrefix}.${key}${
                                        relationField.union ? `.${refNode.name}` : ""
                                    }[${index}].create[${i}].edge`,
                                });
                                subquery.push(setA);
                            }

                            const relationshipValidationStr = createRelationshipValidationStr({
                                node: refNode,
                                context,
                                varName: nodeName,
                            });
                            if (relationshipValidationStr) {
                                subquery.push(`WITH ${[...withVars, nodeName].join(", ")}`);
                                subquery.push(relationshipValidationStr);
                            }
                        });
                    }

                    if (relationField.interface) {
                        subquery.push("RETURN count(*)");
                    }
                });

                if (subquery.length) {
                    subqueries.push(subquery.join("\n"));
                }
            });

            if (relationField.interface) {
                res.strs.push(`WITH ${withVars.join(", ")}`);
                res.strs.push("CALL {");
                res.strs.push(subqueries.join("\nUNION\n"));
                res.strs.push("}");
            } else {
                res.strs.push(subqueries.join("\n"));
            }

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

        node.primitiveFields.forEach((field) =>
            addCallbackAndSetParam(field, varName, updateInput, callbackBucket, res.strs, "UPDATE")
        );

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
                    operations: "UPDATE",
                    context,
                    allow: { varName, parentNode: node, chainStr: param },
                });
                const postAuth = createAuthAndParams({
                    entity: authableField,
                    operations: "UPDATE",
                    skipRoles: true,
                    skipIsAuthenticated: true,
                    context,
                    bind: { parentNode: node, varName, chainStr: param },
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

    const reducedUpdate = Object.entries(updateInput as Record<string, unknown>).reduce(reducer, {
        strs: [],
        params: {},
    });

    const { strs, meta = { preAuthStrs: [], postAuthStrs: [] } } = reducedUpdate;
    let params = reducedUpdate.params;

    let preAuthStrs: string[] = [];
    let postAuthStrs: string[] = [];
    const withStr = `WITH ${withVars.join(", ")}`;

    const preAuth = createAuthAndParams({
        entity: node,
        context,
        allow: { parentNode: node, varName },
        operations: "UPDATE",
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
        operations: "UPDATE",
        bind: { parentNode: node, varName },
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
    const relationshipValidationStr = includeRelationshipValidation
        ? createRelationshipValidationStr({ node, context, varName })
        : "";

    const forbiddenString = `"${AUTH_FORBIDDEN_ERROR}"`;

    if (preAuthStrs.length) {
        const apocStr = `CALL apoc.util.validate(NOT(${preAuthStrs.join(" AND ")}), ${forbiddenString}, [0])`;
        preAuthStr = `${withStr}\n${apocStr}`;
    }

    if (postAuthStrs.length) {
        const apocStr = `CALL apoc.util.validate(NOT(${postAuthStrs.join(" AND ")}), ${forbiddenString}, [0])`;
        postAuthStr = `${withStr}\n${apocStr}`;
    }

    let statements = strs;
    if (context.subscriptionsEnabled) {
        statements = wrapInSubscriptionsMetaCall({
            withVars,
            nodeVariable: varName,
            typename: node.name,
            statements: strs,
        });
    }
    return [
        [
            preAuthStr,
            ...statements,
            postAuthStr,
            ...(relationshipValidationStr ? [withStr, relationshipValidationStr] : []),
        ].join("\n"),
        params,
    ];
}

function wrapInSubscriptionsMetaCall({
    statements,
    nodeVariable,
    typename,
    withVars,
}: {
    statements: string[];
    nodeVariable: string;
    typename: string;
    withVars: string[];
}): string[] {
    const updateMetaVariable = "update_meta";
    const preCallWith = `WITH ${nodeVariable} { .* } AS ${META_OLD_PROPS_CYPHER_VARIABLE}, ${withVars.join(", ")}`;

    const callBlock = ["WITH *", ...statements, `RETURN ${META_CYPHER_VARIABLE} as ${updateMetaVariable}`];
    const postCallWith = `WITH *, ${updateMetaVariable} as ${META_CYPHER_VARIABLE}`;

    const eventMeta = createEventMeta({ event: "update", nodeVariable, typename });
    const eventMetaWith = `WITH ${filterMetaVariable(withVars).join(", ")}, ${eventMeta}`;

    return [preCallWith, "CALL {", ...indentBlock(callBlock), "}", postCallWith, eventMetaWith];
}
