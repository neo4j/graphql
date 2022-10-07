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

import type { Integer } from "neo4j-driver";
import type { ResolveTree } from "graphql-parse-resolve-info";
import type { ConnectionField, ConnectionWhereArg, Context } from "../../types";
import type { Node } from "../../classes";
import { filterTruthy } from "../../utils/utils";
import * as CypherBuilder from "../cypher-builder/CypherBuilder";
import { hasExplicitNodeInInterfaceWhere } from "../where/property-operations/create-connection-operation";
import { getOrCreateCypherNode } from "../utils/get-or-create-cypher-variable";
import { createSortAndLimitProjection } from "./create-sort-and-limit";

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
    const firstArg = resolveTree.args.first as Integer | number | undefined;
    const relatedNode = context.nodes.find((x) => x.name === field.relationship.typeMeta.name) as Node;
    const edgeItem = new CypherBuilder.NamedVariable("edge");

    const edgeSubquery = createEdgeSubquery({
        resolveTree,
        field,
        context,
        parentNode: nodeVariable,
        relatedNode,
        returnVariable: edgeItem,
        whereInput,
    });

    const edgesList = new CypherBuilder.NamedVariable("edges");
    const totalCountItem = new CypherBuilder.NamedVariable("totalCount");
    const withClause = new CypherBuilder.With([CypherBuilder.collect(edgeItem), edgesList]).with(edgesList, [
        CypherBuilder.size(edgesList),
        totalCountItem,
    ]);

    const totalCount = new CypherBuilder.NamedVariable("totalCount");
    const withSortAfterUnwindClause = createSortAndLimitProjection({
        resolveTree,
        relationshipRef: edgeItem,
        nodeRef: edgeItem.property("node"),
        limit: relatedNode?.queryOptions?.getLimit(firstArg), // `first` specified on connection field in query needs to be compared with existing `@queryOptions`-imposed limit
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
    return CypherBuilder.concat(edgeSubquery, withClause, unwindSortClause, returnClause);
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
        resolveType: true,
        ignoreSort: true,
    });
    if (!edgeSubquery) return undefined;
    const returnClause = new CypherBuilder.Return(returnVariable);
    return CypherBuilder.concat(withClause, edgeSubquery, returnClause);
}
