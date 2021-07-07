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
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createSetRelationshipPropertiesAndParams from "./create-set-relationship-properties-and-params";

interface Res {
    creates: string[];
    params: any;
    meta?: CreateMeta;
}

interface CreateMeta {
    authStrs: string[];
}

function createAndConnect({
    varName,
    parentName,
    node,
    context,
    withVars,
    relationField,
    value,
    insideDoWhen,
}: {
    parentName: string;
    varName: string;
    node: Node;
    context: Context;
    withVars: string[];
    relationField: RelationField;
    value: any;
    insideDoWhen?: boolean;
}): [string, any] {
    const strs: string[] = [];
    let params = {};
    const inStr = relationField.direction === "IN" ? "<-" : "-";
    const outStr = relationField.direction === "OUT" ? "->" : "-";

    if (value.create) {
        const creates = relationField.typeMeta.array ? value.create : [value.create];
        creates.forEach((create, index) => {
            strs.push(`\nWITH ${withVars.join(", ")}`);

            const baseName = `${varName}${index}`;
            const nodeName = `${baseName}_node`;
            const propertiesName = `${baseName}_relationship`;

            const recurse = createCreateAndParams({
                input: create.node,
                context,
                node,
                varName: nodeName,
                withVars: [...withVars, nodeName],
                insideDoWhen,
            });
            strs.push(recurse[0]);
            params = { ...params, ...recurse[1] };

            const relTypeStr = `[${create.properties ? propertiesName : ""}:${relationField.type}]`;
            strs.push(`MERGE (${parentName})${inStr}${relTypeStr}${outStr}(${nodeName})`);

            if (create.properties) {
                const relationship = (context.neoSchema.relationships.find(
                    (x) => x.properties === relationField.properties
                ) as unknown) as Relationship;

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

    if (value.connect) {
        const connectAndParams = createConnectAndParams({
            withVars,
            value: value.connect,
            varName: `${varName}_connect`,
            parentVar: parentName,
            relationField,
            context,
            refNode: node,
            labelOverride: node.name,
            parentNode: node,
            fromCreate: true,
            insideDoWhen,
        });
        strs.push(connectAndParams[0]);
        params = { ...params, ...connectAndParams[1] };
    }

    return [strs.join("\n"), params];
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
            if (relationField.union) {
                Object.entries(value).forEach((entry) => {
                    const node = context.neoSchema.nodes.find((x) => x.name === entry[0]) as Node;

                    const [cAC, p] = createAndConnect({
                        context,
                        node,
                        relationField,
                        value: entry[1],
                        withVars,
                        parentName: varName,
                        varName: `${_varName}_${node.name}`,
                        insideDoWhen,
                    });
                    res.creates.push(cAC);
                    res.params = { ...res.params, ...p };
                });

                return res;
            }

            const refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;

            const [cAC, p] = createAndConnect({
                context,
                node: refNode,
                relationField,
                value,
                parentName: varName,
                varName: _varName,
                withVars,
                insideDoWhen,
            });
            res.creates.push(cAC);
            res.params = { ...res.params, ...p };

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
