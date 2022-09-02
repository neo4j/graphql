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

import type { ResolveTree } from "graphql-parse-resolve-info";
import { asArray, removeDuplicates } from "../utils/utils";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import type { ConnectionField, Context, GraphQLOptionsArg, InterfaceWhereArg, RelationField } from "../types";
import filterInterfaceNodes from "../utils/filter-interface-nodes";
// eslint-disable-next-line import/no-cycle
import createConnectionAndParams from "./connection/create-connection-and-params";
import { createAuthAndParams, createAuthPredicates } from "./create-auth-and-params";
// eslint-disable-next-line import/no-cycle
import createProjectionAndParams from "./create-projection-and-params";
import { getRelationshipDirection, getRelationshipDirectionStr } from "../utils/get-relationship-direction";
import * as CypherBuilder from "./cypher-builder/CypherBuilder";
import { addSortAndLimitOptionsToClause } from "./projection/subquery/add-sort-and-limit-to-clause";
import { compileCypherIfExists } from "./cypher-builder/utils/utils";
import type { Node } from "../classes";
import { createWherePredicate } from "./where/create-where-predicate";

export default function createInterfaceProjectionAndParams({
    resolveTree,
    field,
    context,
    nodeVariable,
    parameterPrefix,
    withVars,
}: {
    resolveTree: ResolveTree;
    field: RelationField;
    context: Context;
    nodeVariable: string;
    parameterPrefix?: string;
    withVars?: string[];
}): CypherBuilder.Clause {
    let globalParams = {};
    let params: { args?: any } = {};
    const fullWithVars = removeDuplicates([...asArray(withVars), nodeVariable]);
    const parentNode = new CypherBuilder.NamedNode(nodeVariable);
    const whereInput = resolveTree.args.where as InterfaceWhereArg;

    const referenceNodes = context.nodes.filter(
        (node) => field.interface?.implementations?.includes(node.name) && filterInterfaceNodes({ node, whereInput })
    );

    let whereArgs: { _on?: any; [str: string]: any } = {};

    const subqueries = referenceNodes.map((refNode) => {
        return createInterfaceSubquery({
            refNode,
            nodeVariable,
            field,
            resolveTree,
            context,
            parentNode,
            fullWithVars,
        });
    });
    // const subqueries = referenceNodes.map((refNode) => {
    //     const param = `${nodeVariable}_${refNode.name}`;
    //     const subquery = [
    //         `WITH ${fullWithVars.join(", ")}`,
    //         `MATCH (${nodeVariable})${inStr}${relTypeStr}${outStr}(${param}:${refNode.name})`,
    //     ];

    //     const allowAndParams = createAuthAndParams({
    //         operations: "READ",
    //         entity: refNode,
    //         context,
    //         allow: {
    //             parentNode: refNode,
    //             varName: param,
    //         },
    //     });
    //     if (allowAndParams[0]) {
    //         globalParams = { ...globalParams, ...allowAndParams[1] };
    //         subquery.push(`CALL apoc.util.validate(NOT (${allowAndParams[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
    //     }

    //     const whereStrs: string[] = [];

    //     if (resolveTree.args.where) {
    //         // For root filters
    //         const rootNodeWhereAndParams = createElementWhereAndParams({
    //             // TODO: move to createWherePredicate
    //             whereInput: {
    //                 ...Object.entries(whereInput).reduce((args, [k, v]) => {
    //                     if (k !== "_on") {
    //                         // If this where key is also inside _on for this implementation, use the one in _on instead
    //                         if (whereInput?._on?.[refNode.name]?.[k]) {
    //                             return args;
    //                         }
    //                         return { ...args, [k]: v };
    //                     }

    //                     return args;
    //                 }, {}),
    //             },
    //             context,
    //             element: refNode,
    //             varName: param,
    //             parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
    //                 resolveTree.alias
    //             }.args.where`,
    //         });
    //         if (rootNodeWhereAndParams[0]) {
    //             whereStrs.push(rootNodeWhereAndParams[0]);
    //             whereArgs = { ...whereArgs, ...rootNodeWhereAndParams[1] };
    //         }

    //         // For _on filters
    //         if (whereInput?._on?.[refNode.name]) {
    //             // TODO: move to createWherePredicate
    //             const onTypeNodeWhereAndParams = createElementWhereAndParams({
    //                 whereInput: {
    //                     ...Object.entries(whereInput).reduce((args, [k, v]) => {
    //                         if (k !== "_on") {
    //                             return { ...args, [k]: v };
    //                         }

    //                         if (Object.prototype.hasOwnProperty.call(v, refNode.name)) {
    //                             return { ...args, ...v[refNode.name] };
    //                         }

    //                         return args;
    //                     }, {}),
    //                 },
    //                 context,
    //                 element: refNode,
    //                 varName: param,
    //                 parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
    //                     resolveTree.alias
    //                 }.args.where._on.${refNode.name}`,
    //             });
    //             if (onTypeNodeWhereAndParams[0]) {
    //                 whereStrs.push(onTypeNodeWhereAndParams[0]);
    //                 if (whereArgs._on) {
    //                     whereArgs._on[refNode.name] = onTypeNodeWhereAndParams[1];
    //                 } else {
    //                     whereArgs._on = { [refNode.name]: onTypeNodeWhereAndParams[1] };
    //                 }
    //             }
    //         }
    //     }

    //     const whereAuth = createAuthAndParams({
    //         operations: "READ",
    //         entity: refNode,
    //         context,
    //         where: { varName: param, node: refNode },
    //     });
    //     if (whereAuth[0]) {
    //         whereStrs.push(whereAuth[0]);
    //         globalParams = { ...globalParams, ...whereAuth[1] };
    //     }

    //     if (whereStrs.length) {
    //         subquery.push(`WHERE ${whereStrs.join(" AND ")}`);
    //     }

    //     const {
    //         projection: projectionStr,
    //         params: projectionParams,
    //         meta,
    //         subqueries: projectionSubQueries,
    //     } = createProjectionAndParams({
    //         resolveTree,
    //         node: refNode,
    //         context,
    //         varName: param,
    //         literalElements: true,
    //         resolveType: true,
    //     });
    //     if (meta?.connectionFields?.length) {
    //         meta.connectionFields.forEach((connectionResolveTree) => {
    //             const connectionField = refNode.connectionFields.find(
    //                 (x) => x.fieldName === connectionResolveTree.name
    //             ) as ConnectionField;
    //             const connection = createConnectionAndParams({
    //                 resolveTree: connectionResolveTree,
    //                 field: connectionField,
    //                 context,
    //                 nodeVariable: param,
    //             });
    //             subquery.push(connection[0]);
    //             params = { ...params, ...projectionParams };
    //         });
    //     }

    //     const projectionSubqueryClause = CypherBuilder.concat(...projectionSubQueries);
    //     return new CypherBuilder.RawCypher((env) => {
    //         const subqueryStr = compileCypherIfExists(projectionSubqueryClause, env);
    //         const returnStatement = `RETURN ${projectionStr} AS ${field.fieldName}`;

    //         return [[...subquery, subqueryStr, returnStatement].join("\n"), {}]; // TODO: pass params here instead of globalParams
    //     });
    // });

    const optionsInput = resolveTree.args.options as GraphQLOptionsArg | undefined;
    let withClause: CypherBuilder.With | undefined;
    if (optionsInput) {
        withClause = new CypherBuilder.With("*");
        addSortAndLimitOptionsToClause({
            optionsInput,
            projectionClause: withClause,
            target: new CypherBuilder.NamedNode(field.fieldName),
        });
    }

    const unionClause = new CypherBuilder.Union(...subqueries);
    const call = new CypherBuilder.Call(unionClause);

    return new CypherBuilder.RawCypher((env) => {
        const subqueryStr = call.getCypher(env);
        const withStr = compileCypherIfExists(withClause, env, { suffix: "\n" });

        let interfaceProjection = [`WITH ${fullWithVars.join(", ")}`, subqueryStr];
        if (field.typeMeta.array) {
            interfaceProjection = [
                `WITH *`,
                "CALL {",
                ...interfaceProjection,
                `${withStr}RETURN collect(${field.fieldName}) AS ${field.fieldName}`,
                "}",
            ];
        }

        if (Object.keys(whereArgs).length) {
            params.args = { where: whereArgs };
        }

        return [
            interfaceProjection.join("\n"),
            {
                ...globalParams,
                ...(Object.keys(params).length ? { [`${nodeVariable}_${resolveTree.alias}`]: params } : {}),
            },
        ];
    });
}

function createInterfaceSubquery({
    refNode,
    nodeVariable,
    field,
    resolveTree,
    context,
    parentNode,
    fullWithVars,
}: {
    refNode: Node;
    nodeVariable: string;
    field: RelationField;
    resolveTree: ResolveTree;
    context: Context;
    parentNode: CypherBuilder.Node;
    fullWithVars: string[];
}): CypherBuilder.Clause {
    const whereInput = resolveTree.args.where as InterfaceWhereArg;

    const param = `${nodeVariable}_${refNode.name}`;
    const relatedNode = new CypherBuilder.NamedNode(param, {
        labels: [refNode.name], // NOTE: should this be labels?
    });

    const relationshipRef = new CypherBuilder.Relationship({
        source: parentNode,
        target: relatedNode,
        type: field.type,
    });

    const direction = getRelationshipDirection(field, resolveTree.args);
    const pattern = relationshipRef.pattern({
        source: {
            labels: false,
        },
        directed: direction !== "undirected",
    });

    if (direction === "IN") pattern.reverse();

    // const relTypeStr = `[:${field.type}]`;

    // const { inStr, outStr } = getRelationshipDirectionStr(field, resolveTree.args);
    const withClause = new CypherBuilder.With(...fullWithVars.map((f) => new CypherBuilder.NamedVariable(f)));
    const matchQuery = new CypherBuilder.Match(pattern);

    // const subquery = [
    //     // `WITH ${fullWithVars.join(", ")}`,
    //     `WITH *`,
    //     `MATCH (${nodeVariable})${inStr}${relTypeStr}${outStr}(${param}:${refNode.name})`,
    // ];

    const authAllowPredicate = createAuthPredicates({
        entity: refNode,
        operations: "READ",
        allow: {
            parentNode: refNode,
            varName: relatedNode,
        },
        context,
    });
    if (authAllowPredicate) {
        const apocValidateClause = new CypherBuilder.apoc.ValidatePredicate(CypherBuilder.not(authAllowPredicate));
        matchQuery.where(apocValidateClause);
    }

    // const allowAndParams = createAuthAndParams({
    //     operations: "READ",
    //     entity: refNode,
    //     context,
    //     allow: {
    //         parentNode: refNode,
    //         varName: param,
    //     },
    // });
    // if (allowAndParams[0]) {
    //     globalParams = { ...globalParams, ...allowAndParams[1] };
    //     subquery.push(`CALL apoc.util.validate(NOT (${allowAndParams[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
    // }

    if (resolveTree.args.where) {
        // if (whereInput?._on?.[refNode.name]) {
        //     // TODO: move to createWherePredicate
        //     const whereInputWithOn = {
        //         ...Object.entries(whereInput).reduce((args, [k, v]) => {
        //             if (k !== "_on") {
        //                 return { ...args, [k]: v };
        //             }

        //             if (Object.prototype.hasOwnProperty.call(v, refNode.name)) {
        //                 return { ...args, ...v[refNode.name] };
        //             }

        //             return args;
        //         }, {}),
        //     };
        // }

        const whereInput2 = {
            ...Object.entries(whereInput).reduce((args, [k, v]) => {
                // const interfaceOverrideValue = whereInput?._on?.[refNode.name]?.[k];
                // if (interfaceOverrideValue) {
                //     return { ...args, [k]: interfaceOverrideValue };
                // }

                if (k !== "_on") {
                    return { ...args, [k]: v };
                }

                // if (Object.prototype.hasOwnProperty.call(v, refNode.name)) {
                //     return { ...args, ...v[refNode.name] };
                // }

                // if (k === "_on") {
                //     if (Object.prototype.hasOwnProperty.call(v, refNode.name)) {
                //         return { ...args, ...v[refNode.name] };
                //     }
                //     return args;
                // }

                // if (k !== "_on") {
                //     // If this where key is also inside _on for this implementation, use the one in _on instead
                //     // if (whereInput?._on?.[refNode.name]?.[k]) {
                //     //     return args;
                //     // }
                //     // FROM the _on thingy
                //     if (Object.prototype.hasOwnProperty.call(v, refNode.name)) {
                //         return { ...args, ...v[refNode.name] };
                //     }
                //     return { ...args, [k]: v };
                // }

                return args;
            }, {}),
            ...(whereInput?._on?.[refNode.name] || {}),
        };

        const wherePredicate = createWherePredicate({
            whereInput: whereInput2,
            context,
            targetElement: relatedNode,
            element: refNode,
        });

        if (wherePredicate) {
            matchQuery.where(wherePredicate);
        }

        // For root filters
        // const rootNodeWhereAndParams = createElementWhereAndParams({
        //     // TODO: move to createWherePredicate
        //     whereInput: {
        //         ...Object.entries(whereInput).reduce((args, [k, v]) => {
        //             if (k !== "_on") {
        //                 // If this where key is also inside _on for this implementation, use the one in _on instead
        //                 if (whereInput?._on?.[refNode.name]?.[k]) {
        //                     return args;
        //                 }
        //                 return { ...args, [k]: v };
        //             }

        //             return args;
        //         }, {}),
        //     },
        //     context,
        //     element: refNode,
        //     varName: param,
        //     parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
        //         resolveTree.alias
        //     }.args.where`,
        // });
        // if (rootNodeWhereAndParams[0]) {
        //     whereStrs.push(rootNodeWhereAndParams[0]);
        //     whereArgs = { ...whereArgs, ...rootNodeWhereAndParams[1] };
        // }

        // For _on filters
        // if (whereInput?._on?.[refNode.name]) {
        //     // TODO: move to createWherePredicate
        //     const onTypeNodeWhereAndParams = createElementWhereAndParams({
        //         whereInput: {
        //             ...Object.entries(whereInput).reduce((args, [k, v]) => {
        //                 if (k !== "_on") {
        //                     return { ...args, [k]: v };
        //                 }

        //                 if (Object.prototype.hasOwnProperty.call(v, refNode.name)) {
        //                     return { ...args, ...v[refNode.name] };
        //                 }

        //                 return args;
        //             }, {}),
        //         },
        //         context,
        //         element: refNode,
        //         varName: param,
        //         parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
        //             resolveTree.alias
        //         }.args.where._on.${refNode.name}`,
        //     });
        //     if (onTypeNodeWhereAndParams[0]) {
        //         whereStrs.push(onTypeNodeWhereAndParams[0]);
        //         if (whereArgs._on) {
        //             whereArgs._on[refNode.name] = onTypeNodeWhereAndParams[1];
        //         } else {
        //             whereArgs._on = { [refNode.name]: onTypeNodeWhereAndParams[1] };
        //         }
        //     }
        // }
    }

    const whereAuthPredicate = createAuthPredicates({
        entity: refNode,
        operations: "READ",
        where: {
            node: refNode,
            varName: relatedNode,
        },
        context,
    });
    if (whereAuthPredicate) {
        matchQuery.where(whereAuthPredicate);
    }

    // const whereAuth = createAuthAndParams({
    //     operations: "READ",
    //     entity: refNode,
    //     context,
    //     where: { varName: param, node: refNode },
    // });
    // if (whereAuth[0]) {
    //     whereStrs.push(whereAuth[0]);
    //     globalParams = { ...globalParams, ...whereAuth[1] };
    // }

    // if (whereStrs.length) {
    //     subquery.push(`WHERE ${whereStrs.join(" AND ")}`);
    // }

    const {
        projection: projectionStr,
        params: projectionParams,
        meta,
        subqueries: projectionSubQueries,
    } = createProjectionAndParams({
        resolveTree,
        node: refNode,
        context,
        varName: param,
        literalElements: true,
        resolveType: true,
    });
    // TODO
    let connectionClauses: CypherBuilder.Clause[] = [];
    if (meta?.connectionFields?.length) {
        connectionClauses = meta.connectionFields.map((connectionResolveTree) => {
            return new CypherBuilder.RawCypher(() => {
                const connectionField = refNode.connectionFields.find(
                    (x) => x.fieldName === connectionResolveTree.name
                ) as ConnectionField;
                const connection = createConnectionAndParams({
                    resolveTree: connectionResolveTree,
                    field: connectionField,
                    context,
                    nodeVariable: param,
                });
                // subquery.push(connection[0]);
                // params = { ...params, ...projectionParams };
                return [connection[0], projectionParams];
            });
        });
    }

    const projectionSubqueryClause = CypherBuilder.concat(...projectionSubQueries);

    const returnClause = new CypherBuilder.Return([new CypherBuilder.RawCypher(projectionStr), field.fieldName]);

    return CypherBuilder.concat(withClause, matchQuery, ...connectionClauses, projectionSubqueryClause, returnClause);
    // return new CypherBuilder.RawCypher((env) => {
    //     const subqueryStr = compileCypherIfExists(projectionSubqueryClause, env);
    //     const returnStatement = `RETURN ${projectionStr} AS ${field.fieldName}`;

    //     return [[...subquery, subqueryStr, returnStatement].join("\n"), {}]; // TODO: pass params here instead of globalParams
    // });
}
