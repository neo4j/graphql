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

import { FieldsByTypeName, ResolveTree } from "graphql-parse-resolve-info";
import { cursorToOffset } from "graphql-relay";
import { Integer } from "neo4j-driver";
import { ConnectionField, ConnectionSortArg, ConnectionWhereArg, Context } from "../../types";
import { Node } from "../../classes";
// eslint-disable-next-line import/no-cycle
import createProjectionAndParams from "../create-projection-and-params";
import Relationship from "../../classes/Relationship";
import createRelationshipPropertyElement from "../projection/elements/create-relationship-property-element";
import createConnectionWhereAndParams from "../where/create-connection-where-and-params";
import createAuthAndParams from "../create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../../constants";
import { createOffsetLimitStr } from "../../schema/pagination";

function createConnectionAndParams({
    resolveTree,
    field,
    context,
    nodeVariable,
    parameterPrefix,
}: {
    resolveTree: ResolveTree;
    field: ConnectionField;
    context: Context;
    nodeVariable: string;
    parameterPrefix?: string;
}): [string, any] {
    let globalParams = {};
    let nestedConnectionFieldParams;

    const subquery = ["CALL {", `WITH ${nodeVariable}`];

    const sortInput = resolveTree.args.sort as ConnectionSortArg[];
    const afterInput = resolveTree.args.after;
    const firstInput = resolveTree.args.first;
    const whereInput = resolveTree.args.where as ConnectionWhereArg;

    const relationshipVariable = `${nodeVariable}_${field.relationship.type.toLowerCase()}`;
    const relationship = context.neoSchema.relationships.find(
        (r) => r.name === field.relationshipTypeName
    ) as Relationship;

    const inStr = field.relationship.direction === "IN" ? "<-" : "-";
    const relTypeStr = `[${relationshipVariable}:${field.relationship.type}]`;
    const outStr = field.relationship.direction === "OUT" ? "->" : "-";

    const connection = resolveTree.fieldsByTypeName[field.typeMeta.name];
    const { edges } = connection;

    const relationshipFieldsByTypeName = edges.fieldsByTypeName[field.relationshipTypeName];

    const relationshipProperties = Object.values(relationshipFieldsByTypeName).filter((v) => v.name !== "node");
    const node = Object.values(relationshipFieldsByTypeName).find((v) => v.name === "node") as ResolveTree;

    const elementsToCollect: string[] = [];

    if (relationshipProperties.length) {
        const relationshipPropertyEntries = relationshipProperties
            .filter((p) => p.name !== "cursor")
            .map((v) => createRelationshipPropertyElement({ resolveTree: v, relationship, relationshipVariable }));
        elementsToCollect.push(relationshipPropertyEntries.join(", "));
    }

    if (field.relationship.union) {
        const unionNodes = context.neoSchema.nodes.filter((n) => field.relationship.union?.nodes?.includes(n.name));
        const unionSubqueries: string[] = [];

        unionNodes.forEach((n) => {
            if (!node?.fieldsByTypeName[n.name]) {
                return;
            }

            const relatedNodeVariable = `${nodeVariable}_${n.name}`;
            const nodeOutStr = `(${relatedNodeVariable}:${n.name})`;

            const unionSubquery: string[] = [];
            const unionSubqueryElementsToCollect = [...elementsToCollect];

            const nestedSubqueries: string[] = [];

            if (node) {
                // Doing this for unions isn't necessary, but this would also work for interfaces if we decided to take that direction
                const nodeFieldsByTypeName: FieldsByTypeName = {
                    [n.name]: {
                        ...node?.fieldsByTypeName[n.name],
                        ...node?.fieldsByTypeName[field.relationship.typeMeta.name],
                    },
                };

                const nodeProjectionAndParams = createProjectionAndParams({
                    fieldsByTypeName: nodeFieldsByTypeName,
                    node: n,
                    context,
                    varName: relatedNodeVariable,
                    literalElements: true,
                    resolveType: true,
                });
                const [nodeProjection, nodeProjectionParams] = nodeProjectionAndParams;
                unionSubqueryElementsToCollect.push(`node: ${nodeProjection}`);
                globalParams = {
                    ...globalParams,
                    ...nodeProjectionParams,
                };

                if (nodeProjectionAndParams[2]?.connectionFields?.length) {
                    nodeProjectionAndParams[2].connectionFields.forEach((connectionResolveTree) => {
                        const connectionField = n.connectionFields.find(
                            (x) => x.fieldName === connectionResolveTree.name
                        ) as ConnectionField;
                        const nestedConnection = createConnectionAndParams({
                            resolveTree: connectionResolveTree,
                            field: connectionField,
                            context,
                            nodeVariable: relatedNodeVariable,
                            parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
                                resolveTree.name
                            }.edges.node`,
                        });
                        nestedSubqueries.push(nestedConnection[0]);

                        globalParams = {
                            ...globalParams,
                            ...Object.entries(nestedConnection[1]).reduce<Record<string, unknown>>((res, [k, v]) => {
                                if (k !== `${relatedNodeVariable}_${connectionResolveTree.name}`) {
                                    res[k] = v;
                                }
                                return res;
                            }, {}),
                        };

                        if (nestedConnection[1][`${relatedNodeVariable}_${connectionResolveTree.name}`]) {
                            if (!nestedConnectionFieldParams) nestedConnectionFieldParams = {};
                            nestedConnectionFieldParams = {
                                ...nestedConnectionFieldParams,
                                ...{
                                    [connectionResolveTree.name]:
                                        nestedConnection[1][`${relatedNodeVariable}_${connectionResolveTree.name}`],
                                },
                            };
                        }
                    });
                }
            }

            unionSubquery.push(`WITH ${nodeVariable}`);
            unionSubquery.push(`OPTIONAL MATCH (${nodeVariable})${inStr}${relTypeStr}${outStr}${nodeOutStr}`);

            const allowAndParams = createAuthAndParams({
                operation: "READ",
                entity: n,
                context,
                allow: {
                    parentNode: n,
                    varName: relatedNodeVariable,
                },
            });
            if (allowAndParams[0]) {
                globalParams = { ...globalParams, ...allowAndParams[1] };
                unionSubquery.push(
                    `CALL apoc.util.validate(NOT(${allowAndParams[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`
                );
            }

            const whereStrs: string[] = [];
            if (whereInput) {
                const where = createConnectionWhereAndParams({
                    whereInput,
                    node: n,
                    nodeVariable: relatedNodeVariable,
                    relationship,
                    relationshipVariable,
                    context,
                    parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
                        resolveTree.name
                    }.args.where`,
                });
                const [whereClause] = where;
                if (whereClause) {
                    whereStrs.push(whereClause);
                }
            }

            const whereAuth = createAuthAndParams({
                operation: "READ",
                entity: n,
                context,
                where: { varName: relatedNodeVariable, node: n },
            });
            if (whereAuth[0]) {
                whereStrs.push(whereAuth[0]);
                globalParams = { ...globalParams, ...whereAuth[1] };
            }

            if (whereStrs.length) {
                unionSubquery.push(`WHERE ${whereStrs.join(" AND ")}`);
            }

            if (nestedSubqueries.length) {
                unionSubquery.push(nestedSubqueries.join("\n"));
            }

            unionSubquery.push(`WITH { ${unionSubqueryElementsToCollect.join(", ")} } AS edge`);
            unionSubquery.push("RETURN edge");

            unionSubqueries.push(unionSubquery.join("\n"));
        });

        const unionSubqueryCypher = ["CALL {", unionSubqueries.join("\nUNION\n"), "}"];

        if (!firstInput && !afterInput) {
            unionSubqueryCypher.push("WITH collect(edge) as edges, count(edge) as totalCount");
        } else {
            const offsetLimitStr = createOffsetLimitStr({
                offset: typeof afterInput === "string" ? cursorToOffset(afterInput) + 1 : undefined,
                limit: firstInput as Integer | number | undefined,
            });
            unionSubqueryCypher.push("WITH collect(edge) AS allEdges");
            unionSubqueryCypher.push(`WITH allEdges, size(allEdges) as totalCount, allEdges${offsetLimitStr} AS edges`);
        }
        subquery.push(unionSubqueryCypher.join("\n"));
    } else {
        const relatedNodeVariable = `${nodeVariable}_${field.relationship.typeMeta.name.toLowerCase()}`;
        const nodeOutStr = `(${relatedNodeVariable}:${field.relationship.typeMeta.name})`;
        const relatedNode = context.neoSchema.nodes.find((x) => x.name === field.relationship.typeMeta.name) as Node;

        subquery.push(`MATCH (${nodeVariable})${inStr}${relTypeStr}${outStr}${nodeOutStr}`);

        const whereStrs: string[] = [];

        if (whereInput) {
            const where = createConnectionWhereAndParams({
                whereInput,
                node: relatedNode,
                nodeVariable: relatedNodeVariable,
                relationship,
                relationshipVariable,
                context,
                parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
                    resolveTree.name
                }.args.where`,
            });
            const [whereClause] = where;
            whereStrs.push(`${whereClause}`);
        }

        const whereAuth = createAuthAndParams({
            operation: "READ",
            entity: relatedNode,
            context,
            where: { varName: relatedNodeVariable, node: relatedNode },
        });
        if (whereAuth[0]) {
            whereStrs.push(whereAuth[0]);
            globalParams = { ...globalParams, ...whereAuth[1] };
        }

        if (whereStrs.length) {
            subquery.push(`WHERE ${whereStrs.join(" AND ")}`);
        }

        const allowAndParams = createAuthAndParams({
            operation: "READ",
            entity: relatedNode,
            context,
            allow: {
                parentNode: relatedNode,
                varName: relatedNodeVariable,
            },
        });
        if (allowAndParams[0]) {
            globalParams = { ...globalParams, ...allowAndParams[1] };
            subquery.push(`CALL apoc.util.validate(NOT(${allowAndParams[0]}), "${AUTH_FORBIDDEN_ERROR}", [0])`);
        }

        if (sortInput && sortInput.length) {
            const sort = sortInput.map((s) =>
                [
                    ...Object.entries(s.relationship || []).map(
                        ([f, direction]) => `${relationshipVariable}.${f} ${direction}`
                    ),
                    ...Object.entries(s.node || []).map(([f, direction]) => `${relatedNodeVariable}.${f} ${direction}`),
                ].join(", ")
            );
            subquery.push(`WITH ${relationshipVariable}, ${relatedNodeVariable}`);
            subquery.push(`ORDER BY ${sort.join(", ")}`);
        }

        const nestedSubqueries: string[] = [];

        if (node) {
            const nodeProjectionAndParams = createProjectionAndParams({
                fieldsByTypeName: node?.fieldsByTypeName,
                node: relatedNode,
                context,
                varName: relatedNodeVariable,
                literalElements: true,
            });
            const [nodeProjection, nodeProjectionParams, projectionMeta] = nodeProjectionAndParams;
            elementsToCollect.push(`node: ${nodeProjection}`);
            globalParams = { ...globalParams, ...nodeProjectionParams };

            if (projectionMeta?.authValidateStrs?.length) {
                subquery.push(
                    `CALL apoc.util.validate(NOT(${projectionMeta.authValidateStrs.join(
                        " AND "
                    )}), "${AUTH_FORBIDDEN_ERROR}", [0])`
                );
            }

            if (projectionMeta?.connectionFields?.length) {
                projectionMeta.connectionFields.forEach((connectionResolveTree) => {
                    const connectionField = relatedNode.connectionFields.find(
                        (x) => x.fieldName === connectionResolveTree.name
                    ) as ConnectionField;
                    const nestedConnection = createConnectionAndParams({
                        resolveTree: connectionResolveTree,
                        field: connectionField,
                        context,
                        nodeVariable: relatedNodeVariable,
                        parameterPrefix: `${parameterPrefix ? `${parameterPrefix}.` : `${nodeVariable}_`}${
                            resolveTree.name
                        }.edges.node`,
                    });
                    nestedSubqueries.push(nestedConnection[0]);

                    globalParams = {
                        ...globalParams,
                        ...Object.entries(nestedConnection[1]).reduce<Record<string, unknown>>((res, [k, v]) => {
                            if (k !== `${relatedNodeVariable}_${connectionResolveTree.name}`) {
                                res[k] = v;
                            }
                            return res;
                        }, {}),
                    };

                    if (nestedConnection[1][`${relatedNodeVariable}_${connectionResolveTree.name}`]) {
                        if (!nestedConnectionFieldParams) nestedConnectionFieldParams = {};
                        nestedConnectionFieldParams = {
                            ...nestedConnectionFieldParams,
                            ...{
                                [connectionResolveTree.name]:
                                    nestedConnection[1][`${relatedNodeVariable}_${connectionResolveTree.name}`],
                            },
                        };
                    }
                });
            }
        }

        if (nestedSubqueries.length) subquery.push(nestedSubqueries.join("\n"));
        subquery.push(`WITH collect({ ${elementsToCollect.join(", ")} }) AS edges`);
    }

    if (!firstInput && !afterInput) {
        subquery.push(
            `RETURN { edges: edges, totalCount: ${field.relationship.union ? "totalCount" : "size(edges)"} } AS ${
                resolveTree.alias
            }`
        );
    } else {
        const offsetLimitStr = createOffsetLimitStr({
            offset: typeof afterInput === "string" ? cursorToOffset(afterInput) + 1 : undefined,
            limit: firstInput as Integer | number | undefined,
        });
        subquery.push(`WITH edges, size(edges) AS totalCount, edges${offsetLimitStr} AS limitedSelection`);
        subquery.push(`RETURN { edges: limitedSelection, totalCount: totalCount } AS ${resolveTree.alias}`);
    }
    subquery.push("}");

    const params = {
        ...globalParams,
        ...((whereInput || nestedConnectionFieldParams) && {
            [`${nodeVariable}_${resolveTree.name}`]: {
                ...(whereInput && { args: { where: whereInput } }),
                ...(nestedConnectionFieldParams && { edges: { node: { ...nestedConnectionFieldParams } } }),
            },
        }),
    };

    return [subquery.join("\n"), params];
}

export default createConnectionAndParams;
