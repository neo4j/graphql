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
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { filterTruthy } from "../../../../utils/utils";
import { hasTarget } from "../../utils/context-has-target";
import { wrapSubqueriesInCypherCalls } from "../../utils/wrap-subquery-in-calls";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { Field } from "../fields/Field";
import type { Filter } from "../filters/Filter";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { Pagination } from "../pagination/Pagination";
import type { EntitySelection, SelectionClause } from "../selection/EntitySelection";
import { CypherPropertySort } from "../sort/CypherPropertySort";
import type { Sort } from "../sort/Sort";
import type { OperationTranspileResult } from "./operations";
import { Operation } from "./operations";

export class ReadOperation extends Operation {
    public readonly target: ConcreteEntityAdapter;
    public readonly relationship: RelationshipAdapter | undefined;

    public fields: Field[] = [];
    protected filters: Filter[] = [];
    protected authFilters: AuthorizationFilters[] = [];

    protected pagination: Pagination | undefined;
    protected sortFields: Sort[] = [];

    protected selection: EntitySelection;

    constructor({
        target,
        relationship,
        selection,
    }: {
        target: ConcreteEntityAdapter;
        relationship?: RelationshipAdapter;
        selection: EntitySelection;
    }) {
        super();
        this.target = target;
        this.relationship = relationship;

        this.selection = selection;
    }

    public setFields(fields: Field[]) {
        this.fields = fields;
    }

    public addSort(...sort: Sort[]): void {
        this.sortFields.push(...sort);
    }

    public addPagination(pagination: Pagination): void {
        this.pagination = pagination;
    }

    public addFilters(...filters: Filter[]) {
        this.filters.push(...filters);
    }

    public addAuthFilters(...filter: AuthorizationFilters[]) {
        this.authFilters.push(...filter);
    }

    protected getAuthFilterSubqueries(context: QueryASTContext): Cypher.Clause[] {
        return this.authFilters.flatMap((f) => f.getSubqueries(context));
    }

    protected getAuthFilterPredicate(context: QueryASTContext): Cypher.Predicate[] {
        return filterTruthy(this.authFilters.map((f) => f.getPredicate(context)));
    }

    protected getProjectionClause(
        context: QueryASTContext,
        returnVariable: Cypher.Variable,
        isArray: boolean
    ): Cypher.Return {
        if (!hasTarget(context)) {
            throw new Error("No parent node found!");
        }
        const projection = this.getProjectionMap(context);

        let aggregationExpr: Cypher.Expr = Cypher.collect(context.target);
        if (!isArray) {
            aggregationExpr = Cypher.head(aggregationExpr);
        }

        const withClause = new Cypher.With([projection, context.target]);
        if (this.sortFields.length > 0 || this.pagination) {
            this.addSortToClause(context, context.target, withClause);
        }

        return withClause.return([aggregationExpr, returnVariable]);
    }

    protected getPredicates(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        return Cypher.and(...this.filters.map((f) => f.getPredicate(queryASTContext)));
    }

    public transpile(context: QueryASTContext): OperationTranspileResult {
        // eslint-disable-next-line prefer-const
        let { selection: matchClause, nestedContext } = this.selection.apply(context);

        const topLevelOperationName = (this.relationship ? context : nestedContext).env.topLevelOperationName;
        const isCreateSelection = topLevelOperationName === "CREATE";
        const isUpdateSelection = topLevelOperationName === "UPDATE";
        if (isCreateSelection || isUpdateSelection) {
            if (!context.hasTarget()) {
                throw new Error("Invalid target for create operation");
            }
            if (!this.relationship) {
                // Match is not applied on mutations (last concat ignores the top level match) so we revert the context apply
                nestedContext = context;
            }
        }

        const filterSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.filters, [nestedContext.target]);
        const filterPredicates = this.getPredicates(nestedContext);
        const fieldSubqueries = this.getFieldsSubqueries(nestedContext);
        const cypherFieldSubqueries = this.getCypherFieldsSubqueries(nestedContext);
        const sortSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.sortFields, [nestedContext.target]);

        const authFilterSubqueries = this.getAuthFilterSubqueries(nestedContext).map((sq) =>
            new Cypher.Call(sq).importWith(nestedContext.target)
        );

        const authFiltersPredicate = this.getAuthFilterPredicate(nestedContext);
        const ret: Cypher.Return = this.relationship
            ? this.getProjectionClause(nestedContext, context.returnVariable, this.relationship.isList)
            : this.getReturnStatement(
                  isCreateSelection || isUpdateSelection ? context : nestedContext,
                  nestedContext.returnVariable
              );

        let filterSubqueryWith: Cypher.With | undefined;
        let filterSubqueriesClause: Cypher.Clause | undefined;
        // This weird condition is just for cypher compatibility
        const shouldAddWithForAuth = authFilterSubqueries.length || authFiltersPredicate.length;
        if (filterSubqueries.length || shouldAddWithForAuth) {
            filterSubqueriesClause = Cypher.utils.concat(...filterSubqueries);
            if (!isCreateSelection || authFilterSubqueries.length) {
                filterSubqueryWith = new Cypher.With("*");
            }
        }

        let sortAndLimitBlock: Cypher.Clause | undefined;
        let subqueries: Cypher.Clause;
        if (this.relationship) {
            subqueries = Cypher.utils.concat(...fieldSubqueries, ...cypherFieldSubqueries, ...sortSubqueries);
        } else {
            subqueries = Cypher.utils.concat(...fieldSubqueries);

            let sortClause: Cypher.With | undefined;
            if (this.sortFields.length || this.pagination) {
                sortClause = new Cypher.With("*");
                this.addSortToClause(nestedContext, nestedContext.target, sortClause);
            }
            const sortBlock = Cypher.utils.concat(...sortSubqueries, sortClause);

            sortAndLimitBlock = this.hasCypherSort()
                ? Cypher.utils.concat(...cypherFieldSubqueries, sortBlock)
                : Cypher.utils.concat(sortBlock, ...cypherFieldSubqueries);
        }

        let clause: Cypher.Clause;
        if (isCreateSelection && !this.relationship) {
            // Top-level read part of a mutation does not contain the MATCH clause as it's implicit in the mutation.
            clause = Cypher.utils.concat(
                filterSubqueriesClause,
                filterSubqueryWith,
                sortAndLimitBlock,
                subqueries,
                ret
            );
        } else {
            const extraMatches: SelectionClause[] = this.getChildren().flatMap((f) => f.getSelection(nestedContext));
            let extraMatchesWith: Cypher.With | undefined;

            const wherePredicate = Cypher.and(filterPredicates, ...authFiltersPredicate);
            if (wherePredicate) {
                if (filterSubqueryWith) {
                    filterSubqueryWith.where(wherePredicate); // TODO: should this only be for aggregation filters?
                } else if (extraMatches.length) {
                    extraMatchesWith = new Cypher.With("*").where(wherePredicate);
                } else {
                    matchClause.where(wherePredicate);
                }
            }

            const matchBlock: (SelectionClause | undefined)[] = [];
            if (!isUpdateSelection || this.relationship) {
                matchBlock.push(matchClause);
            }
            matchBlock.push(...extraMatches, extraMatchesWith);

            clause = Cypher.utils.concat(
                ...matchBlock,
                ...authFilterSubqueries,
                filterSubqueriesClause,
                filterSubqueryWith,
                sortAndLimitBlock,
                subqueries,
                ret
            );
        }

        return {
            clauses: [clause],
            projectionExpr: context.returnVariable,
        };
    }

    protected getReturnStatement(context: QueryASTContext, returnVariable: Cypher.Variable): Cypher.Return {
        const projection = this.getProjectionMap(context);
        if (context.shouldCollect) {
            const collectProj = Cypher.collect(projection);
            if (context.shouldDistinct) {
                collectProj.distinct();
            }
            return new Cypher.Return([collectProj, returnVariable]);
        }

        return new Cypher.Return([projection, returnVariable]);
    }

    private hasCypherSort(): boolean {
        return this.sortFields.some((s) => s instanceof CypherPropertySort);
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([
            this.selection,
            ...this.filters,
            ...this.authFilters,
            ...this.fields,
            this.pagination,
            ...this.sortFields,
        ]);
    }

    protected getFieldsSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const nonCypherFields = this.fields.filter((f) => !f.isCypherField());
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        return wrapSubqueriesInCypherCalls(context, nonCypherFields, [context.target]);
    }

    protected getCypherFieldsSubqueries(context: QueryASTContext): Cypher.Clause[] {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        return wrapSubqueriesInCypherCalls(context, this.getCypherFields(), [context.target]);
    }

    private getCypherFields(): Field[] {
        return this.fields.filter((f) => f.isCypherField());
    }

    protected getProjectionMap(context: QueryASTContext): Cypher.MapProjection {
        if (!context.hasTarget()) {
            throw new Error("No parent node found!");
        }
        const projectionFields = this.fields.map((f) => f.getProjectionField(context.target));
        const sortProjectionFields = this.sortFields.map((f) => f.getProjectionField(context));

        const uniqueProjectionFields = Array.from(new Set([...projectionFields, ...sortProjectionFields])); // TODO remove duplicates with alias

        const stringFields: string[] = [];
        let otherFields: Record<string, Cypher.Expr> = {};

        for (const field of uniqueProjectionFields) {
            if (typeof field === "string") {
                stringFields.push(field);
            } else {
                otherFields = { ...otherFields, ...field };
            }
        }

        return new Cypher.MapProjection(context.target, stringFields, otherFields);
    }

    protected addSortToClause(context: QueryASTContext, node: Cypher.Node, clause: Cypher.With | Cypher.Return): void {
        const isNested = Boolean(context.source); // This is to keep Cypher compatibility
        const orderByFields = this.sortFields.flatMap((f) => f.getSortFields(context, node, !isNested));
        const pagination = this.pagination ? this.pagination.getPagination() : undefined;
        clause.orderBy(...orderByFields);

        if (pagination?.skip) {
            clause.skip(pagination.skip);
        }
        if (pagination?.limit) {
            clause.limit(pagination.limit);
        }
    }
}
