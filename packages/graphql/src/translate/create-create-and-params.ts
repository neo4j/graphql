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
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createSetRelationshipPropertiesAndParams from "./create-set-relationship-properties-and-params";
import mapToDbProperty from "../utils/map-to-db-property";
import { createConnectOrCreateAndParams } from "./connect-or-create/create-connect-or-create-and-params";

interface Res {
    creates: string[];
    params: any;
    meta?: CreateMeta;
}

interface CreateMeta {
    authStrs: string[];
}

function createCreateAndParams({
    input,
    varName,
    node,
    context,
    withVars,
    insideDoWhen,
}: {
    input: any;
    varName: string;
    node: Node;
    context: Context;
    withVars: string[];
    insideDoWhen?: boolean;
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]): Res {
        const varNameKey = `${varName}_${key}`;
        const relationField = node.relationFields.find((x) => key === x.fieldName);
        const primitiveField = node.primitiveFields.find((x) => key === x.fieldName);
        const pointField = node.pointFields.find((x) => key === x.fieldName);

        const dbFieldName = mapToDbProperty(node, key);

        if (relationField) {
            const refNodes: Node[] = [];
            // let unionTypeName = "";

            if (relationField.union) {
                // [unionTypeName] = key.split(`${relationField.fieldName}_`).join("").split("_");

                Object.keys(value).forEach((unionTypeName) => {
                    refNodes.push(context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node);
                });

                // refNode = context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node;
            } else if (relationField.interface) {
                relationField.interface?.implementations?.forEach((implementationName) => {
                    refNodes.push(context.neoSchema.nodes.find((x) => x.name === implementationName) as Node);
                });
            } else {
                refNodes.push(context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            refNodes.forEach((refNode) => {
                const v = relationField.union ? value[refNode.name] : value;
                const unionTypeName = relationField.union || relationField.interface ? refNode.name : "";

                if (v.create) {
                    const creates = relationField.typeMeta.array ? v.create : [v.create];
                    creates.forEach((create, index) => {
                        if (relationField.interface && !create.node[refNode.name]) {
                            return;
                        }

                        res.creates.push(`\nWITH ${withVars.join(", ")}`);

                        const baseName = `${varNameKey}${relationField.union ? "_" : ""}${unionTypeName}${index}`;
                        const nodeName = `${baseName}_node`;
                        const propertiesName = `${baseName}_relationship`;

                        const recurse = createCreateAndParams({
                            input: relationField.interface ? create.node[refNode.name] : create.node,
                            context,
                            node: refNode,
                            varName: nodeName,
                            withVars: [...withVars, nodeName],
                        });
                        res.creates.push(recurse[0]);
                        res.params = { ...res.params, ...recurse[1] };

                        const inStr = relationField.direction === "IN" ? "<-" : "-";
                        const outStr = relationField.direction === "OUT" ? "->" : "-";
                        const relTypeStr = `[${relationField.properties ? propertiesName : ""}:${relationField.type}]`;
                        res.creates.push(`MERGE (${varName})${inStr}${relTypeStr}${outStr}(${nodeName})`);

                        if (relationField.properties) {
                            const relationship = (context.neoSchema.relationships.find(
                                (x) => x.properties === relationField.properties
                            ) as unknown) as Relationship;

                            const setA = createSetRelationshipPropertiesAndParams({
                                properties: create.edge ?? {},
                                varName: propertiesName,
                                relationship,
                                operation: "CREATE",
                            });
                            res.creates.push(setA[0]);
                            res.params = { ...res.params, ...setA[1] };
                        }
                    });
                }

                if (!relationField.interface && v.connect) {
                    const connectAndParams = createConnectAndParams({
                        withVars,
                        value: v.connect,
                        varName: `${varNameKey}${relationField.union ? "_" : ""}${unionTypeName}_connect`,
                        parentVar: varName,
                        relationField,
                        context,
                        refNodes: [refNode],
                        labelOverride: unionTypeName,
                        parentNode: node,
                        fromCreate: true,
                    });
                    res.creates.push(connectAndParams[0]);
                    res.params = { ...res.params, ...connectAndParams[1] };
                }

                if (v.connectOrCreate) {
                    const [connectOrCreateQuery, connectOrCreateParams] = createConnectOrCreateAndParams({
                        input: v.connectOrCreate,
                        varName: `${varNameKey}${relationField.union ? "_" : ""}${unionTypeName}_connectOrCreate`,
                        parentVar: varName,
                        relationField,
                        refNode,
                        context,
                    });
                    res.creates.push(connectOrCreateQuery);
                    res.params = { ...res.params, ...connectOrCreateParams };
                }
            });

            if (relationField.interface && value.connect) {
                const connectAndParams = createConnectAndParams({
                    withVars,
                    value: value.connect,
                    varName: `${varNameKey}${relationField.union ? "_" : ""}_connect`,
                    parentVar: varName,
                    relationField,
                    context,
                    refNodes,
                    labelOverride: "",
                    parentNode: node,
                    fromCreate: true,
                });
                res.creates.push(connectAndParams[0]);
                res.params = { ...res.params, ...connectAndParams[1] };
            }

            return res;
        }

        if (primitiveField?.auth) {
            const authAndParams = createAuthAndParams({
                entity: primitiveField,
                operations: "CREATE",
                context,
                bind: { parentNode: node, varName, chainStr: varNameKey },
                escapeQuotes: Boolean(insideDoWhen),
            });
            if (authAndParams[0]) {
                if (!res.meta) {
                    res.meta = { authStrs: [] };
                }

                res.meta.authStrs.push(authAndParams[0]);
                res.params = { ...res.params, ...authAndParams[1] };
            }
        }

        if (pointField) {
            if (pointField.typeMeta.array) {
                res.creates.push(`SET ${varName}.${dbFieldName} = [p in $${varNameKey} | point(p)]`);
            } else {
                res.creates.push(`SET ${varName}.${dbFieldName} = point($${varNameKey})`);
            }

            res.params[varNameKey] = value;

            return res;
        }

        res.creates.push(`SET ${varName}.${dbFieldName} = $${varNameKey}`);
        res.params[varNameKey] = value;

        return res;
    }

    const labels = node.getLabelString(context);
    const initial = [`CREATE (${varName}${labels})`];

    const timestampedFields = node.temporalFields.filter(
        (x) => ["DateTime", "Time"].includes(x.typeMeta.name) && x.timestamps?.includes("CREATE")
    );
    timestampedFields.forEach((field) => {
        // DateTime -> datetime(); Time -> time()
        initial.push(`SET ${varName}.${field.dbPropertyName} = ${field.typeMeta.name.toLowerCase()}()`);
    });

    const autogeneratedIdFields = node.primitiveFields.filter((x) => x.autogenerate);
    autogeneratedIdFields.forEach((f) => {
        initial.push(`SET ${varName}.${f.dbPropertyName} = randomUUID()`);
    });

    // eslint-disable-next-line prefer-const
    let { creates, params, meta } = Object.entries(input).reduce(reducer, {
        creates: initial,
        params: {},
    });

    const forbiddenString = insideDoWhen ? `\\"${AUTH_FORBIDDEN_ERROR}\\"` : `"${AUTH_FORBIDDEN_ERROR}"`;

    if (node.auth) {
        const bindAndParams = createAuthAndParams({
            entity: node,
            operations: "CREATE",
            context,
            bind: { parentNode: node, varName },
            escapeQuotes: Boolean(insideDoWhen),
        });
        if (bindAndParams[0]) {
            creates.push(`WITH ${withVars.join(", ")}`);
            creates.push(`CALL apoc.util.validate(NOT(${bindAndParams[0]}), ${forbiddenString}, [0])`);
            params = { ...params, ...bindAndParams[1] };
        }
    }

    if (meta?.authStrs.length) {
        creates.push(`WITH ${withVars.join(", ")}`);
        creates.push(`CALL apoc.util.validate(NOT(${meta.authStrs.join(" AND ")}), ${forbiddenString}, [0])`);
    }

    return [creates.join("\n"), params];
}

export default createCreateAndParams;
