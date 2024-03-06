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
import type { OperationTranspileResult } from "../operations";
import { Operation } from "../operations";

import { filterTruthy } from "../../../../../utils/utils";
import { hasTarget } from "../../../utils/context-has-target";
import { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { Pagination } from "../../pagination/Pagination";
import type { Sort, SortField } from "../../sort/Sort";
import type { CompositeConnectionPartial } from "./CompositeConnectionPartial";

export class CompositeConnectionReadOperation extends Operation {
    private children: CompositeConnectionPartial[];
    protected sortFields: Array<{ node: Sort[]; edge: Sort[] }> = [];
    private pagination: Pagination | undefined;

    constructor(children: CompositeConnectionPartial[]) {
        super();
        this.children = children;
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        const edgeVar = new Cypher.NamedVariable("edge");
        const edgesVar = new Cypher.NamedVariable("edges");
        const totalCount = new Cypher.NamedVariable("totalCount");

        const nestedSubqueries = this.children.flatMap((c) => {
            const subQueryContext = new QueryASTContext({ ...context, returnVariable: edgeVar });
            const result = c.transpile(subQueryContext);
            if (hasTarget(context)) {
                const parentNode = context.target;
                return result.clauses.map((sq) => Cypher.concat(new Cypher.With(parentNode), sq));
            } else {
                return result.clauses;
            }
        });

        const union = new Cypher.Union(...nestedSubqueries);

        const nestedSubquery = new Cypher.Call(union);

        let orderSubquery: Cypher.Call | undefined;

        let returnEdgesVar: Cypher.Variable = edgesVar;
        if (this.pagination || this.sortFields.length > 0) {
            const paginationField = this.pagination && this.pagination.getPagination();

            const nestedContext = new QueryASTContext({
                // NOOP context
                target: new Cypher.Node(),
                env: context.env,
                neo4jGraphQLContext: context.neo4jGraphQLContext,
            });

            const sortFields = this.getSortFields(
                nestedContext,
                edgeVar.property("node"),
                edgeVar.property("properties")
            );
            const extraWithOrder = new Cypher.Unwind([edgesVar, edgeVar]).with(edgeVar).orderBy(...sortFields);

            if (paginationField && paginationField.skip) {
                extraWithOrder.skip(paginationField.skip);
            }
            // Missing skip
            if (paginationField && paginationField.limit) {
                extraWithOrder.limit(paginationField.limit);
            }

            const edgesVar2 = new Cypher.Variable();

            extraWithOrder.return([Cypher.collect(edgeVar), edgesVar2]);
            returnEdgesVar = edgesVar2;
            orderSubquery = new Cypher.Call(extraWithOrder).importWith(edgesVar);
        }

        nestedSubquery.with([Cypher.collect(edgeVar), edgesVar]).with(edgesVar, [Cypher.size(edgesVar), totalCount]);

        const returnClause = new Cypher.Return([
            new Cypher.Map({
                edges: returnEdgesVar,
                totalCount: totalCount,
            }),
            context.returnVariable,
        ]);

        return {
            clauses: [Cypher.concat(nestedSubquery, orderSubquery, returnClause)],
            projectionExpr: context.returnVariable,
        };
    }

    public addSort(sortElement: { node: Sort[]; edge: Sort[] }): void {
        this.sortFields.push(sortElement);
    }

    public addPagination(pagination: Pagination): void {
        this.pagination = pagination;
    }

    public getChildren(): QueryASTNode[] {
        const sortFields = this.sortFields.flatMap((s) => {
            return [...s.edge, ...s.node];
        });

        return filterTruthy([...this.children, ...sortFields, this.pagination]);
    }

    protected getSortFields(
        context: QueryASTContext,
        nodeVar: Cypher.Variable | Cypher.Property,
        edgeVar: Cypher.Variable | Cypher.Property
    ): SortField[] {
        return this.sortFields.flatMap(({ node, edge }) => {
            const nodeFields = node.flatMap((s) => s.getSortFields(context, nodeVar, false));
            const edgeFields = edge.flatMap((s) => s.getSortFields(context, edgeVar, false));

            return [...nodeFields, ...edgeFields];
        });
    }
}
