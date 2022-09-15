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
import { cursorToOffset } from "graphql-relay";
import { mergeDeep } from "@graphql-tools/utils";
import type { Integer } from "neo4j-driver";
import type { ConnectionField, ConnectionSortArg, ConnectionWhereArg, Context, GraphQLSortArg } from "../../types";
import type { Node } from "../../classes";
// eslint-disable-next-line import/no-cycle
import createProjectionAndParams from "../create-projection-and-params";
import type Relationship from "../../classes/Relationship";
import { createRelationshipPropertyValue } from "../projection/elements/create-relationship-property-element";
import { createAuthPredicates } from "../create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../../constants";
import { filterTruthy, isNeoInt, isString, toNumber } from "../../utils/utils";
import { generateMissingOrAliasedFields } from "../utils/resolveTree";
import { getRelationshipDirection } from "../../utils/get-relationship-direction";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import {
    createConnectionWherePropertyOperation,
    hasExplicitNodeInInterfaceWhere,
} from "../where/property-operations/create-connection-operation";
import { addSortAndLimitOptionsToClause } from "../projection/subquery/add-sort-and-limit-to-clause";
import { getOrCreateCypherNode } from "../utils/get-or-create-cypher-variable";
import { getPattern } from "../utils/get-pattern";

function createConnectionSubquery({
    resolveTree,
    field,
    context,
    parentNode,
    relatedNode,
    returnVariable,
}: {
    resolveTree: ResolveTree;
    field: ConnectionField;
    context: Context;
    parentNode: string;
    relatedNode: Node;
    returnVariable: CypherBuilder.Variable;
}): CypherBuilder.Clause | undefined {
    const nodeRef = getOrCreateCypherNode(parentNode);
    const whereInput = resolveTree.args.where as ConnectionWhereArg;

    const relatedNodeVarName = `${parentNode}_${relatedNode.name}`;
    const relatedNodeVariable = new CypherBuilder.NamedNode(relatedNodeVarName, {
        labels: relatedNode.getLabels(context),
    });

    const relationshipRef = new CypherBuilder.Relationship({
        source: nodeRef,
        target: relatedNodeVariable,
        type: field.relationship.type,
    });

    const relPattern = getPattern({
        relationship: relationshipRef,
        field: field.relationship,
        resolveTree,
    });

    const withClause = new CypherBuilder.With(nodeRef);
    const matchClause = new CypherBuilder.Match(relPattern);
    const unionInterfaceWhere = field.relationship.union ? (whereInput || {})[relatedNode.name] : whereInput || {};
    if (unionInterfaceWhere) {
        const relationship = context.relationships.find((r) => r.name === field.relationshipTypeName) as Relationship;

        if (
            !hasExplicitNodeInInterfaceWhere({
                whereInput: unionInterfaceWhere,
                node: relatedNode,
            })
        ) {
            return undefined;
        }
        const wherePredicate = createConnectionWherePropertyOperation({
            context,
            whereInput: unionInterfaceWhere,
            edgeRef: relationshipRef,
            targetNode: relatedNodeVariable,
            node: relatedNode,
            edge: relationship,
        });

        if (wherePredicate) matchClause.where(wherePredicate);
    }
    const authPredicate = createAuthPredicates({
        operations: "READ",
        entity: relatedNode,
        context,
        where: { varName: relatedNodeVariable, node: relatedNode },
    });
    if (authPredicate) {
        matchClause.where(authPredicate);
    }

    // TODO: Handle projection.subqueries
    const projection = getEdgeProjection({
        resolveTree,
        field,
        relationshipRef,
        relatedNode,
        relatedNodeVariableName: relatedNodeVarName,
        context,
        resolveType: true,
        extraFields: Object.keys(getSortFields(resolveTree).edge),
    });

    matchClause.return([projection.projection, returnVariable]);

    return CypherBuilder.concat(withClause, matchClause);
}

export function createConnectionClause({
    resolveTree,
    field,
    context,
    nodeVariable,
}: {
    resolveTree: ResolveTree;
    field: ConnectionField;
    context: Context;
    nodeVariable: string;
}): CypherBuilder.Clause {
    const whereInput = resolveTree.args.where as ConnectionWhereArg;

    const relatedNode = context.nodes.find((x) => x.name === field.relationship.typeMeta.name) as Node;
    if (field.relationship.union || field.relationship.interface) {
        const relatedNodes = field.relationship.union
            ? context.nodes.filter((n) => field.relationship.union?.nodes?.includes(n.name))
            : context.nodes.filter((x) => field.relationship?.interface?.implementations?.includes(x.name));

        const collectUnionVariable = new CypherBuilder.NamedNode("edge");
        const subqueries = relatedNodes.map((subqueryRelatedNode) => {
            if (
                whereInput &&
                !Object.prototype.hasOwnProperty.call(whereInput, subqueryRelatedNode.name) && // Filter interfaces when a "where" does not match
                !(
                    field.relationship.interface &&
                    !field.relationship.interface?.implementations?.some((i) =>
                        Object.prototype.hasOwnProperty.call(whereInput, i)
                    )
                )
            ) {
                return undefined;
            }
            return createConnectionSubquery({
                resolveTree,
                field,
                context,
                parentNode: nodeVariable,
                returnVariable: collectUnionVariable,
                relatedNode: subqueryRelatedNode,
            });
        });

        const unionClauses = new CypherBuilder.Call(new CypherBuilder.Union(...filterTruthy(subqueries)));

        const edgesList = new CypherBuilder.NamedVariable("edges");
        const edgeItem = new CypherBuilder.NamedVariable("edge");
        const totalCount = new CypherBuilder.NamedVariable("totalCount");

        const withEdgesAndTotalCount = new CypherBuilder.With([
            CypherBuilder.collect(collectUnionVariable),
            edgesList,
        ]).with(edgesList, [CypherBuilder.size(edgesList), totalCount]);

        let withOrderClause: CypherBuilder.Clause | undefined;
        const limit = relatedNode?.queryOptions?.getLimit();
        const withOrder = getSortAndLimitProjectionAfterUnion({
            resolveTree,
            relationshipRef: edgeItem,
            limit,
        });
        if (withOrder) {
            const unwind = new CypherBuilder.Unwind([edgesList, edgeItem]);

            const withAndCollectEdges = new CypherBuilder.With(
                [CypherBuilder.collect(edgeItem), edgesList],
                totalCount
            );
            withOrderClause = CypherBuilder.concat(unwind, withOrder, withAndCollectEdges);
        }

        const returnClause = new CypherBuilder.Return([
            new CypherBuilder.Map({
                edges: edgesList,
                totalCount,
            }),
            resolveTree.alias,
        ]);

        return CypherBuilder.concat(unionClauses, withEdgesAndTotalCount, withOrderClause, returnClause);
    }

    const relatedNodeVariableName = `${nodeVariable}_${relatedNode.name}`;
    const relatedNodeVariable = new CypherBuilder.NamedNode(relatedNodeVariableName, {
        labels: relatedNode.getLabels(context),
    });
    const relationship = context.relationships.find((r) => r.name === field.relationshipTypeName) as Relationship;
    const nodeRef = getOrCreateCypherNode(nodeVariable);
    const relationshipRef = new CypherBuilder.Relationship({
        source: nodeRef,
        target: relatedNodeVariable,
        type: field.relationship.type,
    });

    const direction = getRelationshipDirection(field.relationship, resolveTree.args);

    const relPattern = relationshipRef.pattern({
        directed: direction !== "undirected",
    });
    if (direction === "IN") relPattern.reverse();

    const matchClause = new CypherBuilder.Match(relPattern);
    const withSortClause = getSortAndLimitProjection({
        resolveTree,
        relationshipRef,
        nodeRef: relatedNodeVariable,
        limit: undefined, // we ignore limit here to avoid breaking totalCount
        ignoreSkipLimit: true,
        extraFields: [relatedNodeVariable],
    });

    if (whereInput) {
        const wherePredicate = createConnectionWherePropertyOperation({
            context,
            whereInput,
            edgeRef: relationshipRef,
            targetNode: relatedNodeVariable,
            node: relatedNode,
            edge: relationship,
        });

        if (wherePredicate) matchClause.where(wherePredicate);
    }

    const authAllowPredicate = createAuthPredicates({
        operations: "READ",
        entity: relatedNode,
        context,
        allow: {
            parentNode: relatedNode,
            varName: relatedNodeVariable,
        },
    });

    const whereAuthPredicate = createAuthPredicates({
        operations: "READ",
        entity: relatedNode,
        context,
        where: { varName: relatedNodeVariable, node: relatedNode },
    });

    if (authAllowPredicate) {
        matchClause.where(
            new CypherBuilder.apoc.ValidatePredicate(CypherBuilder.not(authAllowPredicate), AUTH_FORBIDDEN_ERROR)
        );
    }

    if (whereAuthPredicate) {
        matchClause.where(whereAuthPredicate);
    }

    const edgeProjection = getEdgeProjection({
        resolveTree,
        field,
        relationshipRef,
        relatedNode,
        relatedNodeVariableName,
        context,
    });

    const edgesList = new CypherBuilder.NamedVariable("edges");
    const edgeItem = new CypherBuilder.NamedVariable("edge");
    const totalCountItem = new CypherBuilder.NamedVariable("totalCount");
    const projectionSubqueries = CypherBuilder.concat(...edgeProjection.subqueries);
    const withClause = new CypherBuilder.With([CypherBuilder.collect(edgeProjection.projection), edgesList]).with(
        edgesList,
        [CypherBuilder.size(edgesList), totalCountItem]
    );

    const totalCount = new CypherBuilder.NamedVariable("totalCount");

    const withSortAfterUnwindClause = getSortAndLimitProjection({
        resolveTree,
        relationshipRef: new CypherBuilder.NamedVariable("edge"),
        nodeRef: new CypherBuilder.NamedNode("edge.node"),
        limit: relatedNode?.queryOptions?.getLimit(),
        extraFields: [totalCountItem],
    });

    let unwindSortClause: CypherBuilder.Clause | undefined;
    if (withSortAfterUnwindClause) {
        const unwind = new CypherBuilder.Unwind([edgesList, edgeItem]);

        const collectEdges = new CypherBuilder.With([CypherBuilder.collect(edgeItem), edgesList], totalCountItem);

        unwindSortClause = CypherBuilder.concat(unwind, withSortAfterUnwindClause, collectEdges);
    }

    const returnClause = new CypherBuilder.Return([
        new CypherBuilder.Map({
            edges: edgesList,
            totalCount,
        }),
        resolveTree.alias,
    ]);
    return CypherBuilder.concat(
        matchClause,
        withSortClause,
        projectionSubqueries,
        withClause,
        unwindSortClause,
        returnClause
    );
}

function getEdgeProjection({
    resolveTree,
    field,
    relationshipRef,
    relatedNodeVariableName,
    context,
    relatedNode,
    resolveType,
    extraFields = [],
}: {
    resolveTree: ResolveTree;
    field: ConnectionField;
    relationshipRef: CypherBuilder.Relationship;
    relatedNodeVariableName: string;
    context: Context;
    relatedNode: Node;
    resolveType?: boolean;
    extraFields?: Array<string>;
}): { projection: CypherBuilder.Map; subqueries: CypherBuilder.Clause[] } {
    const connection = resolveTree.fieldsByTypeName[field.typeMeta.name];

    const edgeProjectionProperties = new CypherBuilder.Map();
    const subqueries: CypherBuilder.Clause[] = [];
    if (connection.edges) {
        const relationship = context.relationships.find((r) => r.name === field.relationshipTypeName) as Relationship;
        const relationshipFieldsByTypeName = connection.edges.fieldsByTypeName[field.relationshipTypeName];
        const relationshipProperties = Object.values(relationshipFieldsByTypeName).filter((v) => v.name !== "node");
        if (relationshipProperties.length || extraFields.length) {
            const relationshipPropertyEntries = relationshipProperties.filter((p) => p.name !== "cursor");

            for (const property of relationshipPropertyEntries) {
                const prop = createRelationshipPropertyValue({
                    resolveTree: property,
                    relationship,
                    relationshipVariable: relationshipRef,
                });

                edgeProjectionProperties.set(property.alias, prop);
            }

            for (const extraField of extraFields) {
                const prop = relationshipRef.property(extraField);
                edgeProjectionProperties.set(extraField, prop);
            }
        }

        const nodeField = Object.values(relationshipFieldsByTypeName).find((v) => v.name === "node");
        if (nodeField) {
            const nodeProjection = getConnectionNodeProjection({
                nodeResolveTree: nodeField as ResolveTree,
                context,
                node: relatedNode,
                resolveTree,
                nodeRefVarName: relatedNodeVariableName,
                resolveType,
            });
            const alias = nodeField.alias;
            edgeProjectionProperties.set(alias, nodeProjection.projection);
            subqueries.push(...nodeProjection.subqueries);
        }
    } else {
        // This ensures that totalCount calculation is accurate if edges are not asked for

        return {
            projection: new CypherBuilder.Map({
                node: new CypherBuilder.Map({ __resolveType: new CypherBuilder.Literal(relatedNode.name) }),
            }),
            subqueries,
        };
    }

    return { projection: edgeProjectionProperties, subqueries };
}

function getConnectionNodeProjection({
    nodeResolveTree,
    nodeRefVarName,
    context,
    node,
    resolveType = false,
    resolveTree,
}: {
    nodeResolveTree: ResolveTree;
    context;
    nodeRefVarName: string;
    node: Node;
    resolveType?: boolean;
    resolveTree: ResolveTree; // Global resolve tree
}): { projection: CypherBuilder.Expr; subqueries: CypherBuilder.Clause[] } {
    const selectedFields: Record<string, ResolveTree> = mergeDeep([
        nodeResolveTree.fieldsByTypeName[node.name],
        ...node.interfaces.map((i) => nodeResolveTree?.fieldsByTypeName[i.name.value]),
    ]);

    const sortInput = (resolveTree.args.sort ?? []) as ConnectionSortArg[];
    const nodeSortFields = sortInput.map(({ node: n = {} }) => Object.keys(n)).flat();
    const mergedResolveTree: ResolveTree = mergeDeep<ResolveTree[]>([
        nodeResolveTree,
        {
            ...nodeResolveTree,
            fieldsByTypeName: {
                [node.name]: generateMissingOrAliasedFields({
                    fieldNames: nodeSortFields,
                    selection: selectedFields,
                }),
            },
        },
    ]);

    const nodeProjectionAndParams = createProjectionAndParams({
        resolveTree: mergedResolveTree,
        node,
        context,
        varName: nodeRefVarName,
        literalElements: true,
        resolveType,
    });

    const projectionMeta = nodeProjectionAndParams.meta;
    const projectionSubqueries = nodeProjectionAndParams.subqueries;

    if (projectionMeta?.authValidateStrs?.length) {
        const authStrs = projectionMeta.authValidateStrs;
        const projectionAuth = new CypherBuilder.RawCypher(() => {
            return `CALL apoc.util.validate(NOT (${authStrs.join(" AND ")}), "${AUTH_FORBIDDEN_ERROR}", [0])`;
        });
        projectionSubqueries.push(projectionAuth);
    }
    return {
        subqueries: projectionSubqueries,
        projection: new CypherBuilder.RawCypher((env) => {
            return [`${nodeProjectionAndParams.projection}`, nodeProjectionAndParams.params];
        }),
    };
}

function getSortAndLimitProjection({
    resolveTree,
    relationshipRef,
    nodeRef,
    limit,
    extraFields = [],
    ignoreSkipLimit = false,
}: {
    resolveTree: ResolveTree;
    relationshipRef: CypherBuilder.Relationship | CypherBuilder.Variable;
    nodeRef: CypherBuilder.Node | CypherBuilder.Variable;
    limit: Integer | number | undefined;
    extraFields?: CypherBuilder.Variable[];
    ignoreSkipLimit?: boolean;
}): CypherBuilder.With | undefined {
    const { node: nodeSortFields, edge: edgeSortFields } = getSortFields(resolveTree);

    if (Object.keys(edgeSortFields).length === 0 && Object.keys(nodeSortFields).length === 0 && !limit)
        return undefined;

    const withStatement = new CypherBuilder.With(relationshipRef, ...extraFields);

    let firstArg = resolveTree.args.first as Integer | number | undefined;
    const afterArg = resolveTree.args.after as string | undefined;
    let offset = isString(afterArg) ? cursorToOffset(afterArg) + 1 : undefined;

    if (limit) {
        const limitValue = isNeoInt(limit) ? limit.toNumber() : limit;
        if (!firstArg || limitValue < toNumber(firstArg)) {
            firstArg = limitValue;
        }
    }
    if (ignoreSkipLimit) {
        offset = undefined;
        firstArg = undefined;
    }
    addSortAndLimitOptionsToClause({
        optionsInput: { sort: [edgeSortFields], limit: firstArg, offset },
        target: relationshipRef,
        projectionClause: withStatement,
    });

    addSortAndLimitOptionsToClause({
        optionsInput: { sort: [nodeSortFields] },
        target: nodeRef,
        projectionClause: withStatement,
    });

    return withStatement;
}

// TODO: avoid duplicate code here
function getSortAndLimitProjectionAfterUnion({
    resolveTree,
    relationshipRef,
    limit,
}: {
    resolveTree: ResolveTree;
    relationshipRef: CypherBuilder.Relationship | CypherBuilder.Variable;
    limit: number | Integer | undefined;
}): CypherBuilder.With | undefined {
    const { node: nodeSortFields, edge: edgeSortFields } = getSortFields(resolveTree);

    if (Object.keys(edgeSortFields).length === 0 && Object.keys(nodeSortFields).length === 0 && !limit)
        return undefined;

    const withStatement = new CypherBuilder.With(relationshipRef, new CypherBuilder.NamedVariable("totalCount"));

    let firstArg = resolveTree.args.first as Integer | number | undefined;
    const afterArg = resolveTree.args.after as string | undefined;
    const offset = isString(afterArg) ? cursorToOffset(afterArg) + 1 : undefined;

    if (limit) {
        const limitValue = isNeoInt(limit) ? limit.toNumber() : limit;
        if (!firstArg || limitValue < toNumber(firstArg)) {
            firstArg = limitValue;
        }
    }

    addSortAndLimitOptionsToClause({
        optionsInput: { sort: [edgeSortFields], limit: firstArg, offset },
        target: relationshipRef,
        projectionClause: withStatement,
    });

    addSortAndLimitOptionsToClause({
        optionsInput: { sort: [nodeSortFields] },
        target: relationshipRef.property("node"),
        projectionClause: withStatement,
    });

    return withStatement;
}

function getSortFields(resolveTree: ResolveTree) {
    const sortInput = (resolveTree.args.sort ?? []) as ConnectionSortArg[];
    // Fields of {edge, node} to sort on. A simple resolve tree will be added if not in selection set
    // Since nodes of abstract types and edges are constructed sort will not work if field is not in selection set
    // const edgeSortFields = sortInput.map(({ edge = {} }) => Object.keys(edge)).flat();
    return {
        edge: getSortFieldsByElement(sortInput, "edge"),
        node: getSortFieldsByElement(sortInput, "node"),
    };
}

function getSortFieldsByElement(sortInput: ConnectionSortArg[], element: "node" | "edge"): GraphQLSortArg {
    return sortInput.reduce((acc, f) => {
        return { ...acc, ...(f[element] || {}) };
    }, {} as GraphQLSortArg);
}
