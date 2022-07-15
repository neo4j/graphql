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

import type { ConnectionField, ConnectionWhereArg, Context } from "../../../types";
import * as CypherBuilder from "../../cypher-builder/CypherBuilder";
import type { Node, Relationship } from "../../../classes";
import createConnectionWhereAndParams from "../create-connection-where-and-params";
import { getListPredicate } from "../utils";
import { listPredicateToSizeFunction } from "../list-predicate-to-size-function";
import type { WhereOperator } from "../types";
import { createComparisonOperation } from "./create-comparison-operation";
import { createCypherWhereParams } from "../create-cypher-where-params";
import { filterTruthy } from "../../../utils/utils";
import { compileCypherIfExists } from "../../cypher-builder/utils";

export function createConnectionOperation({
    connectionField,
    value,
    context,
    parentNode,
    operator,
}: {
    connectionField: ConnectionField;
    value: any;
    context: Context;
    parentNode: CypherBuilder.Node;
    operator: string | undefined;
}): CypherBuilder.BooleanOp | CypherBuilder.RawCypher | undefined {
    let nodeEntries: Record<string, any>;

    if (!connectionField?.relationship.union) {
        nodeEntries = { [connectionField.relationship.typeMeta.name]: value };
    } else {
        nodeEntries = value;
    }

    const operations = Object.entries(nodeEntries).map((entry) => {
        const refNode = context.nodes.find(
            (x) => x.name === entry[0] || x.interfaces.some((i) => i.name.value === entry[0])
        ) as Node;

        const relationField = connectionField.relationship;

        const childNode = new CypherBuilder.Node({ labels: refNode.getLabels(context) });
        const relationship = new CypherBuilder.Relationship({
            source: relationField.direction === "IN" ? childNode : parentNode,
            target: relationField.direction === "IN" ? parentNode : childNode,
            type: relationField.type,
        });

        const matchPattern = new CypherBuilder.Pattern(relationship, {
            source: relationField.direction === "IN" ? { variable: true } : { labels: false },
            target: relationField.direction === "IN" ? { labels: false } : { variable: true },
            relationship: { variable: true },
        });

        let listPredicateStr = getListPredicate(operator as WhereOperator);

        // const rawWhereQuery = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
        //     const contextRelationship = context.relationships.find(
        //         (x) => x.name === connectionField.relationshipTypeName
        //     ) as Relationship;

        //     const prefix = `nestedParam${env.getParamsSize()}`; // Generates unique name for nested reference
        //     // const result = createConnectionWhereAndParams({
        //     //     whereInput: entry[1] as any,
        //     //     context,
        //     //     node: refNode,
        //     //     nodeVariable: env.getVariableId(childNode),
        //     //     relationship: contextRelationship,
        //     //     relationshipVariable: env.getVariableId(relationship),
        //     //     parameterPrefix: prefix,
        //     //     listPredicates: [listPredicateStr],
        //     // });
        //     createWherePropertyOperation({
        //         context,
        //         whereInput: entry[1] as any,
        //         relationshipRef: relationship,
        //         targetNode: childNode,
        //         node: refNode,
        //     });
        //     return ["", {}];
        //     // return [result[0], { [prefix]: result[1] }];
        // });

        const contextRelationship = context.relationships.find(
            (x) => x.name === connectionField.relationshipTypeName
        ) as Relationship;
        const whereOperator = createWherePropertyOperation({
            context,
            whereInput: entry[1] as any,
            relationshipRef: relationship,
            targetNode: childNode,
            edge: contextRelationship,
            node: refNode,
        });

        if (listPredicateStr === "any" && !connectionField.relationship.typeMeta.array) {
            listPredicateStr = "single";
        }
        const subquery = new CypherBuilder.RawCypher((env: CypherBuilder.Environment) => {
            const patternStr = matchPattern.getCypher(env);
            const whereStr = compileCypherIfExists(whereOperator, env, {});
            // HERE
            const clause = listPredicateToSizeFunction(listPredicateStr, patternStr, whereStr);
            return [clause, {}];
        });

        return subquery;
    });

    return CypherBuilder.and(...operations) as CypherBuilder.BooleanOp | undefined;
}

function createWherePropertyOperation({
    context,
    whereInput,
    relationshipRef,
    targetNode,
    node,
    edge,
}: {
    whereInput: ConnectionWhereArg;
    context: Context;
    node: Node;
    edge: Relationship;
    relationshipRef: CypherBuilder.Relationship;
    targetNode: CypherBuilder.Node;
}): CypherBuilder.ComparisonOp | CypherBuilder.BooleanOp | CypherBuilder.RawCypher | CypherBuilder.Exists | undefined {
    const params = Object.entries(whereInput).map(([key, value]) => {
        // TODO: and/or

        if (key.startsWith("edge")) {
            const nestedProperties: Record<string, any> = value;
            const result = createCypherWhereParams({
                targetElement: relationshipRef,
                whereInput: nestedProperties,
                context,
                element: edge,
            });

            return result;
            // const relationshipWhere = createElementWhereAndParams({
            //     whereInput: v,
            //     element: relationship,
            //     varName: relationshipVariable,
            //     context,
            //     parameterPrefix: `${parameterPrefix}.${k}`,
            //     listPredicates,
            // });
            // const whereStrs = [
            //     ...res.whereStrs,
            //     k === "edge_NOT" ? `(NOT ${relationshipWhere[0]})` : relationshipWhere[0],
            // ];
            // const params = { ...res.params, [k]: relationshipWhere[1] };
            // return { whereStrs, params };
        }

        if (key.startsWith("node") || key.startsWith(node.name)) {
            // if (key === "node") {
            // const nestedProperties: Record<string, any> = value;
            const nestedProperties: Record<string, any> = Object.entries(value as Record<string, any>).reduce(
                (args, [k, v]) => {
                    if (k === "_on") return { ...v[node.name], ...args };
                    return { ...args, [k]: v };
                    // if (k !== "_on") {
                    //     if (value?._on?.[node.name]?.[k]) {
                    //         return args;
                    //     }
                    //     return { ...args, [k]: v };
                    // }
                },
                {} as Record<string, any>
            );

            // const nestedProperties: Record<string, any> = Object.entries(value).reduce((args, [k, v]) => {
            //     if (k !== "_on") {
            //         if (value?._on?.[node.name]?.[k]) {
            //             return args;
            //         }
            //         return { ...args, [k]: v };
            //     }

            //     return args;
            // }, {});

            if (
                Object.keys(value).length === 1 &&
                value._on &&
                !Object.prototype.hasOwnProperty.call(value._on, node.name)
            ) {
                throw new Error("_on is used as the only argument and node is not present within");
            }

            const result = createCypherWhereParams({
                targetElement: targetNode,
                whereInput: nestedProperties,
                context,
                element: node,
            });

            // NOTE: _NOT is handled by the size()=0
            return result;
            // const rootNodeWhere = createElementWhereAndParams({
            //     whereInput: {
            //         ...Object.entries(v).reduce((args, [key, value]) => {
            //             if (key !== "_on") {
            //                 if (v?._on?.[node.name]?.[key]) {
            //                     return args;
            //                 }
            //                 return { ...args, [key]: value };
            //             }

            //             return args;
            //         }, {}),
            //     },
            //     element: node,
            //     varName: nodeVariable,
            //     context,
            //     parameterPrefix: `${parameterPrefix}.${k}`,
            //     listPredicates,
            // });

            // if (rootNodeWhere[0]) {
            //     whereStrs = [...whereStrs, k.endsWith("_NOT") ? `(NOT ${rootNodeWhere[0]})` : rootNodeWhere[0]];
            //     params = { ...params, [k]: rootNodeWhere[1] };
            //     res = { whereStrs, params };
            // }

            // if (v?._on?.[node.name]) {
            //     const onTypeNodeWhere = createElementWhereAndParams({
            //         whereInput: v._on[node.name],
            //         element: node,
            //         varName: nodeVariable,
            //         context,
            //         parameterPrefix: `${parameterPrefix}.${k}._on.${node.name}`,
            //         listPredicates,
            //     });

            //     whereStrs = [...whereStrs, k.endsWith("_NOT") ? `(NOT ${onTypeNodeWhere[0]})` : onTypeNodeWhere[0]];
            //     params = { ...params, [k]: { _on: { [node.name]: onTypeNodeWhere[1] } } };
            //     res = { whereStrs, params };
            // }
        }
        return undefined;
    });
    return CypherBuilder.and(...filterTruthy(params));
}
