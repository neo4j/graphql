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

import Cypher from "@neo4j/cypher-builder";
import type { Node, Relationship } from "../classes";
import type { RelationField } from "../types";
import type { Neo4jGraphQLTranslationContext } from "../types/neo4j-graphql-translation-context";
import { caseWhere } from "../utils/case-where";
import { checkAuthentication } from "./authorization/check-authentication";
import { createAuthorizationAfterAndParams } from "./authorization/compatibility/create-authorization-after-and-params";
import { createAuthorizationBeforeAndParams } from "./authorization/compatibility/create-authorization-before-and-params";
import { getRelationshipDirection } from "./utils/get-relationship-direction";
import createConnectionWhereAndParams from "./where/create-connection-where-and-params";

interface Res {
    disconnects: string[];
    params: any;
}

function createDisconnectAndParams({
    withVars,
    value,
    varName,
    relationField,
    parentVar,
    refNodes,
    context,
    labelOverride,
    parentNode,
    parameterPrefix,
    isFirstLevel = true,
}: {
    withVars: string[];
    value: any;
    varName: string;
    relationField: RelationField;
    parentVar: string;
    context: Neo4jGraphQLTranslationContext;
    refNodes: Node[];
    labelOverride?: string;
    parentNode: Node;
    parameterPrefix: string;
    isFirstLevel?: boolean;
}): [string, any] {
    checkAuthentication({ context, node: parentNode, targetOperations: ["DELETE_RELATIONSHIP"] });

    function createSubqueryContents(
        relatedNode: Node,
        disconnect: any,
        index: number
    ): { subquery: string; params: Record<string, any> } {
        checkAuthentication({ context, node: relatedNode, targetOperations: ["DELETE_RELATIONSHIP"] });

        const variableName = `${varName}${index}`;
        const { inStr, outStr } = getRelationshipDirection(relationField);
        const relVarName = `${variableName}_rel`;
        const relTypeStr = `[${relVarName}:${relationField.type}]`;
        const subquery: string[] = [];
        let params;
        const labels = relatedNode.getLabelString(context);
        const label = labelOverride ? `:${labelOverride}` : labels;

        subquery.push(`WITH ${withVars.join(", ")}`);
        subquery.push(`OPTIONAL MATCH (${parentVar})${inStr}${relTypeStr}${outStr}(${variableName}${label})`);
        const relationship = context.relationships.find(
            (x) => x.properties === relationField.properties
        ) as unknown as Relationship;

        const whereStrs: string[] = [];
        let aggregationWhere = false;
        if (disconnect.where) {
            try {
                const {
                    cypher: whereCypher,
                    subquery: preComputedSubqueries,
                    params: whereParams,
                } = createConnectionWhereAndParams({
                    nodeVariable: variableName,
                    whereInput: disconnect.where,
                    node: relatedNode,
                    context,
                    relationshipVariable: relVarName,
                    relationship,
                    parameterPrefix: `${parameterPrefix}${relationField.typeMeta.array ? `[${index}]` : ""}.where.${
                        relatedNode.name
                    }`,
                });
                if (whereCypher) {
                    whereStrs.push(whereCypher);
                    params = { ...params, ...whereParams };
                    if (preComputedSubqueries) {
                        subquery.push(preComputedSubqueries);
                        aggregationWhere = true;
                    }
                }
            } catch {
                return { subquery: "", params: {} };
            }
        }

        const authorizationBeforeAndParams = createAuthorizationBeforeAndParams({
            context,
            nodes: [
                { node: parentNode, variable: parentVar },
                { node: relatedNode, variable: variableName },
            ],
            operations: ["DELETE_RELATIONSHIP"],
        });

        if (authorizationBeforeAndParams) {
            const { cypher, params: authWhereParams, subqueries } = authorizationBeforeAndParams;

            whereStrs.push(cypher);
            params = { ...params, ...authWhereParams };

            if (subqueries) {
                subquery.push(subqueries);
                if (whereStrs.length) {
                    subquery.push("WITH *");
                }
            }
        }

        if (whereStrs.length) {
            const predicate = `${whereStrs.join(" AND ")}`;
            if (aggregationWhere) {
                const columns = [new Cypher.NamedVariable(relVarName), new Cypher.NamedVariable(variableName)];
                const caseWhereClause = caseWhere(new Cypher.Raw(predicate), columns);
                const { cypher } = caseWhereClause.build({ prefix: "aggregateWhereFilter" });
                subquery.push(cypher);
            } else {
                subquery.push(`WHERE ${predicate}`);
            }
        }

        subquery.push("CALL {");
        // Trick to avoid execution on null values
        subquery.push(`\tWITH ${variableName}, ${relVarName}, ${parentVar}`);
        subquery.push(`\tWITH collect(${variableName}) as ${variableName}, ${relVarName}, ${parentVar}`);
        subquery.push(`\tUNWIND ${variableName} as x`);

        subquery.push(`\tDELETE ${relVarName}`);

        subquery.push(`}`);

        // TODO - relationship validation - Blocking, if this were to be enforced it would stop someone from 'reconnecting'

        if (disconnect.disconnect) {
            const disconnects: Array<any> = Array.isArray(disconnect.disconnect)
                ? disconnect.disconnect
                : [disconnect.disconnect];

            disconnects.forEach((c) => {
                const reduced = Object.entries(c).reduce(
                    (r: Res, [k, v]: [string, any]) => {
                        const relField = relatedNode.relationFields.find((x) =>
                            k.startsWith(x.fieldName)
                        ) as RelationField;
                        const newRefNodes: Node[] = [];

                        if (relField.union) {
                            Object.keys(v).forEach((modelName) => {
                                newRefNodes.push(context.nodes.find((x) => x.name === modelName) as Node);
                            });
                        } else if (relField.interface) {
                            (relField.interface.implementations as string[]).forEach((modelName) => {
                                newRefNodes.push(context.nodes.find((x) => x.name === modelName) as Node);
                            });
                        } else {
                            newRefNodes.push(context.nodes.find((x) => x.name === relField.typeMeta.name) as Node);
                        }

                        newRefNodes.forEach((newRefNode, i) => {
                            const recurse = createDisconnectAndParams({
                                withVars: [...withVars, variableName],
                                value: relField.union ? v[newRefNode.name] : v,
                                varName: `${variableName}_${k}${relField.union ? `_${newRefNode.name}` : ""}`,
                                relationField: relField,
                                parentVar: variableName,
                                context,
                                refNodes: [newRefNode],
                                parentNode: relatedNode,
                                parameterPrefix: `${parameterPrefix}${
                                    relField.typeMeta.array ? `[${i}]` : ""
                                }.disconnect.${k}${relField.union ? `.${newRefNode.name}` : ""}`,
                                labelOverride: relField.union ? newRefNode.name : "",
                                isFirstLevel: false,
                            });
                            r.disconnects.push(recurse[0]);
                            r.params = { ...r.params, ...recurse[1] };
                        });

                        return r;
                    },
                    { disconnects: [], params: {} }
                );

                subquery.push(reduced.disconnects.join("\n"));
                params = { ...params, ...reduced.params };
            });
        }

        const authorizationAfterAndParams = createAuthorizationAfterAndParams({
            context,
            nodes: [
                { node: parentNode, variable: parentVar },
                { node: relatedNode, variable: variableName },
            ],
            operations: ["DELETE_RELATIONSHIP"],
        });

        if (authorizationAfterAndParams) {
            const { cypher, params: authWhereParams, subqueries } = authorizationAfterAndParams;

            if (cypher) {
                if (subqueries) {
                    subquery.push(`WITH *`);
                    subquery.push(`${subqueries}`);
                    subquery.push(`WITH *`);
                } else {
                    subquery.push(`WITH ${[...withVars, variableName].join(", ")}`);
                }

                subquery.push(`WHERE ${cypher}`);
                params = { ...params, ...authWhereParams };
            }
        }

        subquery.push(`RETURN count(*) AS disconnect_${varName}_${relatedNode.name}`);

        return { subquery: subquery.join("\n"), params };
    }

    function reducer(res: Res, disconnect: { where: any; disconnect: any }, index: number): Res {
        if (isFirstLevel) {
            res.disconnects.push(`WITH ${withVars.join(", ")}`);
        }

        const inner: string[] = [];
        if (relationField.interface) {
            const subqueries: string[] = [];
            refNodes.forEach((refNode) => {
                const subquery = createSubqueryContents(refNode, disconnect, index);
                if (subquery.subquery) {
                    subqueries.push(subquery.subquery);
                    res.params = { ...res.params, ...subquery.params };
                }
            });
            if (subqueries.length > 0) {
                inner.push(subqueries.join("\n}\nCALL {\n\t"));
            }
        } else {
            const subquery = createSubqueryContents(refNodes[0] as Node, disconnect, index);
            inner.push(subquery.subquery);
            res.params = { ...res.params, ...subquery.params };
        }

        if (inner.length > 0) {
            res.disconnects.push("CALL {");
            res.disconnects.push(...inner);
            res.disconnects.push("}");
        }

        return res;
    }

    const { disconnects, params } = ((relationField.typeMeta.array ? value : [value]) as any[]).reduce(reducer, {
        disconnects: [],
        params: {},
    });

    return [disconnects.join("\n"), params];
}

export default createDisconnectAndParams;
