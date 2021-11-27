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
import WithProjector from "../classes/WithProjector";
import { AUTH_FORBIDDEN_ERROR } from "../constants";
import { Context, RelationField } from "../types";
import createAuthAndParams from "./create-auth-and-params";
import createSetRelationshipPropertiesAndParams from "./create-set-relationship-properties-and-params";
import createWhereAndParams from "./create-where-and-params";

interface Res {
    connects: string[];
    params: any;
}

function createConnectAndParams({
    withProjector,
    value,
    varName,
    relationField,
    parentVar,
    refNodes,
    context,
    labelOverride,
    parentNode,
    fromCreate,
    insideDoWhen,
}: {
    withProjector: WithProjector,
    value: any;
    varName: string;
    relationField: RelationField;
    parentVar: string;
    context: Context;
    refNodes: Node[];
    labelOverride?: string;
    parentNode: Node;
    fromCreate?: boolean;
    insideDoWhen?: boolean;
}): [string, any] {
    function createSubqueryContents(
        relatedNode: Node,
        connect: any,
        index: number,
        childWithProjector: WithProjector,
    ): { subquery: string; params: Record<string, any> } {
        let params = {};

        const baseName = `${varName}${index}`;
        const nodeName = `${baseName}_node`;
        const relationshipName = `${baseName}_relationship`;
        const inStr = relationField.direction === "IN" ? "<-" : "-";
        const outStr = relationField.direction === "OUT" ? "->" : "-";
        const relTypeStr = `[${relationField.properties ? relationshipName : ""}:${relationField.type}]`;

        const subquery: string[] = [];
        const labels = relatedNode.getLabelString(context);
        const label = labelOverride ? `:${labelOverride}` : labels;

        subquery.push(withProjector.nextWith());
        subquery.push(`\tOPTIONAL MATCH (${nodeName}${label})`);
        childWithProjector.addVariable(nodeName);

        const whereStrs: string[] = [];
        if (connect.where) {
            // If _on is the only where key and it doesn't contain this implementation, don't connect it
            if (
                connect.where.node._on &&
                Object.keys(connect.where.node).length === 1 &&
                !Object.prototype.hasOwnProperty.call(connect.where.node._on, relatedNode.name)
            ) {
                return { subquery: "", params: {} };
            }

            const rootNodeWhereAndParams = createWhereAndParams({
                whereInput: {
                    ...Object.entries(connect.where.node).reduce((args, [k, v]) => {
                        if (k !== "_on") {
                            // If this where key is also inside _on for this implementation, use the one in _on instead
                            if (connect.where.node?._on?.[relatedNode.name]?.[k]) {
                                return args;
                            }
                            return { ...args, [k]: v };
                        }

                        return args;
                    }, {}),
                },
                context,
                node: relatedNode,
                varName: nodeName,
                recursing: true,
            });
            if (rootNodeWhereAndParams[0]) {
                whereStrs.push(rootNodeWhereAndParams[0]);
                params = { ...params, ...rootNodeWhereAndParams[1] };
            }

            // For _on filters
            if (connect.where.node?._on?.[relatedNode.name]) {
                const onTypeNodeWhereAndParams = createWhereAndParams({
                    whereInput: {
                        ...Object.entries(connect.where.node).reduce((args, [k, v]) => {
                            if (k !== "_on") {
                                return { ...args, [k]: v };
                            }

                            if (Object.prototype.hasOwnProperty.call(v, relatedNode.name)) {
                                return { ...args, ...(v as any)[relatedNode.name] };
                            }

                            return args;
                        }, {}),
                    },
                    context,
                    node: relatedNode,
                    varName: `${nodeName}`,
                    chainStr: `${nodeName}_on_${relatedNode.name}`,
                    recursing: true,
                });
                if (onTypeNodeWhereAndParams[0]) {
                    whereStrs.push(onTypeNodeWhereAndParams[0]);
                    params = { ...params, ...onTypeNodeWhereAndParams[1] };
                }
            }
        }

        if (relatedNode.auth) {
            const whereAuth = createAuthAndParams({
                operations: "CONNECT",
                entity: relatedNode,
                context,
                where: { varName: nodeName, node: relatedNode },
            });
            if (whereAuth[0]) {
                whereStrs.push(whereAuth[0]);
                params = { ...params, ...whereAuth[1] };
            }
        }

        if (whereStrs.length) {
            subquery.push(`\tWHERE ${whereStrs.join(" AND ")}`);
        }

        const preAuth = [...(!fromCreate ? [parentNode] : []), relatedNode].reduce(
            (result: Res, node, i) => {
                if (!node.auth) {
                    return result;
                }

                const [str, p] = createAuthAndParams({
                    entity: node,
                    operations: "CONNECT",
                    context,
                    escapeQuotes: Boolean(insideDoWhen),
                    allow: { parentNode: node, varName: nodeName, chainStr: `${nodeName}${node.name}${i}_allow` },
                });

                if (!str) {
                    return result;
                }

                result.connects.push(str);
                // eslint-disable-next-line no-param-reassign
                result.params = { ...result.params, ...p };

                return result;
            },
            { connects: [], params: {} }
        );

        if (preAuth.connects.length) {
            const quote = insideDoWhen ? `\\"` : `"`;
            subquery.push(withProjector.nextWith({ additionalVariables: [ nodeName ] }));
            subquery.push(
                `\tCALL apoc.util.validate(NOT(${preAuth.connects.join(
                    " AND "
                )}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
            );
            params = { ...params, ...preAuth.params };
        }

        /*
           TODO
           Replace with subclauses https://neo4j.com/developer/kb/conditional-cypher-execution/
           https://neo4j.slack.com/archives/C02PUHA7C/p1603458561099100
        */
        subquery.push(`CALL apoc.do.when(${ nodeName } IS NOT NULL AND ${ parentVar } IS NOT NULL, ${ insideDoWhen ? '\\"' : '"' }`);
        const mergeStrs: string[] = [];
        const mergeWithProjector = childWithProjector.createChild(nodeName);

        mergeStrs.push(`\t\t\tMERGE (${parentVar})${inStr}${relTypeStr}${outStr}(${nodeName})`);

        let innerApocParams = {};

        if (relationField.properties) {
            const relationship = (context.neoSchema.relationships.find(
                (x) => x.properties === relationField.properties
            ) as unknown) as Relationship;
            const setA = createSetRelationshipPropertiesAndParams({
                properties: connect.edge ?? {},
                varName: relationshipName,
                relationship,
                operation: "CREATE",
            });
            mergeStrs.push(setA[0]);
            innerApocParams = { ...innerApocParams, ...setA[1] };
            params = { ...params, ...setA[1] };
        }

        mergeWithProjector.markMutationMeta({
            type: 'Connected',
            name: parentNode.name,
            relationshipName: relationField.type,
            toName: relatedNode.name,

            idVar: `id(${ parentVar })`,
            relationshipIDVar: relationField.properties ? `id(${ relationshipName })` : '',
            toIDVar: `id(${ nodeName })`,
            propertiesVar: relationField.properties ? relationshipName : undefined,
        });
        mergeStrs.push(mergeWithProjector.nextReturn([], {}));

        const apocArgs = `{${
            childWithProjector.variables.map((withVar) => `${withVar}:${withVar}`)
            .concat(Object.keys(innerApocParams).map((k) => `${ k }:$${ k }`))
            .join(", ")
        }}`;

        if (insideDoWhen) {
            mergeStrs.push(`\\", \\"\\", ${apocArgs})`);
        } else {
            mergeStrs.push(`", "", ${apocArgs})`);
        }

        mergeStrs.push("YIELD value");
        mergeStrs.push(childWithProjector.mergeWithChild(mergeWithProjector, `value.${ mergeWithProjector.mutateMetaListVarName }`));


        const mergeStr = mergeStrs.join("\n");
        // const mergeStr = mergeStrs.join("\n").replace(/REPLACE_ME/g, `, ${ paramsString }`);

        subquery.push(mergeStr);
        // res.connects.push(`)`); // close FOREACH

        if (connect.connect) {
            const connects = (Array.isArray(connect.connect) ? connect.connect : [connect.connect]) as any[];
            connects.forEach((c) => {
                const reduced = Object.entries(c)
                    .filter(([k]) => {
                        if (k === "_on") {
                            return false;
                        }

                        if (relationField.interface && c?._on?.[relatedNode.name]) {
                            const onArray = Array.isArray(c._on[relatedNode.name])
                                ? c._on[relatedNode.name]
                                : [c._on[relatedNode.name]];
                            if (onArray.some((onKey) => Object.prototype.hasOwnProperty.call(onKey, k))) {
                                return false;
                            }
                        }

                        return true;
                    })
                    .reduce(
                        (r: Res, [k, v]: [string, any]) => {
                            const relField = relatedNode.relationFields.find((x) => k === x.fieldName) as RelationField;
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
                                    withProjector: childWithProjector,
                                    value: relField.union ? v[newRefNode.name] : v,
                                    varName: `${nodeName}_${k}${relField.union ? `_${newRefNode.name}` : ""}`,
                                    relationField: relField,
                                    parentVar: nodeName,
                                    context,
                                    refNodes: [newRefNode],
                                    parentNode: relatedNode,
                                    labelOverride: relField.union ? newRefNode.name : "",
                                });
                                r.connects.push(recurse[0]);
                                // eslint-disable-next-line no-param-reassign
                                r.params = { ...r.params, ...recurse[1] };
                            });

                            return r;
                        },
                        { connects: [], params: {} }
                    );

                subquery.push(reduced.connects.join("\n"));
                params = { ...params, ...reduced.params };

                if (relationField.interface && c?._on?.[relatedNode.name]) {
                    const onConnects = Array.isArray(c._on[relatedNode.name])
                        ? c._on[relatedNode.name]
                        : [c._on[relatedNode.name]];

                    onConnects.forEach((onConnect, onConnectIndex) => {
                        const onReduced = Object.entries(onConnect).reduce(
                            (r: Res, [k, v]: [string, any]) => {
                                const relField = relatedNode.relationFields.find((x) =>
                                    k.startsWith(x.fieldName)
                                ) as RelationField;
                                const newRefNodes: Node[] = [];

                                if (relField.union) {
                                    Object.keys(v).forEach((modelName) => {
                                        newRefNodes.push(
                                            context.neoSchema.nodes.find((x) => x.name === modelName) as Node
                                        );
                                    });
                                } else {
                                    newRefNodes.push(
                                        context.neoSchema.nodes.find((x) => x.name === relField.typeMeta.name) as Node
                                    );
                                }

                                newRefNodes.forEach((newRefNode) => {
                                    const recurse = createConnectAndParams({
                                        withProjector: childWithProjector,
                                        value: relField.union ? v[newRefNode.name] : v,
                                        varName: `${nodeName}_on_${relatedNode.name}${onConnectIndex}_${k}`,
                                        relationField: relField,
                                        parentVar: nodeName,
                                        context,
                                        refNodes: [newRefNode],
                                        parentNode: relatedNode,
                                        labelOverride: relField.union ? newRefNode.name : "",
                                    });
                                    r.connects.push(recurse[0]);
                                    // eslint-disable-next-line no-param-reassign
                                    r.params = { ...r.params, ...recurse[1] };
                                });

                                return r;
                            },
                            { connects: [], params: {} }
                        );

                        subquery.push(onReduced.connects.join("\n"));
                        params = { ...params, ...onReduced.params };
                    });
                }
            });
        }

        const postAuth = [...(!fromCreate ? [parentNode] : []), relatedNode].reduce(
            (result: Res, node, i) => {
                if (!node.auth) {
                    return result;
                }

                const [str, p] = createAuthAndParams({
                    entity: node,
                    operations: "CONNECT",
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
                // eslint-disable-next-line no-param-reassign
                result.params = { ...result.params, ...p };

                return result;
            },
            { connects: [], params: {} }
        );

        if (postAuth.connects.length) {
            const quote = insideDoWhen ? `\\"` : `"`;
            subquery.push(childWithProjector.nextWith());
            subquery.push(
                `\tCALL apoc.util.validate(NOT(${postAuth.connects.join(
                    " AND "
                )}), ${quote}${AUTH_FORBIDDEN_ERROR}${quote}, [0])`
            );
            params = { ...params, ...postAuth.params };
        }

        childWithProjector.removeVariable(nodeName);

        subquery.push(childWithProjector.nextReturn([], {
            excludeVariables: withProjector.variables,
            reduceMeta: true,
        }));

        return { subquery: subquery.join("\n"), params };
    }

    function reducer(res: Res, connect: any, index): Res {
        if (parentNode.auth && !fromCreate) {
            const whereAuth = createAuthAndParams({
                operations: "CONNECT",
                entity: parentNode,
                context,
                where: { varName: parentVar, node: parentNode },
            });
            if (whereAuth[0]) {
                res.connects.push(withProjector.nextWith());
                res.connects.push(`WHERE ${whereAuth[0]}`);
                res.params = { ...res.params, ...whereAuth[1] };
            }
        }

        res.connects.push(withProjector.nextWith());
        res.connects.push("CALL {");
        const childWithProjector = withProjector.createChild(varName);
        let mutateMetaVariableDeclared = false;

        if (relationField.interface) {
            const subqueries: string[] = [];
            refNodes.forEach((refNode) => {
                // this_mutateMeta will not be declared at the beginning of each UNION.
                childWithProjector.mutateMetaVariableDeclared = false;
                const subquery = createSubqueryContents(refNode, connect, index, childWithProjector);
                if (subquery.subquery) {
                    subqueries.push(subquery.subquery);
                    res.params = { ...res.params, ...subquery.params };
                }

                if (childWithProjector.mutateMetaVariableDeclared) {
                    mutateMetaVariableDeclared = true;
                }
            });
            res.connects.push(subqueries.join("\nUNION\n"));
        } else {
            const subquery = createSubqueryContents(refNodes[0], connect, index, childWithProjector);
            res.connects.push(subquery.subquery);
            res.params = { ...res.params, ...subquery.params };
            mutateMetaVariableDeclared = childWithProjector.mutateMetaVariableDeclared;
        }

        res.connects.push("}");
        if (mutateMetaVariableDeclared) {
            res.connects.push(withProjector.mergeWithChild(childWithProjector));
        }

        return res;
    }

    const { connects, params } = ((relationField.typeMeta.array ? value : [value]) as any[]).reduce(reducer, {
        connects: [],
        params: {},
    });

    return [connects.join("\n"), params];
}

export default createConnectAndParams;
