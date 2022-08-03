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

import type { Node, Relationship } from "../../classes";
import type { ConnectionWhereArg, Context } from "../../types";
import createElementWhereAndParams from "./create-element-where-and-params";
import type { ListPredicate, whereRegEx, WhereRegexGroups } from "./utils";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import { createCypherWhereParams } from "./create-cypher-where-params";
import {
    createConnectionOperation,
    createConnectionWherePropertyOperation,
} from "./property-operations/create-connection-operation";
import { filterTruthy } from "../../utils/utils";
import { createWherePropertyOperation } from "./property-operations/create-where-property-operation";

function createConnectionWhereAndParams({
    whereInput,
    context,
    node,
    nodeVariable,
    relationship,
    relationshipVariable,
    parameterPrefix,
    listPredicates,
}: {
    whereInput: ConnectionWhereArg;
    context: Context;
    node: Node;
    nodeVariable: string;
    relationship: Relationship;
    relationshipVariable: string;
    parameterPrefix: string;
    listPredicates?: ListPredicate[];
}): [string, any] {
    const nodeRef = new CypherBuilder.NamedNode(nodeVariable);
    const relationshipRef = new CypherBuilder.NamedNode(relationshipVariable) as any as CypherBuilder.Relationship; // THIS IS WRONG; just for testing
    const whereFields = Object.entries(whereInput);

    const andOp = createConnectionWherePropertyOperation({
        context,
        whereInput,
        relationshipRef,
        targetNode: nodeRef,
        node,
        edge: relationship,
    });

    // const operations = whereFields.map(([key, value]): CypherBuilder.WhereParams | undefined => {
    //     console.log(key, value);
    //     const match = whereRegEx.exec(key);
    //     if (!match) {
    //         throw new Error(`Failed to match key in filter: ${key}`);
    //     }

    //     const { prefix, fieldName, isAggregate, operator } = match?.groups as WhereRegexGroups;

    //     if (!fieldName) {
    //         throw new Error(`Failed to find field name in filter: ${key}`);
    //     }

    //     // const connectionField = node.connectionFields.find((x) => x.fieldName === fieldName);
    //     // if (connectionField) {
    //     //     return createConnectionOperation({
    //     //         value: whereInput,
    //     //         connectionField,
    //     //         context,
    //     //         parentNode: nodeRef,
    //     //         operator: undefined,
    //     //     });
    //     // }
    //     return createWherePropertyOperation({ key, value, element: node, targetElement: nodeRef, context });
    // });

    // const ops = filterTruthy(operations);

    // const andOp = CypherBuilder.and(...ops);

    // const whereParams = createCypherWhereParams({
    //     element: relationship,
    //     context,
    //     whereInput,
    //     targetElement: relationshipRef,
    // });

    const whereCypher = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
        const cypher = andOp?.getCypher(env) || "";

        return [cypher, {}];
    });
    console.log("before result");
    const result = whereCypher.build(`${parameterPrefix.replace(/\./g, "_").replace(/\[|\]/g, "")}_${node.name}`);
    // const whereStr = `${!recursing ? "WHERE " : ""}`;
    return [result.cypher, result.params];
    // return [`${whereStr}${result.cypher}`, result.params];

    // const clause = new CypherBuilder.RawCypher(() => {
    //     return createConnectionWhereAndParamsOld({
    //         whereInput,
    //         context,
    //         node,
    //         nodeVariable,
    //         relationship,
    //         relationshipVariable,
    //         parameterPrefix,
    //         listPredicates,
    //     });
    // });

    // const result = clause.build();
    // return [result.cypher, result.params];
}

function createConnectionWhereAndParamsOld({
    whereInput,
    context,
    node,
    nodeVariable,
    relationship,
    relationshipVariable,
    parameterPrefix,
    listPredicates,
}: {
    whereInput: ConnectionWhereArg;
    context: Context;
    node: Node;
    nodeVariable: string;
    relationship: Relationship;
    relationshipVariable: string;
    parameterPrefix: string;
    listPredicates?: ListPredicate[];
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
                return { whereStrs, params };
            }

            if (k.startsWith("edge")) {
                const relationshipWhere = createElementWhereAndParams({
                    whereInput: v,
                    element: relationship,
                    varName: relationshipVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${k}`,
                    listPredicates,
                });
                const whereStrs = [
                    ...res.whereStrs,
                    k === "edge_NOT" ? `(NOT ${relationshipWhere[0]})` : relationshipWhere[0],
                ];
                const params = { ...res.params, [k]: relationshipWhere[1] };
                return { whereStrs, params };
            }

            if (k.startsWith("node") || k.startsWith(node.name)) {
                let { whereStrs } = res;
                let { params } = res;

                if (Object.keys(v).length === 1 && v._on && !Object.prototype.hasOwnProperty.call(v._on, node.name)) {
                    throw new Error("_on is used as the only argument and node is not present within");
                }
                const rootNodeWhere = createElementWhereAndParams({
                    whereInput: {
                        ...Object.entries(v).reduce((args, [key, value]) => {
                            if (key !== "_on") {
                                if (v?._on?.[node.name]?.[key]) {
                                    return args;
                                }
                                return { ...args, [key]: value };
                            }

                            return args;
                        }, {}),
                    },
                    element: node,
                    varName: nodeVariable,
                    context,
                    parameterPrefix: `${parameterPrefix}.${k}`,
                    listPredicates,
                });

                if (rootNodeWhere[0]) {
                    whereStrs = [...whereStrs, k.endsWith("_NOT") ? `(NOT ${rootNodeWhere[0]})` : rootNodeWhere[0]];
                    params = { ...params, [k]: rootNodeWhere[1], ...rootNodeWhere[1] };
                    res = { whereStrs, params };
                }

                if (v?._on?.[node.name]) {
                    const onTypeNodeWhere = createElementWhereAndParams({
                        whereInput: v._on[node.name],
                        element: node,
                        varName: nodeVariable,
                        context,
                        parameterPrefix: `${parameterPrefix}.${k}._on.${node.name}`,
                        listPredicates,
                    });

                    whereStrs = [...whereStrs, k.endsWith("_NOT") ? `(NOT ${onTypeNodeWhere[0]})` : onTypeNodeWhere[0]];
                    params = { ...params, [k]: { _on: { [node.name]: onTypeNodeWhere[1] } } };
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
