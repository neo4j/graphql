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
import { createAuthAndParams } from "./create-auth-and-params";
import createConnectionWhereAndParams from "./where/create-connection-where-and-params";
import { AUTH_FORBIDDEN_ERROR, META_CYPHER_VARIABLE } from "../constants";
import { createEventMetaObject } from "./subscriptions/create-event-meta";
import { createConnectionEventMetaObject } from "./subscriptions/create-connection-event-meta";
import { filterMetaVariable } from "./subscriptions/filter-meta-variable";
import Cypher from "@neo4j/cypher-builder";
import { caseWhere } from "../utils/case-where";

interface Res {
    strs: string[];
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
}): [string, any, Cypher.Clause] {
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
                    let CB_clause;

                    const variableName = chainStr
                        ? `${varName}${index}`
                        : `${varName}_${key}${
                              relationField.union || relationField.interface ? `_${refNode.name}` : ""
                          }${index}`;
                    const relationshipVariable = `${variableName}_relationship`;
                    const relTypeStr = `[${relationshipVariable}:${relationField.type}]`;
                    const nodeToDelete = `${variableName}_to_delete`;
                    const labels = refNode.getLabelString(context);

                    const CB_nodeToDelete = new Cypher.NamedVariable(nodeToDelete);
                    const CB_metaVar = new Cypher.NamedVariable(META_CYPHER_VARIABLE);
                    const CB_withVars = filterMetaVariable(withVars).map((v) => new Cypher.NamedVariable(v));
                    const CB_node1 = new Cypher.NamedNode(variableName, {
                        labels: refNode.getLabels(context),
                    });
                    const CB_node2 = new Cypher.NamedNode(parentVar);
                    const CB_relationship = new Cypher.NamedRelationship(relationshipVariable, {
                        type: relationField.type,
                    });
                    const CB_relationshipPattern =
                        relationField.direction === "IN"
                            ? new Cypher.Pattern(CB_node1).related(CB_relationship).to(CB_node2)
                            : new Cypher.Pattern(CB_node2).related(CB_relationship).to(CB_node1);
                    const CB_subquery = context.subscriptionsEnabled
                        ? Cypher.concat(
                              new Cypher.With(...CB_withVars, [new Cypher.Literal([]), CB_metaVar]),
                              new Cypher.OptionalMatch(CB_relationshipPattern)
                          )
                        : Cypher.concat(new Cypher.OptionalMatch(CB_relationshipPattern));

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
                                    CB_subquery.concat(new Cypher.RawCypher(preComputedSubqueries));
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
                            CB_subquery.concat(new Cypher.RawCypher(cypher));
                        } else {
                            innerStrs.push(`WHERE ${predicate}`);
                            CB_subquery.concat(new Cypher.RawCypher(`WHERE ${predicate}`));
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
                        if (context.subscriptionsEnabled) {
                            CB_subquery.concat(new Cypher.With(...CB_withVars, CB_node1, CB_relationship, CB_metaVar));
                        } else {
                            CB_subquery.concat(new Cypher.With(...CB_withVars, CB_node1, CB_relationship));
                        }
                        CB_subquery.concat(
                            new Cypher.CallProcedure(
                                new Cypher.apoc.Validate(
                                    Cypher.not(Cypher.and(new Cypher.RawCypher(allowAuth[0]))),
                                    `${quote}${AUTH_FORBIDDEN_ERROR}${quote}`,
                                    new Cypher.Literal([0])
                                )
                            )
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
                        CB_subquery.concat(deleteAndParams[2]);
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
                                CB_subquery.concat(onDeleteAndParams[2]);
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

                        const CB_deleteHelperNode = new Cypher.Node();
                        const CB_deleteMetaVar = new Cypher.NamedVariable("delete_meta");
                        const CB_innerSubquery = new Cypher.Call(
                            new Cypher.Unwind([CB_nodeToDelete, CB_deleteHelperNode])
                                .with(...CB_withVars, CB_relationship, CB_deleteHelperNode, [
                                    new Cypher.RawCypher(`[] + ${metaObjectStr} + ${eventWithMetaStr}`),
                                    CB_metaVar,
                                ])
                                .detachDelete(CB_deleteHelperNode)
                                .return([Cypher.collect(CB_metaVar), CB_deleteMetaVar])
                        ).innerWith(CB_relationship, CB_nodeToDelete, ...CB_withVars);

                        const CB_reduceAccVar = new Cypher.Variable();
                        const CB_reduceIteratorVar = new Cypher.Variable();
                        CB_subquery.concat(
                            new Cypher.With(...CB_withVars, CB_metaVar, CB_relationship, [
                                Cypher.collect(CB_node1), //TODO: DISTINCT
                                CB_nodeToDelete,
                            ]),
                            CB_innerSubquery,
                            new Cypher.With(CB_deleteMetaVar, CB_metaVar),
                            new Cypher.Return([
                                Cypher.reduce(
                                    CB_reduceAccVar,
                                    CB_metaVar,
                                    CB_reduceIteratorVar,
                                    CB_deleteMetaVar,
                                    Cypher.plus(CB_reduceAccVar, CB_reduceIteratorVar)
                                ),
                                CB_deleteMetaVar,
                            ])
                        );
                        CB_clause = Cypher.concat(
                            new Cypher.With("*"),
                            new Cypher.Call(CB_subquery).innerWith(...CB_withVars),
                            new Cypher.With(...CB_withVars, CB_metaVar, [
                                Cypher.collect(CB_deleteMetaVar),
                                CB_deleteMetaVar,
                            ]),
                            new Cypher.With(...CB_withVars, [
                                Cypher.reduce(
                                    CB_reduceAccVar,
                                    CB_metaVar,
                                    CB_reduceIteratorVar,
                                    CB_deleteMetaVar,
                                    Cypher.plus(CB_reduceAccVar, CB_reduceIteratorVar)
                                ),
                                CB_metaVar,
                            ])
                        );

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
                            `RETURN REDUCE(m=${META_CYPHER_VARIABLE}, n IN delete_meta | m + n) AS delete_meta`,
                            `}`,
                            `WITH ${varsWithoutMeta}, ${META_CYPHER_VARIABLE}, collect(delete_meta) as delete_meta`,
                            `WITH ${varsWithoutMeta}, REDUCE(m=${META_CYPHER_VARIABLE}, n IN delete_meta | m + n) AS ${META_CYPHER_VARIABLE}`,
                        ];

                        innerStrs.push(...statements);
                    } else {
                        const CB_deleteHelperNode = new Cypher.Node();
                        CB_subquery.concat(
                            new Cypher.With(CB_relationship, [Cypher.collect(CB_node1), CB_nodeToDelete]), //TODO: DISTINCT
                            new Cypher.Call(
                                Cypher.concat(
                                    new Cypher.Unwind([CB_nodeToDelete, CB_deleteHelperNode]),
                                    new Cypher.With(CB_deleteHelperNode).detachDelete(CB_deleteHelperNode)
                                )
                            ).innerWith(CB_nodeToDelete)
                        );
                        CB_clause = Cypher.concat(
                            new Cypher.With("*"),
                            new Cypher.Call(CB_subquery).innerWith(...CB_withVars)
                        );

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
                    res.strsCypher.concat(CB_clause);
                });
            });

            return res;
        }

        return res;
    }

    const { strs, strsCypher, params } = Object.entries(deleteInput).reduce(reducer, {
        strs: [],
        strsCypher: Cypher.concat(),
        params: {},
    });

    return [strs.join("\n"), params, strsCypher];
}

export default createDeleteAndParams;
