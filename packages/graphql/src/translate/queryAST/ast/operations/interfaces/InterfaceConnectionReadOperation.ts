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
import type { OperationTranspileOptions, OperationTranspileResult } from "../operations";
import { Operation } from "../operations";

import type { QueryASTNode } from "../../QueryASTNode";
import type { InterfaceConnectionPartial } from "./InterfaceConnectionPartial";
import type { Sort, SortField } from "../../sort/Sort";
import type { Pagination } from "../../pagination/Pagination";
import { QueryASTContext } from "../../QueryASTContext";

export class InterfaceConnectionReadOperation extends Operation {
    private children: InterfaceConnectionPartial[];
    protected sortFields: Array<{ node: Sort[]; edge: Sort[] }> = [];

    constructor(children: InterfaceConnectionPartial[]) {
        super();

        this.children = children;
    }

    public transpile(options: OperationTranspileOptions): OperationTranspileResult {
        const edgeVar = new Cypher.NamedVariable("edge");
        const edgesVar = new Cypher.NamedVariable("edges");
        const totalCount = new Cypher.NamedVariable("totalCount");

        const nestedSubqueries = this.children.flatMap((c) => {
            const result = c.transpile({
                parentNode: options.parentNode,
                returnVariable: edgeVar,
            });
            // const callSubqueries = result.clauses.map((sq) => new Cypher.Call(sq));
            const parentNode = options.parentNode;

            let clauses = result.clauses;
            if (parentNode) {
                clauses = clauses.map((sq) => Cypher.concat(new Cypher.With(parentNode), sq));
            }
            return clauses;
        });

        const union = new Cypher.Union(...nestedSubqueries);
        const nestedSubquery = new Cypher.Call(union);

        // let sortSubquery: Cypher.With | undefined;
        // if (this.pagination || this.sortFields.length > 0) {
        //     const paginationField = this.pagination && this.pagination.getPagination();

        //     sortSubquery = this.getPaginationSubquery(nestedContext, edgesVar, paginationField);
        //     sortSubquery.addColumns(totalCount);
        // }

        let extraWithOrder: Cypher.Clause | undefined;
        if (this.sortFields.length > 0) {
            const context = new QueryASTContext({
                // NOOP context
                target: new Cypher.Node(),
            });

            const sortFields = this.getSortFields(context, edgeVar.property("node"), edgeVar);
            extraWithOrder = new Cypher.Unwind([edgesVar, edgeVar])
                .with(edgeVar, totalCount)
                .orderBy(...sortFields)
                .with([Cypher.collect(edgeVar), edgesVar], totalCount);
        }

        nestedSubquery.with([Cypher.collect(edgeVar), edgesVar]).with(edgesVar, [Cypher.size(edgesVar), totalCount]);

        const returnClause = new Cypher.Return([
            new Cypher.Map({
                edges: edgesVar,
                totalCount: totalCount,
            }),
            options.returnVariable,
        ]);

        return {
            clauses: [Cypher.concat(nestedSubquery, extraWithOrder, returnClause)],
            projectionExpr: options.returnVariable,
        };
    }

    public addSort(sortElement: { node: Sort[]; edge: Sort[] }): void {
        this.sortFields.push(sortElement);
    }

    public addPagination(_pagination: Pagination): void {
        return undefined;
        // this.pagination = pagination;
    }

    public getChildren(): QueryASTNode[] {
        const sortFields = this.sortFields.flatMap((s) => {
            return [...s.edge, ...s.node];
        });

        return [...this.children, ...sortFields];
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
