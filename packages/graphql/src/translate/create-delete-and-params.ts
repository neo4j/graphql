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
import createAuthAndParams from "./create-auth-and-params";
import createConnectionWhereAndParams from "./where/create-connection-where-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";

interface Res {
    strs: string[];
    params: any;
}

function createDeleteAndParams({
    deleteInput,
    varName,
    node,
    parentVar,
    chainStr,
    withVars,
    context,
    insideDoWhen,
    parameterPrefix,
    recursing,
}: {
    parentVar: string;
    deleteInput: any;
    varName: string;
    chainStr?: string;
    node: Node;
    withVars: string[];
    context: Context;
    insideDoWhen?: boolean;
    parameterPrefix: string;
    recursing?: boolean;
}): [string, any] {
    function reducer(res: Res, [key, value]: [string, any]) {
        const relationField = node.relationFields.find((x) => key.startsWith(x.fieldName));
        let unionTypeName = "";

        if (relationField) {
            let refNode: Node;

            const relationship = (context.neoSchema.relationships.find(
                (x) => x.properties === relationField.properties
            ) as unknown) as Relationship;

            if (relationField.union) {
                [unionTypeName] = key.split(`${relationField.fieldName}_`).join("").split("_");
                refNode = context.neoSchema.nodes.find((x) => x.name === unionTypeName) as Node;
            } else {
                refNode = context.neoSchema.nodes.find((x) => x.name === relationField.typeMeta.name) as Node;
            }

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";

            const deletes = relationField.typeMeta.array ? value : [value];
            deletes.forEach((d, index) => {
                const _varName = chainStr ? `${varName}${index}` : `${varName}_${key}${index}`;
                const relationshipVariable = `${_varName}_relationship`;
                const relTypeStr = `[${relationshipVariable}:${relationField.type}]`;

                if (withVars) {
                    res.strs.push(`WITH ${withVars.join(", ")}`);
                }

                res.strs.push(
                    `OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${_varName}:${refNode.name})`
                );

                const whereStrs: string[] = [];
                if (d.where) {
                    const whereAndParams = createConnectionWhereAndParams({
                        nodeVariable: _varName,
                        whereInput: d.where,
                        node: refNode,
                        context,
                        relationshipVariable,
                        relationship,
                        parameterPrefix: `${parameterPrefix}${!recursing ? `.${key}` : ""}${
                            relationField.typeMeta.array ? `[${index}]` : ""
                        }.where`,
                    });
                    if (whereAndParams[0]) {
                        whereStrs.push(whereAndParams[0]);
                    }
                }
                const whereAuth = createAuthAndParams({
                    operation: "DELETE",
                    entity: refNode,
                    context,
                    where: { varName: _varName, node: refNode },
                });
                if (whereAuth[0]) {
                    whereStrs.push(whereAuth[0]);
                    res.params = { ...res.params, ...whereAuth[1] };
                }
                if (whereStrs.length) {
                    res.strs.push(`WHERE ${whereStrs.join(" AND ")}`);
                }

                const allowAuth = createAuthAndParams({
                    entity: refNode,
                    operation: "DELETE",
                    context,
                    escapeQuotes: Boolean(insideDoWhen),
                    allow: { parentNode: refNode, varName: _varName },
                });
                if (allowAuth[0]) {
                    const quote = insideDoWhen ? `\\"` : `"`;
                    res.strs.push(`WITH ${[...withVars, _varName].join(", ")}`);
                    res.strs.push(
                        `CALL apoc.util.validate(NOT(${allowAuth[0]}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
                    );
                    res.params = { ...res.params, ...allowAuth[1] };
                }

                if (d.delete) {
                    const deleteAndParams = createDeleteAndParams({
                        context,
                        node: refNode,
                        deleteInput: d.delete,
                        varName: _varName,
                        withVars: [...withVars, _varName],
                        parentVar: _varName,
                        parameterPrefix: `${parameterPrefix}${!recursing ? `.${key}` : ""}${
                            relationField.typeMeta.array ? `[${index}]` : ""
                        }.delete`,
                        recursing: false,
                    });
                    res.strs.push(deleteAndParams[0]);
                    res.params = { ...res.params, ...deleteAndParams[1] };
                }

                res.strs.push(`
                    FOREACH(_ IN CASE ${_varName} WHEN NULL THEN [] ELSE [1] END |
                        DETACH DELETE ${_varName}
                    )`);
            });

            return res;
        }

        return res;
    }

    const { strs, params } = Object.entries(deleteInput).reduce(reducer, { strs: [], params: {} });

    return [strs.join("\n"), params];
}

export default createDeleteAndParams;
