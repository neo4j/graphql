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
import { createNodeFromEntity } from "../../../utils/create-node-from-entity";
import { ConnectionReadOperation } from "../ConnectionReadOperation";
import type { OperationTranspileOptions, OperationTranspileResult } from "../operations";
import type { Sort } from "../../sort/Sort";
import type { Pagination } from "../../pagination/Pagination";

export class CompositeConnectionPartial extends ConnectionReadOperation {
    public transpile({ context }: OperationTranspileOptions): OperationTranspileResult {
        if (!context.target) throw new Error();
        const node = createNodeFromEntity(this.target, context.neo4jGraphQLContext);
        const relationship = new Cypher.Relationship({ type: this.relationship.type });
        const relDirection = this.relationship.getCypherDirection(this.directed);

        const pattern = new Cypher.Pattern(context.target)
            .withoutLabels()
            .related(relationship)
            .withDirection(relDirection)
            .to(node);

        const nestedContext = context.push({ target: node, relationship });
        const { preSelection, selectionClause: clause } = this.getSelectionClauses(nestedContext, pattern);

        const predicates = this.filters.map((f) => f.getPredicate(nestedContext));

        const authPredicate = this.getAuthFilterPredicate(nestedContext);

        const authFilterSubqueries = this.getAuthFilterSubqueries(nestedContext);

        const filters = Cypher.and(...predicates, ...authPredicate);

        const nodeProjectionSubqueries = this.nodeFields
            .flatMap((f) => f.getSubqueries(nestedContext))
            .map((sq) => new Cypher.Call(sq).innerWith(node));

        const nodeProjectionMap = new Cypher.Map();

        // This bit is different than normal connection ops
        const targetNodeName = this.target.name;
        nodeProjectionMap.set({
            __resolveType: new Cypher.Literal(targetNodeName),
            __id: Cypher.id(node),
        });

        const nodeProjectionFields = this.nodeFields.map((f) => f.getProjectionField(node));
        const nodeSortProjectionFields = this.sortFields.flatMap((f) =>
            f.node.map((ef) => ef.getProjectionField(nestedContext))
        );

        const uniqueNodeProjectionFields = Array.from(new Set([...nodeProjectionFields, ...nodeSortProjectionFields]));

        uniqueNodeProjectionFields.forEach((p) => {
            if (typeof p === "string") {
                nodeProjectionMap.set(p, node.property(p));
            } else {
                nodeProjectionMap.set(p);
            }
        });

        const edgeVar = new Cypher.NamedVariable("edge");

        const edgeProjectionMap = new Cypher.Map();

        const edgeProjectionFields = this.edgeFields.map((f) => f.getProjectionField(relationship));
        const edgeSortProjectionFields = this.sortFields.flatMap((f) =>
            f.edge.map((ef) => ef.getProjectionField(nestedContext))
        );

        const uniqueEdgeProjectionFields = Array.from(new Set([...edgeProjectionFields, ...edgeSortProjectionFields]));

        uniqueEdgeProjectionFields.forEach((p) => {
            if (typeof p === "string") {
                edgeProjectionMap.set(p, relationship.property(p));
            } else {
                edgeProjectionMap.set(p);
            }
        });

        edgeProjectionMap.set("node", nodeProjectionMap);

        let withWhere: Cypher.Clause | undefined;
        if (filters) {
            if (authFilterSubqueries.length > 0) {
                // This is to avoid unnecessary With *
                withWhere = new Cypher.With("*").where(filters);
            } else {
                clause.where(filters);
            }
        }

        const projectionClauses = new Cypher.With([edgeProjectionMap, edgeVar]).return(context.returnVariable);

        const subClause = Cypher.concat(
            ...preSelection,
            clause,
            ...authFilterSubqueries,
            withWhere,
            ...nodeProjectionSubqueries,
            projectionClauses
        );

        return {
            clauses: [subClause],
            projectionExpr: context.returnVariable,
        };
    }

    // Sort is handled by CompositeConnectionReadOperation
    public addSort(sortElement: { node: Sort[]; edge: Sort[] }): void {
        this.sortFields.push(sortElement);
    }

    // Pagination is handled by CompositeConnectionReadOperation
    public addPagination(_pagination: Pagination): void {
        return undefined;
    }
}
