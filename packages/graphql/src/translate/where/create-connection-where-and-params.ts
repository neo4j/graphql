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

import { Node, Relationship } from "../../classes";
import { ConnectionWhereArg, Context } from "../../types";
import createRelationshipWhereAndParams from "./create-relationship-where-and-params";
import createNodeWhereAndParams from "./create-node-where-and-params";

function createConnectionWhereAndParams({
    whereInput,
    context,
    node,
    nodeVariable,
    relationship,
    relationshipVariable,
    parameterPrefix,
}: {
    whereInput: ConnectionWhereArg;
    context: Context;
    node: Node;
    nodeVariable: string;
    relationship: Relationship;
    relationshipVariable: string;
    parameterPrefix: string;
}): [string, any] {
    const reduced = Object.entries(whereInput).reduce<{ whereStrs: string[]; params: any }>(
        (res, [k, v]) => {
            if (["AND", "OR"].includes(k)) {
                const innerClauses: string[] = [];
                const innerParams: any[] = [];

                v.forEach((o, i) => {
                    const or = createConnectionWhereAndParams({
                        whereInput: o,
                        node,
                        nodeVariable,
                        relationship,
                        relationshipVariable,
                        context,
                        parameterPrefix: `${parameterPrefix}.${k}[${i}]`,
                    });

                    innerClauses.push(`${or[0]}`);
                    innerParams.push(or[1]);
                });

                const whereStrs = [...res.whereStrs, `(${innerClauses.filter((clause) => !!clause).join(` ${k} `)})`];
                const params = { ...res.params, [k]: innerParams };
                res = { whereStrs, params };
                return res;
            }

            if (k.startsWith("edge")) {
                const relationshipWhere = createRelationshipWhereAndParams({
                    whereInput: v,
                    relationship,
                    relationshipVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${k}`,
                });

                const whereStrs = [
                    ...res.whereStrs,
                    k === "edge_NOT" ? `(NOT ${relationshipWhere[0]})` : relationshipWhere[0],
                ];
                const params = { ...res.params, [k]: relationshipWhere[1] };
                res = { whereStrs, params };
                return res;
            }

            if (k.startsWith("node") || k.startsWith(node.name)) {
                let { whereStrs } = res;
                let { params } = res;

                if (Object.keys(v).length === 1 && v._on && !Object.prototype.hasOwnProperty.call(v._on, node.name)) {
                    throw new Error("_on is used as the only argument and node is not present within");
                }

                const rootNodeWhere = createNodeWhereAndParams({
                    whereInput: {
                        ...Object.entries(v).reduce((args, [key, value]) => {
                            if (key !== "_on") {
                                if (
                                    v._on &&
                                    Object.prototype.hasOwnProperty.call(v._on, node.name) &&
                                    Object.prototype.hasOwnProperty.call(v._on[node.name], key)
                                ) {
                                    return args;
                                }
                                return { ...args, [key]: value };
                            }

                            return args;
                        }, {}),
                    },
                    node,
                    nodeVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${k}`,
                });

                if (rootNodeWhere[0]) {
                    whereStrs = [...whereStrs, k.endsWith("_NOT") ? `(NOT ${rootNodeWhere[0]})` : rootNodeWhere[0]];
                    params = { ...params, [k]: rootNodeWhere[1] };
                    res = { whereStrs, params };
                }

                if (v._on && Object.prototype.hasOwnProperty.call(v._on, node.name)) {
                    const onTypeNodeWhere = createNodeWhereAndParams({
                        whereInput: {
                            ...Object.entries(v).reduce((args, [key, value]) => {
                                if (key !== "_on") {
                                    return { ...args, [key]: value };
                                }

                                if (Object.prototype.hasOwnProperty.call(value, node.name)) {
                                    return { ...args, ...(value as any)[node.name] };
                                }

                                return args;
                            }, {}),
                        },
                        node,
                        nodeVariable,
                        context,
                        parameterPrefix: `${parameterPrefix}.${k}._on.${node.name}`,
                    });

                    whereStrs = [...whereStrs, k.endsWith("_NOT") ? `(NOT ${onTypeNodeWhere[0]})` : onTypeNodeWhere[0]];
                    params = { ...params, [k]: onTypeNodeWhere[1] };
                    res = { whereStrs, params };
                }
            }
            return res;
        },
        { whereStrs: [], params: {} }
    );

    return [reduced.whereStrs.join(" AND "), reduced.params];
}

export default createConnectionWhereAndParams;
