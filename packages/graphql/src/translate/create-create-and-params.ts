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
import createSetRelationshipProperties from "./create-set-relationship-properties";

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
        const _varName = `${varName}_${key}`;
        const relationField = node.relationFields.find((x) => key.startsWith(x.fieldName));
        const primitiveField = node.primitiveFields.find((x) => key === x.fieldName);
        const pointField = node.pointFields.find((x) => key.startsWith(x.fieldName));

        if (relationField) {
            let refNode: Node;
            let unionTypeName = "";

            if (relationField.union) {
                [unionTypeName] = key.split(`${relationField.fieldName}_`).join("").split("_");
                refNode = context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node;
            } else {
                refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            }

            if (value.create) {
                const creates = relationField.typeMeta.array ? value.create : [value.create];
                creates.forEach((create, index) => {
                    res.creates.push(`\nWITH ${withVars.join(", ")}`);

                    const baseName = `${_varName}${index}`;
                    const nodeName = `${baseName}_node`;
                    const propertiesName = `${baseName}_relationship`;

                    const recurse = createCreateAndParams({
                        input: create.node,
                        context,
                        node: refNode,
                        varName: nodeName,
                        withVars: [...withVars, nodeName],
                    });
                    res.creates.push(recurse[0]);
                    res.params = { ...res.params, ...recurse[1] };

                    const inStr = relationField.direction === "IN" ? "<-" : "-";
                    const outStr = relationField.direction === "OUT" ? "->" : "-";
                    const relTypeStr = `[${create.properties ? propertiesName : ""}:${relationField.type}]`;
                    res.creates.push(`MERGE (${varName})${inStr}${relTypeStr}${outStr}(${nodeName})`);

                    if (create.properties) {
                        const relationship = (context.neoSchema.relationships.find(
                            (x) => x.properties === relationField.properties
                        ) as unknown) as Relationship;

                        const setA = createSetRelationshipProperties({
                            properties: create.properties,
                            varName: propertiesName,
                            relationship,
                            operation: "CREATE",
                        });
                        res.creates.push(setA[0]);
                        res.params = { ...res.params, ...setA[1] };
                    }
                });
            }

            if (value.connect) {
                const connectAndParams = createConnectAndParams({
                    withVars,
                    value: value.connect,
                    varName: `${_varName}_connect`,
                    parentVar: varName,
                    relationField,
                    context,
                    refNode,
                    labelOverride: unionTypeName,
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
                operation: "CREATE",
                context,
                bind: { parentNode: node, varName, chainStr: _varName },
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
                res.creates.push(`SET ${varName}.${key} = [p in $${_varName} | point(p)]`);
            } else {
                res.creates.push(`SET ${varName}.${key} = point($${_varName})`);
            }

            res.params[_varName] = value;

            return res;
        }

        res.creates.push(`SET ${varName}.${key} = $${_varName}`);
        res.params[_varName] = value;

        return res;
    }

    const initial = [`CREATE (${varName}:${node.name})`];

    const timestamps = node.dateTimeFields.filter((x) => x.timestamps && x.timestamps.includes("CREATE"));
    timestamps.forEach((ts) => {
        initial.push(`SET ${varName}.${ts.fieldName} = datetime()`);
    });

    const autogeneratedIdFields = node.primitiveFields.filter((x) => x.autogenerate);
    autogeneratedIdFields.forEach((f) => {
        initial.push(`SET ${varName}.${f.fieldName} = randomUUID()`);
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
            operation: "CREATE",
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
