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
import createWhereAndParams from "./create-where-and-params";
import createAuthAndParams from "./create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import createSetRelationshipPropertiesAndParams from "./create-set-relationship-properties-and-params";

interface Res {
    connects: string[];
    params: any;
}

function createConnectAndParams({
    withVars,
    value,
    varName,
    relationField,
    parentVar,
    refNode,
    context,
    labelOverride,
    parentNode,
    fromCreate,
    insideDoWhen,
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
    fromCreate?: boolean;
    insideDoWhen?: boolean;
}): [string, any] {
    function reducer(res: Res, connect: any, index): Res {
        const baseName = `${varName}${index}`;
        const nodeName = `${baseName}_node`;
        const relationshipName = `${baseName}_relationship`;
        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relTypeStr = `[${connect.edge ? relationshipName : ""}:${relationField.type}]`;

        const labels = refNode?.nodeDirective?.getLabelsString(refNode.name) || `:${refNode?.name}`;
        const label = labelOverride ? `:${labelOverride}` : labels;

        if (parentNode.auth && !fromCreate) {
            const whereAuth = createAuthAndParams({
                operation: "CONNECT",
                entity: parentNode,
                context,
                where: { varName: parentVar, node: parentNode },
            });
            if (whereAuth[0]) {
                res.connects.push(`WITH ${withVars.join(", ")}`);
                res.connects.push(`WHERE ${whereAuth[0]}`);
                res.params = { ...res.params, ...whereAuth[1] };
            }
        }

        res.connects.push(`WITH ${withVars.join(", ")}`);
        res.connects.push("CALL {");

        res.connects.push(`WITH ${withVars.join(", ")}`);
        res.connects.push(`OPTIONAL MATCH (${nodeName}${label})`);

        const whereStrs: string[] = [];
        if (connect.where) {
            const where = createWhereAndParams({
                varName: nodeName,
                whereInput: connect.where.node,
                node: refNode,
                context,
                recursing: true,
            });
            if (where[0]) {
                whereStrs.push(where[0]);
                res.params = { ...res.params, ...where[1] };
            }
        }
        if (refNode.auth) {
            const whereAuth = createAuthAndParams({
                operation: "CONNECT",
                entity: refNode,
                context,
                where: { varName: nodeName, node: refNode },
            });
            if (whereAuth[0]) {
                whereStrs.push(whereAuth[0]);
                res.params = { ...res.params, ...whereAuth[1] };
            }
        }

        if (whereStrs.length) {
            res.connects.push(`WHERE ${whereStrs.join(" AND ")}`);
        }

        const preAuth = [...(!fromCreate ? [parentNode] : []), refNode].reduce(
            (result: Res, node, i) => {
                if (!node.auth) {
                    return result;
                }

                const [str, params] = createAuthAndParams({
                    entity: node,
                    operation: "CONNECT",
                    context,
                    escapeQuotes: Boolean(insideDoWhen),
                    allow: { parentNode: node, varName: nodeName, chainStr: `${nodeName}${node.name}${i}_allow` },
                });

                if (!str) {
                    return result;
                }

                result.connects.push(str);
                result.params = { ...result.params, ...params };

                return result;
            },
            { connects: [], params: {} }
        );

        if (preAuth.connects.length) {
            const quote = insideDoWhen ? `\\"` : `"`;
            res.connects.push(`WITH ${[...withVars, nodeName].join(", ")}`);
            res.connects.push(
                `CALL apoc.util.validate(NOT(${preAuth.connects.join(
                    " AND "
                )}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
            );
            res.params = { ...res.params, ...preAuth.params };
        }

        /*
           TODO
           Replace with subclauses https://neo4j.com/developer/kb/conditional-cypher-execution/
           https://neo4j.slack.com/archives/C02PUHA7C/p1603458561099100
        */
        res.connects.push(`FOREACH(_ IN CASE ${nodeName} WHEN NULL THEN [] ELSE [1] END | `);
        res.connects.push(`MERGE (${parentVar})${inStr}${relTypeStr}${outStr}(${nodeName})`);

        if (connect.edge) {
            const relationship = (context.neoSchema.relationships.find(
                (x) => x.properties === relationField.properties
            ) as unknown) as Relationship;

            const setA = createSetRelationshipPropertiesAndParams({
                properties: connect.edge,
                varName: relationshipName,
                relationship,
                operation: "CREATE",
            });
            res.connects.push(setA[0]);
            res.params = { ...res.params, ...setA[1] };
        }

        res.connects.push(`)`); // close FOREACH

        if (connect.connect) {
            const connects = (Array.isArray(connect.connect) ? connect.connect : [connect.connect]) as any[];
            connects.forEach((c) => {
                const reduced = Object.entries(c).reduce(
                    (r: Res, [k, v]: [string, any]) => {
                        const relField = refNode.relationFields.find((x) => k === x.fieldName) as RelationField;
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
                            const recurse = createConnectAndParams({
                                withVars: [...withVars, nodeName],
                                value: relField.union ? v[newRefNode.name] : v,
                                varName: `${nodeName}_${k}${relField.union ? `_${newRefNode.name}` : ""}`,
                                relationField: relField,
                                parentVar: nodeName,
                                context,
                                refNode: newRefNode,
                                parentNode: refNode,
                                labelOverride: relField.union ? newRefNode.name : "",
                            });
                            r.connects.push(recurse[0]);
                            r.params = { ...r.params, ...recurse[1] };
                        });

                        return r;
                    },
                    { connects: [], params: {} }
                );

                res.connects.push(reduced.connects.join("\n"));
                res.params = { ...res.params, ...reduced.params };
            });
        }

        const postAuth = [...(!fromCreate ? [parentNode] : []), refNode].reduce(
            (result: Res, node, i) => {
                if (!node.auth) {
                    return result;
                }

                const [str, params] = createAuthAndParams({
                    entity: node,
                    operation: "CONNECT",
                    context,
                    escapeQuotes: Boolean(insideDoWhen),
                    skipIsAuthenticated: true,
                    skipRoles: true,
                    bind: { parentNode: node, varName: nodeName, chainStr: `${nodeName}${node.name}${i}_bind` },
                });

                if (!str) {
                    return result;
                }

                result.connects.push(str);
                result.params = { ...result.params, ...params };

                return result;
            },
            { connects: [], params: {} }
        );

        if (postAuth.connects.length) {
            const quote = insideDoWhen ? `\\"` : `"`;
            res.connects.push(`WITH ${[...withVars, nodeName].join(", ")}`);
            res.connects.push(
                `CALL apoc.util.validate(NOT(${postAuth.connects.join(
                    " AND "
                )}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
            );
            res.params = { ...res.params, ...postAuth.params };
        }

        res.connects.push("RETURN count(*)");
        res.connects.push("}");

        return res;
    }

    const { connects, params } = ((relationField.typeMeta.array ? value : [value]) as any[]).reduce(reducer, {
        connects: [],
        params: {},
    });

    return [connects.join("\n"), params];
}

export default createConnectAndParams;
