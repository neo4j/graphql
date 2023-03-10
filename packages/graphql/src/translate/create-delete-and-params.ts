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

import type { Node, Relationship } from "../classes";
import type { Context } from "../types";
import { createAuthAndParams, createAuthPredicates } from "./create-auth-and-params";
import createConnectionWhereAndParams from "./where/create-connection-where-and-params";
import { AUTH_FORBIDDEN_ERROR, META_CYPHER_VARIABLE } from "../constants";
import { createEventMetaObject } from "./subscriptions/create-event-meta";
import { createConnectionEventMetaObject } from "./subscriptions/create-connection-event-meta";
import { filterMetaVariable } from "./subscriptions/filter-meta-variable";
import Cypher from "@neo4j/cypher-builder";
import { caseWhere } from "../utils/case-where";

interface Res {
    strs: string[];
    params: any;
}

interface ResClauses {
    strsCypher: Cypher.CompositeClause;
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
        const relationField = node.relationFields.find((x) => key === x.fieldName);

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
                relationField.interface.implementations?.forEach((implementationName) => {
                    refNodes.push(context.nodes.find((x) => x.name === implementationName) as Node);
                });
            } else {
                refNodes.push(context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            const inStr = relationField.direction === "IN" ? "<-" : "-";
            const outStr = relationField.direction === "OUT" ? "->" : "-";

            refNodes.forEach((refNode) => {
                const v = relationField.union ? value[refNode.name] : value;
                const deletes = relationField.typeMeta.array ? v : [v];

                deletes.forEach((d, index) => {
                    const innerStrs: string[] = [];

                    const variableName = chainStr
                        ? `${varName}${index}`
                        : `${varName}_${key}${
                              relationField.union || relationField.interface ? `_${refNode.name}` : ""
                          }${index}`;
                    const relationshipVariable = `${variableName}_relationship`;
                    const relTypeStr = `[${relationshipVariable}:${relationField.type}]`;
                    const nodeToDelete = `${variableName}_to_delete`;
                    const labels = refNode.getLabelString(context);

                    const varsWithoutMeta = filterMetaVariable(withVars).join(", ");
                    innerStrs.push("WITH *");
                    innerStrs.push("CALL {");
                    if (withVars) {
                        if (context.subscriptionsEnabled) {
                            innerStrs.push(`WITH ${varsWithoutMeta}`);
                            innerStrs.push(`WITH ${varsWithoutMeta}, []  AS ${META_CYPHER_VARIABLE}`);
                        } else {
                            innerStrs.push(`WITH ${withVars.join(", ")}`);
                        }
                    }
                    innerStrs.push(
                        `OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${variableName}${labels})`
                    );

                    const whereStrs: string[] = [];
                    let aggregationWhere = false;
                    if (d.where) {
                        try {
                            const {
                                cypher: whereCypher,
                                subquery: preComputedSubqueries,
                                params: whereParams,
                            } = createConnectionWhereAndParams({
                                nodeVariable: variableName,
                                whereInput: d.where,
                                node: refNode,
                                context,
                                relationshipVariable,
                                relationship,
                                parameterPrefix: `${parameterPrefix}${!recursing ? `.${key}` : ""}${
                                    relationField.union ? `.${refNode.name}` : ""
                                }${relationField.typeMeta.array ? `[${index}]` : ""}.where`,
                            });
                            if (whereCypher) {
                                whereStrs.push(whereCypher);
                                res.params = { ...res.params, ...whereParams };
                                if (preComputedSubqueries) {
                                    innerStrs.push(preComputedSubqueries);
                                    aggregationWhere = true;
                                }
                            }
                        } catch (err) {
                            innerStrs.push(" \n}");
                            return;
                        }
                    }

                    const whereAuth = createAuthAndParams({
                        operations: "DELETE",
                        entity: refNode,
                        context,
                        where: { varName: variableName, node: refNode },
                    });
                    if (whereAuth[0]) {
                        whereStrs.push(whereAuth[0]);
                        res.params = { ...res.params, ...whereAuth[1] };
                    }
                    if (whereStrs.length) {
                        const predicate = `${whereStrs.join(" AND ")}`;
                        if (aggregationWhere) {
                            const columns = [
                                new Cypher.NamedVariable(relationshipVariable),
                                new Cypher.NamedVariable(variableName),
                            ];
                            const caseWhereClause = caseWhere(new Cypher.RawCypher(predicate), columns);
                            const { cypher } = caseWhereClause.build("aggregateWhereFilter");
                            innerStrs.push(cypher);
                        } else {
                            innerStrs.push(`WHERE ${predicate}`);
                        }
                    }

                    const allowAuth = createAuthAndParams({
                        entity: refNode,
                        operations: "DELETE",
                        context,
                        escapeQuotes: Boolean(insideDoWhen),
                        allow: { parentNode: refNode, varName: variableName },
                    });
                    if (allowAuth[0]) {
                        const quote = insideDoWhen ? `\\"` : `"`;
                        innerStrs.push(
                            `WITH ${varsWithoutMeta}${
                                context.subscriptionsEnabled ? `, ${META_CYPHER_VARIABLE}` : ""
                            }, ${variableName}, ${relationshipVariable}`
                        );
                        innerStrs.push(
                            `CALL apoc.util.validate(NOT (${allowAuth[0]}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
                        );

                        res.params = { ...res.params, ...allowAuth[1] };
                    }

                    if (d.delete) {
                        const nestedDeleteInput = Object.entries(d.delete)
                            .filter(([k]) => {
                                if (k === "_on") {
                                    return false;
                                }

                                if (relationField.interface && d.delete?._on?.[refNode.name]) {
                                    const onArray = Array.isArray(d.delete._on[refNode.name])
                                        ? d.delete._on[refNode.name]
                                        : [d.delete._on[refNode.name]];
                                    if (onArray.some((onKey) => Object.prototype.hasOwnProperty.call(onKey, k))) {
                                        return false;
                                    }
                                }

                                return true;
                            })
                            .reduce((d1, [k1, v1]) => ({ ...d1, [k1]: v1 }), {});
                        const innerWithVars = context.subscriptionsEnabled
                            ? [...withVars, variableName, relationshipVariable]
                            : [...withVars, variableName];

                        const deleteAndParams = createDeleteAndParams({
                            context,
                            node: refNode,
                            deleteInput: nestedDeleteInput,
                            varName: variableName,
                            withVars: innerWithVars,
                            parentVar: variableName,
                            parameterPrefix: `${parameterPrefix}${!recursing ? `.${key}` : ""}${
                                relationField.union ? `.${refNode.name}` : ""
                            }${relationField.typeMeta.array ? `[${index}]` : ""}.delete`,
                            recursing: false,
                        });
                        innerStrs.push(deleteAndParams[0]);
                        res.params = { ...res.params, ...deleteAndParams[1] };

                        if (relationField.interface && d.delete?._on?.[refNode.name]) {
                            const onDeletes = Array.isArray(d.delete._on[refNode.name])
                                ? d.delete._on[refNode.name]
                                : [d.delete._on[refNode.name]];

                            onDeletes.forEach((onDelete, onDeleteIndex) => {
                                const onDeleteAndParams = createDeleteAndParams({
                                    context,
                                    node: refNode,
                                    deleteInput: onDelete,
                                    varName: variableName,
                                    withVars: innerWithVars,
                                    parentVar: variableName,
                                    parameterPrefix: `${parameterPrefix}${!recursing ? `.${key}` : ""}${
                                        relationField.union ? `.${refNode.name}` : ""
                                    }${relationField.typeMeta.array ? `[${index}]` : ""}.delete._on.${
                                        refNode.name
                                    }[${onDeleteIndex}]`,
                                    recursing: false,
                                });
                                innerStrs.push(onDeleteAndParams[0]);
                                res.params = { ...res.params, ...onDeleteAndParams[1] };
                            });
                        }
                    }

                    if (context.subscriptionsEnabled) {
                        const metaObjectStr = createEventMetaObject({
                            event: "delete",
                            nodeVariable: "x",
                            typename: refNode.name,
                        });
                        const [fromVariable, toVariable] =
                            relationField.direction === "IN" ? ["x", parentVar] : [parentVar, "x"];
                        const [fromTypename, toTypename] =
                            relationField.direction === "IN" ? [refNode.name, node.name] : [node.name, refNode.name];
                        const eventWithMetaStr = createConnectionEventMetaObject({
                            event: "delete_relationship",
                            relVariable: relationshipVariable,
                            fromVariable,
                            toVariable,
                            typename: relationField.typeUnescaped,
                            fromTypename,
                            toTypename,
                        });

                        const statements = [
                            `WITH ${varsWithoutMeta}, ${META_CYPHER_VARIABLE}, ${relationshipVariable}, collect(DISTINCT ${variableName}) AS ${nodeToDelete}`,
                            "CALL {",
                            `\tWITH ${relationshipVariable}, ${nodeToDelete}, ${varsWithoutMeta}`,
                            `\tUNWIND ${nodeToDelete} AS x`,
                            `\tWITH [] + ${metaObjectStr} + ${eventWithMetaStr} AS ${META_CYPHER_VARIABLE}, x, ${relationshipVariable}, ${varsWithoutMeta}`,
                            `\tDETACH DELETE x`,
                            `\tRETURN collect(${META_CYPHER_VARIABLE}) AS delete_meta`,
                            `}`,
                            `WITH delete_meta, ${META_CYPHER_VARIABLE}`,
                            `RETURN reduce(m=${META_CYPHER_VARIABLE}, n IN delete_meta | m + n) AS delete_meta`,
                            `}`,
                            `WITH ${varsWithoutMeta}, ${META_CYPHER_VARIABLE}, collect(delete_meta) as delete_meta`,
                            `WITH ${varsWithoutMeta}, reduce(m=${META_CYPHER_VARIABLE}, n IN delete_meta | m + n) AS ${META_CYPHER_VARIABLE}`,
                        ];

                        innerStrs.push(...statements);
                    } else {
                        const statements = [
                            `WITH ${relationshipVariable}, collect(DISTINCT ${variableName}) AS ${nodeToDelete}`,
                            "CALL {",
                            `\tWITH ${nodeToDelete}`,
                            `\tUNWIND ${nodeToDelete} AS x`,
                            `\tDETACH DELETE x`,
                            `}`,
                            `}`,
                        ];
                        innerStrs.push(...statements);
                    }

                    res.strs.push(...innerStrs);
                });
            });

            return res;
        }

        return res;
    }

    const { strs, params } = Object.entries(deleteInput).reduce(reducer, {
        strs: [],
        params: {},
    });

    return [strs.join("\n"), params];
}

// use me when migrating strs to Cypher.Clause
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function createDeleteAndParamsClauses({
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
}): [Cypher.Clause, any] {
    function reducer(res: ResClauses, [key, value]: [string, any]) {
        const relationField = node.relationFields.find((x) => key === x.fieldName);

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
                relationField.interface.implementations?.forEach((implementationName) => {
                    refNodes.push(context.nodes.find((x) => x.name === implementationName) as Node);
                });
            } else {
                refNodes.push(context.nodes.find((x) => x.name === relationField.typeMeta.name) as Node);
            }

            refNodes.forEach((refNode) => {
                const v = relationField.union ? value[refNode.name] : value;
                const deletes = relationField.typeMeta.array ? v : [v];

                deletes.forEach((d, index) => {
                    let clause;

                    const variableName = chainStr
                        ? `${varName}${index}`
                        : `${varName}_${key}${
                              relationField.union || relationField.interface ? `_${refNode.name}` : ""
                          }${index}`;
                    const relationshipVariable = `${variableName}_relationship`;
                    const nodeToDeleteName = `${variableName}_to_delete`;

                    const nodeToDeleteVar = new Cypher.NamedVariable(nodeToDeleteName);
                    const metaVar = new Cypher.NamedVariable(META_CYPHER_VARIABLE);
                    const withVarsVariables = filterMetaVariable(withVars).map((v) => new Cypher.NamedVariable(v));
                    const nodeToDelete = new Cypher.NamedNode(variableName, {
                        labels: refNode.getLabels(context),
                    });
                    const parentNodeToDelete = new Cypher.NamedNode(parentVar);
                    const relationshipToDelete = new Cypher.NamedRelationship(relationshipVariable, {
                        type: relationField.type,
                    });
                    const relationshipPattern =
                        relationField.direction === "IN"
                            ? new Cypher.Pattern(nodeToDelete).related(relationshipToDelete).to(parentNodeToDelete)
                            : new Cypher.Pattern(parentNodeToDelete).related(relationshipToDelete).to(nodeToDelete);
                    const subqueryClause = context.subscriptionsEnabled
                        ? Cypher.concat(
                              new Cypher.With(...withVarsVariables, [new Cypher.Literal([]), metaVar]),
                              new Cypher.OptionalMatch(relationshipPattern)
                          )
                        : Cypher.concat(new Cypher.OptionalMatch(relationshipPattern));

                    const whereStrs: string[] = [];
                    let aggregationWhere = false;
                    if (d.where) {
                        try {
                            const {
                                cypher: whereCypher,
                                subquery: preComputedSubqueries,
                                params: whereParams,
                            } = createConnectionWhereAndParams({
                                nodeVariable: variableName,
                                whereInput: d.where,
                                node: refNode,
                                context,
                                relationshipVariable,
                                relationship,
                                parameterPrefix: `${parameterPrefix}${!recursing ? `.${key}` : ""}${
                                    relationField.union ? `.${refNode.name}` : ""
                                }${relationField.typeMeta.array ? `[${index}]` : ""}.where`,
                            });
                            if (whereCypher) {
                                whereStrs.push(whereCypher);
                                res.params = { ...res.params, ...whereParams };
                                if (preComputedSubqueries) {
                                    subqueryClause.concat(new Cypher.RawCypher(preComputedSubqueries));
                                    aggregationWhere = true;
                                }
                            }
                        } catch (err) {
                            return;
                        }
                    }

                    const whereAuth = createAuthAndParams({
                        operations: "DELETE",
                        entity: refNode,
                        context,
                        where: { varName: variableName, node: refNode },
                    });
                    if (whereAuth[0]) {
                        whereStrs.push(whereAuth[0]);
                        res.params = { ...res.params, ...whereAuth[1] };
                    }
                    if (whereStrs.length) {
                        const predicate = `${whereStrs.join(" AND ")}`;
                        if (aggregationWhere) {
                            const columns = [
                                new Cypher.NamedVariable(relationshipVariable),
                                new Cypher.NamedVariable(variableName),
                            ];
                            const caseWhereClause = caseWhere(new Cypher.RawCypher(predicate), columns);
                            const { cypher } = caseWhereClause.build("aggregateWhereFilter");
                            subqueryClause.concat(new Cypher.RawCypher(cypher));
                        } else {
                            subqueryClause.concat(new Cypher.RawCypher(`WHERE ${predicate}`));
                        }
                    }

                    const allowAuth = createAuthPredicates({
                        entity: refNode,
                        operations: "DELETE",
                        context,
                        escapeQuotes: Boolean(insideDoWhen),
                        allow: { parentNode: refNode, varName: variableName },
                    });
                    if (allowAuth) {
                        const quote = insideDoWhen ? `\\"` : `"`;

                        if (context.subscriptionsEnabled) {
                            subqueryClause.concat(
                                new Cypher.With(...withVarsVariables, nodeToDelete, relationshipToDelete, metaVar)
                            );
                        } else {
                            subqueryClause.concat(
                                new Cypher.With(...withVarsVariables, nodeToDelete, relationshipToDelete)
                            );
                        }
                        subqueryClause.concat(
                            new Cypher.CallProcedure(
                                new Cypher.apoc.Validate(
                                    Cypher.not(Cypher.and(allowAuth)),
                                    `${quote}${AUTH_FORBIDDEN_ERROR}${quote}`,
                                    new Cypher.Literal([0])
                                )
                            )
                        );
                    }

                    if (d.delete) {
                        const nestedDeleteInput = Object.entries(d.delete)
                            .filter(([k]) => {
                                if (k === "_on") {
                                    return false;
                                }

                                if (relationField.interface && d.delete?._on?.[refNode.name]) {
                                    const onArray = Array.isArray(d.delete._on[refNode.name])
                                        ? d.delete._on[refNode.name]
                                        : [d.delete._on[refNode.name]];
                                    if (onArray.some((onKey) => Object.prototype.hasOwnProperty.call(onKey, k))) {
                                        return false;
                                    }
                                }

                                return true;
                            })
                            .reduce((d1, [k1, v1]) => ({ ...d1, [k1]: v1 }), {});
                        const innerWithVars = context.subscriptionsEnabled
                            ? [...withVars, variableName, relationshipVariable]
                            : [...withVars, variableName];

                        const deleteAndParams = createDeleteAndParamsClauses({
                            context,
                            node: refNode,
                            deleteInput: nestedDeleteInput,
                            varName: variableName,
                            withVars: innerWithVars,
                            parentVar: variableName,
                            parameterPrefix: `${parameterPrefix}${!recursing ? `.${key}` : ""}${
                                relationField.union ? `.${refNode.name}` : ""
                            }${relationField.typeMeta.array ? `[${index}]` : ""}.delete`,
                            recursing: false,
                        });
                        subqueryClause.concat(deleteAndParams[0]);
                        res.params = { ...res.params, ...deleteAndParams[1] };

                        if (relationField.interface && d.delete?._on?.[refNode.name]) {
                            const onDeletes = Array.isArray(d.delete._on[refNode.name])
                                ? d.delete._on[refNode.name]
                                : [d.delete._on[refNode.name]];

                            onDeletes.forEach((onDelete, onDeleteIndex) => {
                                const onDeleteAndParams = createDeleteAndParamsClauses({
                                    context,
                                    node: refNode,
                                    deleteInput: onDelete,
                                    varName: variableName,
                                    withVars: innerWithVars,
                                    parentVar: variableName,
                                    parameterPrefix: `${parameterPrefix}${!recursing ? `.${key}` : ""}${
                                        relationField.union ? `.${refNode.name}` : ""
                                    }${relationField.typeMeta.array ? `[${index}]` : ""}.delete._on.${
                                        refNode.name
                                    }[${onDeleteIndex}]`,
                                    recursing: false,
                                });
                                subqueryClause.concat(onDeleteAndParams[0]);
                                res.params = { ...res.params, ...onDeleteAndParams[1] };
                            });
                        }
                    }

                    if (context.subscriptionsEnabled) {
                        const metaObjectStr = createEventMetaObject({
                            event: "delete",
                            nodeVariable: "x",
                            typename: refNode.name,
                        });
                        const [fromVariable, toVariable] =
                            relationField.direction === "IN" ? ["x", parentVar] : [parentVar, "x"];
                        const [fromTypename, toTypename] =
                            relationField.direction === "IN" ? [refNode.name, node.name] : [node.name, refNode.name];
                        const eventWithMetaStr = createConnectionEventMetaObject({
                            event: "delete_relationship",
                            relVariable: relationshipVariable,
                            fromVariable,
                            toVariable,
                            typename: relationField.typeUnescaped,
                            fromTypename,
                            toTypename,
                        });

                        const deleteHelperNode = new Cypher.Node();
                        const deleteHelperVar = new Cypher.Variable();
                        const reduceAccVar = new Cypher.Variable();
                        const reduceIteratorVar = new Cypher.Variable();
                        const mergeMetaVarsReducer = Cypher.reduce(
                            reduceAccVar,
                            metaVar,
                            reduceIteratorVar,
                            deleteHelperVar,
                            Cypher.plus(reduceAccVar, reduceIteratorVar)
                        );
                        subqueryClause.concat(
                            new Cypher.With(...withVarsVariables, metaVar, relationshipToDelete, [
                                Cypher.collect(nodeToDelete), //TODO: DISTINCT
                                nodeToDeleteVar,
                            ]),
                            new Cypher.Call(
                                new Cypher.Unwind([nodeToDeleteVar, deleteHelperNode])
                                    .with(...withVarsVariables, relationshipToDelete, deleteHelperNode, [
                                        new Cypher.RawCypher(`[] + ${metaObjectStr} + ${eventWithMetaStr}`),
                                        metaVar,
                                    ])
                                    .detachDelete(deleteHelperNode)
                                    .return([Cypher.collect(metaVar), deleteHelperVar])
                            ).innerWith(relationshipToDelete, nodeToDeleteVar, ...withVarsVariables),
                            new Cypher.With(deleteHelperVar, metaVar),
                            new Cypher.Return([mergeMetaVarsReducer, deleteHelperVar])
                        );
                        clause = Cypher.concat(
                            new Cypher.With("*"),
                            new Cypher.Call(subqueryClause).innerWith(...withVarsVariables),
                            new Cypher.With(...withVarsVariables, metaVar, [
                                Cypher.collect(deleteHelperVar),
                                deleteHelperVar,
                            ]),
                            new Cypher.With(...withVarsVariables, [mergeMetaVarsReducer, metaVar])
                        );
                    } else {
                        const deleteHelperNode = new Cypher.Node();
                        subqueryClause.concat(
                            new Cypher.With(relationshipToDelete, [Cypher.collect(nodeToDelete), nodeToDeleteVar]), //TODO: DISTINCT
                            new Cypher.Call(
                                Cypher.concat(
                                    new Cypher.Unwind([nodeToDeleteVar, deleteHelperNode]),
                                    new Cypher.With(deleteHelperNode).detachDelete(deleteHelperNode)
                                )
                            ).innerWith(nodeToDeleteVar)
                        );
                        clause = Cypher.concat(
                            new Cypher.With("*"),
                            new Cypher.Call(subqueryClause).innerWith(...withVarsVariables)
                        );
                    }

                    res.strsCypher.concat(clause);
                });
            });

            return res;
        }

        return res;
    }

    const { strsCypher, params } = Object.entries(deleteInput).reduce(reducer, {
        strsCypher: Cypher.concat(),
        params: {},
    });

    return [strsCypher, params];
}

export default createDeleteAndParams;
