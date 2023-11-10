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
import type { InterfaceEntityAdapter } from "../../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import { filterTruthy } from "../../../../../utils/utils";
import { QueryASTContext } from "../../QueryASTContext";
import type { QueryASTNode } from "../../QueryASTNode";
import type { AggregationField } from "../../fields/aggregation-fields/AggregationField";
import type { Filter } from "../../filters/Filter";
import type { AuthorizationFilters } from "../../filters/authorization-filters/AuthorizationFilters";
import type { Pagination } from "../../pagination/Pagination";
import type { Sort, SortField } from "../../sort/Sort";
import type { OperationTranspileOptions, OperationTranspileResult } from "../operations";
import { Operation } from "../operations";
import type { CompositeAggregationPartial } from "./CompositeAggregationPartial";

export class CompositeAggregationOperation extends Operation {
    private children: CompositeAggregationPartial[];
    protected directed: boolean;
    public fields: AggregationField[] = []; // Aggregation fields
    public nodeFields: AggregationField[] = []; // Aggregation node fields
    public edgeFields: AggregationField[] = []; // Aggregation node fields

    private entity: InterfaceEntityAdapter | UnionEntityAdapter;

    protected authFilters: AuthorizationFilters[] = [];

    protected filters: Filter[] = [];
    protected pagination: Pagination | undefined;
    protected sortFields: Sort[] = [];

    public nodeAlias: string | undefined; // This is just to maintain naming with the old way (this), remove after refactor

    constructor({
        compositeEntity,
        children,
        directed = true,
    }: {
        compositeEntity: InterfaceEntityAdapter | UnionEntityAdapter;
        children: CompositeAggregationPartial[];
        directed?: boolean;
    }) {
        super();
        this.entity = compositeEntity;
        this.children = children;
        this.directed = directed;
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([
            ...this.fields,
            ...this.nodeFields,
            ...this.edgeFields,
            ...this.filters,
            ...this.sortFields,
            ...this.authFilters,
            this.pagination,
            ...this.children,
        ]);
    }

    protected getSortFields(context: QueryASTContext, target: Cypher.Variable): SortField[] {
        return this.sortFields.flatMap((sf) => sf.getSortFields(context, target, false));
    }

    public transpile({ context }: OperationTranspileOptions): OperationTranspileResult {
        const parentNode = context.target;

        if (parentNode) {
            return this.transpileAggregationOperation({ context });
        } else {
            if (!this.nodeAlias) {
                throw new Error("Node alias missing on top level composite aggregation");
            }
            const newContext = new QueryASTContext({
                // NOTE: hack for top level
                target: new Cypher.NamedNode(this.nodeAlias),
                neo4jGraphQLContext: context.neo4jGraphQLContext,
            });
            const result = this.transpileAggregationOperation({ context: newContext }, false);

            const subqueriesAggr = result.clauses.map((clause) => {
                return new Cypher.Call(clause);
            });

            return {
                clauses: [...subqueriesAggr, new Cypher.Return(result.projectionExpr)],
                projectionExpr: Cypher.true, // NOTE: dummy response, this should be handled by queryAST instead of embedded in clauses
            };
        }
    }

    public setFields(fields: AggregationField[]) {
        this.fields = fields;
    }

    public addSort(...sort: Sort[]): void {
        this.sortFields.push(...sort);
    }

    public addPagination(pagination: Pagination): void {
        this.pagination = pagination;
    }

    public setFilters(filters: Filter[]) {
        this.filters = filters;
    }

    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
    }

    public setNodeFields(fields: AggregationField[]) {
        this.nodeFields = fields;
    }

    public setEdgeFields(fields: AggregationField[]) {
        this.edgeFields = fields;
    }

    protected getPredicates(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        const authPredicates = this.getAuthFilterPredicate(queryASTContext);
        return Cypher.and(...this.filters.map((f) => f.getPredicate(queryASTContext)), ...authPredicates);
    }

    protected getAuthFilterPredicate(context: QueryASTContext): Cypher.Predicate[] {
        return filterTruthy(this.authFilters.map((f) => f.getPredicate(context)));
    }

    protected addSortToClause(
        context: QueryASTContext,
        node: Cypher.Variable,
        clause: Cypher.With | Cypher.Return
    ): void {
        const orderByFields = this.sortFields.flatMap((f) => f.getSortFields(context, node));
        const pagination = this.pagination ? this.pagination.getPagination() : undefined;
        clause.orderBy(...orderByFields);

        if (pagination?.skip) {
            clause.skip(pagination.skip);
        }
        if (pagination?.limit) {
            clause.limit(pagination.limit);
        }
    }

    protected getFieldProjectionClause(
        target: Cypher.Variable,
        returnVariable: Cypher.Variable,
        field: AggregationField
    ): Cypher.Clause {
        return field.getAggregationProjection(target, returnVariable);
    }

    private transpileAggregationOperation(
        { context }: OperationTranspileOptions,
        addWith = true
    ): OperationTranspileResult {
        const aggregationProjectionMap: Cypher.Map = new Cypher.Map();
        const nodeMap = new Cypher.Map();
        const edgeMap = new Cypher.Map();

        const fieldSubqueries = this.fields.map((field) => {
            const returnVariable = new Cypher.Variable();
            const nestedContext = context.setReturn(returnVariable);

            const nestedSubquery = this.createSubquery(field, nestedContext, aggregationProjectionMap, addWith);
            return nestedSubquery.return([
                field.getAggregationExpr(nestedContext.returnVariable),
                nestedContext.returnVariable,
            ]);
        });

        const nodeFieldSubqueries = this.nodeFields.map((field) => {
            const returnVariable = new Cypher.Variable();

            const nestedContext = context.setReturn(returnVariable);

            const nestedSubquery = this.createSubquery(field, nestedContext, nodeMap, addWith);
            return Cypher.concat(
                nestedSubquery,
                field.getAggregationProjection(nestedContext.returnVariable, nestedContext.returnVariable)
            );
        });

        if (nodeMap.size > 0) {
            aggregationProjectionMap.set("node", nodeMap);
        }

        const edgeFieldSubqueries = this.edgeFields.map((field) => {
            const returnVariable = new Cypher.Variable();
            const nestedContext = context.setReturn(returnVariable);

            const nestedSubquery = this.createSubquery(field, nestedContext, edgeMap, addWith, true);
            return Cypher.concat(
                nestedSubquery,
                field.getAggregationProjection(nestedContext.returnVariable, nestedContext.returnVariable)
            );
        });

        if (edgeMap.size > 0) {
            aggregationProjectionMap.set("edge", edgeMap);
        }

        return {
            clauses: [...fieldSubqueries, ...nodeFieldSubqueries, ...edgeFieldSubqueries],
            projectionExpr: aggregationProjectionMap,
        };
    }

    private createSubquery(
        field: AggregationField,
        context: QueryASTContext,
        addToMap: Cypher.Map,
        addWith = true,
        useRelationshipVariable = false
    ) {
        const parentNode = context.target;

        const nestedSubqueries = this.children.flatMap((c) => {
            c.setAttachedTo(useRelationshipVariable ? "relationship" : "node");
            const result = c.getSubqueries(context);

            let clauses = result;

            if (parentNode && addWith) {
                clauses = clauses.map((sq) => Cypher.concat(new Cypher.With(parentNode), sq));
            }
            return clauses;
        });

        addToMap.set(field.getProjectionField(context.returnVariable));

        const nestedSubquery = new Cypher.Call(new Cypher.Union(...nestedSubqueries));

        return nestedSubquery;
    }
}
