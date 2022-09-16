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
import type { ConnectionField, ConnectionWhereArg, Context } from "../../types";
import type { Node } from "../../classes";
import type Relationship from "../../classes/Relationship";
import { createAuthPredicates } from "../create-auth-and-params";
import { AUTH_FORBIDDEN_ERROR } from "../../constants";
import { filterTruthy } from "../../utils/utils";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import {
    createConnectionWherePropertyOperation,
    hasExplicitNodeInInterfaceWhere,
} from "../where/property-operations/create-connection-operation";
import { getOrCreateCypherNode } from "../utils/get-or-create-cypher-variable";
import { getPattern } from "../utils/get-pattern";
// eslint-disable-next-line import/no-cycle
import { createEdgeProjection } from "./connection-projection";
import { createSortAndLimitProjection } from "./create-sort-and-limit";
import { getSortFields } from "./get-sort-fields";
import { createEdgeSubquery } from "./create-edge-subquery";

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
    if (field.relationship.union || field.relationship.interface) {
        return createConnectionClauseForUnions({
            resolveTree,
            field,
            context,
            nodeVariable,
        });
    }

    const whereInput = resolveTree.args.where as ConnectionWhereArg;
    const relatedNode = context.nodes.find((x) => x.name === field.relationship.typeMeta.name) as Node;
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
    const relPattern = getPattern({
        relationship: relationshipRef,
        field: field.relationship,
        resolveTree,
    });

    const matchClause = new CypherBuilder.Match(relPattern);

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

    const withSortClause = createSortAndLimitProjection({
        resolveTree,
        relationshipRef,
        nodeRef: relatedNodeVariable,
        limit: undefined, // we ignore limit here to avoid breaking totalCount
        ignoreSkipLimit: true,
        extraFields: [relatedNodeVariable],
    });

    const edgeProjection = createEdgeProjection({
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

    const withSortAfterUnwindClause = createSortAndLimitProjection({
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

function createConnectionClauseForUnions({
    resolveTree,
    field,
    context,
    nodeVariable,
}: {
    resolveTree: ResolveTree;
    field: ConnectionField;
    context: Context;
    nodeVariable: string;
}) {
    const whereInput = resolveTree.args.where as ConnectionWhereArg;
    const relatedNode = context.nodes.find((x) => x.name === field.relationship.typeMeta.name) as Node;
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

    const withOrder = createSortAndLimitProjection({
        resolveTree,
        relationshipRef: edgeItem,
        nodeRef: edgeItem.property("node"),
        limit,
        extraFields: [totalCount],
    });
    if (withOrder) {
        const unwind = new CypherBuilder.Unwind([edgesList, edgeItem]);

        const withAndCollectEdges = new CypherBuilder.With([CypherBuilder.collect(edgeItem), edgesList], totalCount);
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
    const parentNodeRef = getOrCreateCypherNode(parentNode);
    const withClause = new CypherBuilder.With(parentNodeRef);
    const whereInput = resolveTree.args.where as ConnectionWhereArg;

    const unionInterfaceWhere = field.relationship.union ? (whereInput || {})[relatedNode.name] : whereInput || {};
    if (unionInterfaceWhere) {
        if (
            !hasExplicitNodeInInterfaceWhere({
                whereInput: unionInterfaceWhere,
                node: relatedNode,
            })
        ) {
            return undefined;
        }
    }
    const edgeSubquery = createEdgeSubquery({
        resolveTree,
        field,
        context,
        parentNode,
        relatedNode,
        returnVariable,
        whereInput: unionInterfaceWhere,
    });
    if (!edgeSubquery) return undefined;
    return CypherBuilder.concat(withClause, edgeSubquery);
    // const nodeRef = getOrCreateCypherNode(parentNode);
    // const whereInput = resolveTree.args.where as ConnectionWhereArg;

    // const relatedNodeVarName = `${parentNode}_${relatedNode.name}`;
    // const relatedNodeVariable = new CypherBuilder.NamedNode(relatedNodeVarName, {
    //     labels: relatedNode.getLabels(context),
    // });

    // const relationshipRef = new CypherBuilder.Relationship({
    //     source: nodeRef,
    //     target: relatedNodeVariable,
    //     type: field.relationship.type,
    // });

    // const relPattern = getPattern({
    //     relationship: relationshipRef,
    //     field: field.relationship,
    //     resolveTree,
    // });

    // const withClause = new CypherBuilder.With(nodeRef);
    // const matchClause = new CypherBuilder.Match(relPattern);
    // const unionInterfaceWhere = field.relationship.union ? (whereInput || {})[relatedNode.name] : whereInput || {};
    // if (unionInterfaceWhere) {
    //     const relationship = context.relationships.find((r) => r.name === field.relationshipTypeName) as Relationship;

    //     if (
    //         !hasExplicitNodeInInterfaceWhere({
    //             whereInput: unionInterfaceWhere,
    //             node: relatedNode,
    //         })
    //     ) {
    //         return undefined;
    //     }
    //     const wherePredicate = createConnectionWherePropertyOperation({
    //         context,
    //         whereInput: unionInterfaceWhere,
    //         edgeRef: relationshipRef,
    //         targetNode: relatedNodeVariable,
    //         node: relatedNode,
    //         edge: relationship,
    //     });

    //     if (wherePredicate) matchClause.where(wherePredicate);
    // }
    // const authPredicate = createAuthPredicates({
    //     operations: "READ",
    //     entity: relatedNode,
    //     context,
    //     where: { varName: relatedNodeVariable, node: relatedNode },
    // });
    // if (authPredicate) {
    //     matchClause.where(authPredicate);
    // }

    // // TODO: Handle projection.subqueries
    // const projection = createEdgeProjection({
    //     resolveTree,
    //     field,
    //     relationshipRef,
    //     relatedNode,
    //     relatedNodeVariableName: relatedNodeVarName,
    //     context,
    //     resolveType: true,
    //     extraFields: Object.keys(getSortFields(resolveTree).edge),
    // });

    // matchClause.return([projection.projection, returnVariable]);

    // return CypherBuilder.concat(withClause, matchClause);
}
