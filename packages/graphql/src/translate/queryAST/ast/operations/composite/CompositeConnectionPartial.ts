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
import { wrapSubqueriesInCypherCalls } from "../../../utils/wrap-subquery-in-calls";
import type { QueryASTContext } from "../../QueryASTContext";
import type { Pagination } from "../../pagination/Pagination";
import { ConnectionReadOperation } from "../ConnectionReadOperation";
import type { OperationTranspileResult } from "../operations";

export class CompositeConnectionPartial extends ConnectionReadOperation {
    public transpile(context: QueryASTContext): OperationTranspileResult {
        // eslint-disable-next-line prefer-const
        let { selection: clause, nestedContext } = this.selection.apply(context);

        let extraMatches: Array<Cypher.Match | Cypher.With | Cypher.Yield> = this.getChildren().flatMap((f) => {
            return f.getSelection(nestedContext);
        });

        const filterSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.filters, [nestedContext.target]);

        if (extraMatches.length > 0 || filterSubqueries.length > 0) {
            extraMatches = [clause, ...extraMatches];
            clause = new Cypher.With("*");
        }

        const predicates = this.filters.map((f) => f.getPredicate(nestedContext));

        const authPredicate = this.getAuthFilterPredicate(nestedContext);

        const authFilterSubqueries = this.getAuthFilterSubqueries(nestedContext);

        const filters = Cypher.and(...predicates, ...authPredicate);

        const nodeProjectionSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.nodeFields, [
            nestedContext.target,
        ]);
        const nodeProjectionMap = new Cypher.Map();

        // This bit is different than normal connection ops
        const targetNodeName = this.target.name;
        nodeProjectionMap.set({
            __resolveType: new Cypher.Literal(targetNodeName),
            __id: Cypher.id(nestedContext.target),
        });

        const nodeProjectionFields = this.nodeFields.map((f) => f.getProjectionField(nestedContext.target));
        const nodeSortProjectionFields = this.sortFields.flatMap((f) =>
            f.node.map((ef) => ef.getProjectionField(nestedContext))
        );

        const uniqueNodeProjectionFields = Array.from(new Set([...nodeProjectionFields, ...nodeSortProjectionFields]));

        uniqueNodeProjectionFields.forEach((p) => {
            if (typeof p === "string") {
                nodeProjectionMap.set(p, nestedContext.target.property(p));
            } else {
                nodeProjectionMap.set(p);
            }
        });

        const edgeVar = new Cypher.NamedVariable("edge");

        const edgeProjectionMap = new Cypher.Map();

        const edgeProjectionFields = this.edgeFields.map((f) => f.getProjectionField(nestedContext.relationship!));
        const edgeSortProjectionFields = this.sortFields.flatMap((f) =>
            f.edge.map((ef) => ef.getProjectionField(nestedContext))
        );

        const uniqueEdgeProjectionFields = Array.from(new Set([...edgeProjectionFields, ...edgeSortProjectionFields]));

        const propertiesProjectionMap = new Cypher.Map();
        uniqueEdgeProjectionFields.forEach((p) => {
            if (typeof p === "string") {
                propertiesProjectionMap.set(p, nestedContext.relationship!.property(p));
            } else {
                propertiesProjectionMap.set(p);
            }
        });

        if (propertiesProjectionMap.size) {
            if (this.relationship?.propertiesTypeName) {
                // should be true if getting here but just in case..
                propertiesProjectionMap.set("__resolveType", new Cypher.Literal(this.relationship.propertiesTypeName));
            }
            edgeProjectionMap.set("properties", propertiesProjectionMap);
        }
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
            // ...preSelection,
            ...extraMatches,
            ...filterSubqueries,
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

    // Pagination is handled by CompositeConnectionReadOperation
    public addPagination(_pagination: Pagination): void {
        return undefined;
    }
}
