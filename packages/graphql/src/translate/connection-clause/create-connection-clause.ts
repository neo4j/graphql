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
import Cypher from "@neo4j/cypher-builder";
import type { ConnectionField, ConnectionWhereArg, CypherFieldReferenceMap } from "../../types";
import type { Node } from "../../classes";
import { filterTruthy } from "../../utils/utils";
import { hasExplicitNodeInInterfaceWhere } from "../where/property-operations/create-connection-operation";
import { getOrCreateCypherNode } from "../utils/get-or-create-cypher-variable";
import { createSortAndLimitProjection } from "./create-sort-and-limit";
import { createEdgeSubquery } from "./create-edge-subquery";
import { checkAuthentication } from "../authorization/check-authentication";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";

export function createConnectionClause({
    resolveTree,
    field,
    context,
    nodeVariable,
    returnVariable,
    cypherFieldAliasMap,
}: {
    resolveTree: ResolveTree;
    field: ConnectionField;
    context: Neo4jGraphQLTranslationContext;
    nodeVariable: Cypher.Node;
    returnVariable: Cypher.Variable;
    cypherFieldAliasMap: CypherFieldReferenceMap;
}): Cypher.Clause {
    if (field.relationship.union || field.relationship.interface) {
        return createConnectionClauseForUnions({
            resolveTree,
            field,
            context,
            nodeVariable,
            returnVariable,
            cypherFieldAliasMap,
        });
    }

    const whereInput = resolveTree.args.where as ConnectionWhereArg;
    const firstArg = resolveTree.args.first as Integer | number | undefined;
    const relatedNode = context.nodes.find((x) => x.name === field.relationship.typeMeta.name) as Node;

    checkAuthentication({ context, node: relatedNode, targetOperations: ["READ"] });

    const edgeItem = new Cypher.NamedVariable("edge");
    const edgeSubquery = createEdgeSubquery({
        resolveTree,
        field,
        context,
        parentNode: nodeVariable,
        relatedNode,
        returnVariable: edgeItem,
        whereInput,
        cypherFieldAliasMap,
    });
    const edgesList = new Cypher.NamedVariable("edges");
    const totalCount = new Cypher.NamedVariable("totalCount");
    const withClause = new Cypher.With([Cypher.collect(edgeItem), edgesList]).with(edgesList, [
        Cypher.size(edgesList),
        totalCount,
    ]);

    // `first` specified on connection field in query needs to be compared with existing `@queryOptions`-imposed limit
    const relatedFirstArg = relatedNode.queryOptions ? relatedNode.queryOptions.getLimit(firstArg) : firstArg;
    const withSortAfterUnwindClause = createSortAndLimitProjection({
        resolveTree,
        relationshipRef: edgeItem,
        nodeRef: edgeItem.property("node"),
        limit: relatedFirstArg,
    });

    let unwindSortClause: Cypher.Clause | undefined;
    if (withSortAfterUnwindClause) {
        const sortedEdges = new Cypher.Variable();
        const unwind = new Cypher.Unwind([edgesList, edgeItem]);

        const collectEdges = new Cypher.Return([Cypher.collect(edgeItem), sortedEdges]);

        // This subquery (CALL) is required due to the edge case of having cardinality 0 in the Cypher Match
        unwindSortClause = new Cypher.Call(Cypher.concat(unwind, withSortAfterUnwindClause, collectEdges))
            .innerWith(edgesList)
            .with([sortedEdges, edgesList], totalCount);
    }

    const returnClause = new Cypher.Return([
        new Cypher.Map({
            edges: edgesList,
            totalCount,
        }),
        returnVariable,
    ]);
    return Cypher.concat(edgeSubquery, withClause, unwindSortClause, returnClause);
}

function createConnectionClauseForUnions({
    resolveTree,
    field,
    context,
    nodeVariable,
    returnVariable,
    cypherFieldAliasMap,
}: {
    resolveTree: ResolveTree;
    field: ConnectionField;
    context: Neo4jGraphQLTranslationContext;
    nodeVariable: Cypher.Node;
    returnVariable: Cypher.Variable;
    cypherFieldAliasMap: CypherFieldReferenceMap;
}) {
    const whereInput = resolveTree.args.where as ConnectionWhereArg;
    const relatedNode = context.nodes.find((x) => x.name === field.relationship.typeMeta.name) as Node;
    const relatedNodes = field.relationship.union
        ? context.nodes.filter((n) => field.relationship.union?.nodes?.includes(n.name))
        : context.nodes.filter((x) => field.relationship?.interface?.implementations?.includes(x.name));

    const collectUnionVariable = new Cypher.NamedNode("edge");
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
            cypherFieldAliasMap,
        });
    });

    const unionClauses = new Cypher.Call(new Cypher.Union(...filterTruthy(subqueries)));

    const edgesList = new Cypher.NamedVariable("edges");
    const edgeItem = new Cypher.NamedVariable("edge");
    const totalCount = new Cypher.NamedVariable("totalCount");

    const withEdgesAndTotalCount = new Cypher.With([Cypher.collect(collectUnionVariable), edgesList]).with(edgesList, [
        Cypher.size(edgesList),
        totalCount,
    ]);

    let withOrderClause: Cypher.Clause | undefined;
    const limit = relatedNode?.queryOptions?.getLimit();
    const withOrder = createSortAndLimitProjection({
        resolveTree,
        relationshipRef: edgeItem,
        nodeRef: edgeItem.property("node"),
        limit,
        extraFields: [totalCount],
    });
    if (withOrder) {
        const unwind = new Cypher.Unwind([edgesList, edgeItem]);

        const withAndCollectEdges = new Cypher.With([Cypher.collect(edgeItem), edgesList], totalCount);
        withOrderClause = Cypher.concat(unwind, withOrder, withAndCollectEdges);
    }

    const returnClause = new Cypher.Return([
        new Cypher.Map({
            edges: edgesList,
            totalCount,
        }),
        returnVariable,
    ]);

    return Cypher.concat(unionClauses, withEdgesAndTotalCount, withOrderClause, returnClause);
}

function createConnectionSubquery({
    resolveTree,
    field,
    context,
    parentNode,
    relatedNode,
    returnVariable,
    cypherFieldAliasMap,
}: {
    resolveTree: ResolveTree;
    field: ConnectionField;
    context: Neo4jGraphQLTranslationContext;
    parentNode: Cypher.Node;
    relatedNode: Node;
    returnVariable: Cypher.Variable;
    cypherFieldAliasMap: CypherFieldReferenceMap;
}): Cypher.Clause | undefined {
    const parentNodeRef = getOrCreateCypherNode(parentNode);
    const withClause = new Cypher.With(parentNodeRef);
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
        cypherFieldAliasMap,
    });
    if (!edgeSubquery) return undefined;
    const returnClause = new Cypher.Return(returnVariable);
    return Cypher.concat(withClause, edgeSubquery, returnClause);
}
