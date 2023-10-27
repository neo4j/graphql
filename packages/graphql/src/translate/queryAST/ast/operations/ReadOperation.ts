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
import { createNodeFromEntity, createRelationshipFromEntity } from "../../utils/create-node-from-entity";
import type { QueryASTContext } from "../QueryASTContext";
import type { QueryASTNode } from "../QueryASTNode";
import type { Field } from "../fields/Field";
import { CypherAttributeField } from "../fields/attribute-fields/CypherAttributeField";
import type { Filter } from "../filters/Filter";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { Pagination } from "../pagination/Pagination";
import { CypherPropertySort } from "../sort/CypherPropertySort";
import type { Sort } from "../sort/Sort";
import type { OperationTranspileOptions, OperationTranspileResult } from "./operations";
import { Operation } from "./operations";
import { wrapSubqueriesInCypherCalls } from "../../utils/wrap-subquery-in-calls";

export class ReadOperation extends Operation {
    public readonly target: ConcreteEntityAdapter;
    public readonly relationship: RelationshipAdapter | undefined;

    protected directed: boolean;

    public fields: Field[] = [];
    protected filters: Filter[] = [];
    protected authFilters: AuthorizationFilters[] = [];

    protected pagination: Pagination | undefined;
    protected sortFields: Sort[] = [];

    public nodeAlias: string | undefined; // This is just to maintain naming with the old way (this), remove after refactor

    constructor({
        target,
        relationship,
        directed,
    }: {
        target: ConcreteEntityAdapter;
        relationship?: RelationshipAdapter;
        directed?: boolean;
    }) {
        super();
        this.target = target;
        this.directed = directed ?? true;
        this.relationship = relationship;
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

    public setFilters(filters: Filter[]) {
        this.filters = filters;
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

    private transpileNestedRelationship(
        entity: RelationshipAdapter,
        { context }: OperationTranspileOptions
    ): OperationTranspileResult {
        const isCreateSelection = context.env.topLevelOperationName === "CREATE";

        //TODO: dupe from transpile
        if (!hasTarget(context)) throw new Error("No parent node found!");
        const relVar = createRelationshipFromEntity(entity);
        const targetNode = createNodeFromEntity(entity.target, context.neo4jGraphQLContext);
        const relDirection = entity.getCypherDirection(this.directed);

        const pattern = new Cypher.Pattern(context.target)
            .withoutLabels()
            .related(relVar)
            .withDirection(relDirection)
            .to(targetNode);

        const nestedContext = context.push({ target: targetNode, relationship: relVar });
        const filterPredicates = this.getPredicates(nestedContext);

        const authFilterSubqueries = this.getAuthFilterSubqueries(nestedContext).map((sq) =>
            new Cypher.Call(sq).innerWith(targetNode)
        );
        const authFiltersPredicate = this.getAuthFilterPredicate(nestedContext);

        const { preSelection, selectionClause: matchClause } = this.getSelectionClauses(nestedContext, pattern);

        const wherePredicate = Cypher.and(filterPredicates, ...authFiltersPredicate);
        let withWhere: Cypher.With | undefined;

        let filterSubqueryWith: Cypher.With | undefined;

        // This weird condition is just for cypher compatibility
        const shouldAddWithForAuth = authFiltersPredicate.length > 0;
        if (authFilterSubqueries.length > 0 || shouldAddWithForAuth) {
            if (!isCreateSelection) {
                filterSubqueryWith = new Cypher.With("*");
            }
        }

        if (wherePredicate) {
            if (filterSubqueryWith) {
                filterSubqueryWith.where(wherePredicate); // TODO: should this only be for aggregation filters?
            } else {
                matchClause.where(wherePredicate);
            }
        }

        const cypherFieldSubqueries = this.getCypherFieldsSubqueries(nestedContext);
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(nestedContext), ...cypherFieldSubqueries);
        const sortSubqueries = wrapSubqueriesInCypherCalls(nestedContext, this.sortFields, [targetNode]);
        const ret = this.getProjectionClause(nestedContext, context.returnVariable, entity.isList);

        const clause = Cypher.concat(
            ...preSelection,
            matchClause,
            ...authFilterSubqueries,
            filterSubqueryWith,
            withWhere,
            subqueries,
            ...sortSubqueries,
            ret
        );

        return {
            clauses: [clause],
            projectionExpr: context.returnVariable,
        };
    }

    protected getProjectionClause(
        context: QueryASTContext,
        returnVariable: Cypher.Variable,
        isArray: boolean
    ): Cypher.Return {
        if (!hasTarget(context)) throw new Error("No parent node found!");
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
        return Cypher.and(...[...this.filters].map((f) => f.getPredicate(queryASTContext)));
    }

    protected getSelectionClauses(
        context: QueryASTContext,
        node: Cypher.Node | Cypher.Pattern
    ): {
        preSelection: Array<Cypher.Match | Cypher.With>;
        selectionClause: Cypher.Match | Cypher.With;
    } {
        let matchClause: Cypher.Match | Cypher.With = new Cypher.Match(node);

        let extraMatches = this.getChildren().flatMap((f) => {
            return f.getSelection(context);
        });

        if (extraMatches.length > 0) {
            extraMatches = [matchClause, ...extraMatches];
            matchClause = new Cypher.With("*");
        }

        return {
            preSelection: extraMatches,
            selectionClause: matchClause,
        };
    }

    public transpile({ context }: OperationTranspileOptions): OperationTranspileResult {
        if (this.relationship) {
            return this.transpileNestedRelationship(this.relationship, {
                context,
            });
        }
        const isCreateSelection = context.env.topLevelOperationName === "CREATE";
        const node = createNodeFromEntity(this.target, context.neo4jGraphQLContext, this.nodeAlias);
        const filterSubqueries = wrapSubqueriesInCypherCalls(context, this.filters, [node]);
        const filterPredicates = this.getPredicates(context);

        const authFilterSubqueries = this.getAuthFilterSubqueries(context).map((sq) =>
            new Cypher.Call(sq).innerWith(node)
        );
        const fieldSubqueries = this.getFieldsSubqueries(context);
        const cypherFieldSubqueries = this.getCypherFieldsSubqueries(context);
        const sortSubqueries = wrapSubqueriesInCypherCalls(context, this.sortFields, [node]);
        const subqueries = Cypher.concat(...fieldSubqueries);

        const authFiltersPredicate = this.getAuthFilterPredicate(context);
        const ret: Cypher.Return = this.getReturnStatement(context, context.returnVariable);
        const { preSelection, selectionClause: matchClause } = this.getSelectionClauses(context, node);

        let filterSubqueryWith: Cypher.With | undefined;
        let filterSubqueriesClause: Cypher.Clause | undefined = undefined;

        // This weird condition is just for cypher compatibility
        const shouldAddWithForAuth = authFiltersPredicate.length > 0;
        if (filterSubqueries.length > 0 || shouldAddWithForAuth) {
            filterSubqueriesClause = Cypher.concat(...filterSubqueries);
            if (!isCreateSelection) {
                filterSubqueryWith = new Cypher.With("*");
            }
        }

        const wherePredicate = isCreateSelection
            ? filterPredicates
            : Cypher.and(filterPredicates, ...authFiltersPredicate);
        if (wherePredicate) {
            if (filterSubqueryWith) {
                filterSubqueryWith.where(wherePredicate); // TODO: should this only be for aggregation filters?
            } else {
                matchClause.where(wherePredicate);
            }
        }

        let sortClause: Cypher.With | undefined;
        if (this.sortFields.length > 0 || this.pagination) {
            sortClause = new Cypher.With("*");
            this.addSortToClause(context, node, sortClause);
        }

        const sortBlock = Cypher.concat(...sortSubqueries, sortClause);

        const sortAndLimitBlock: Cypher.Clause = this.hasCypherSort()
            ? Cypher.concat(...cypherFieldSubqueries, sortBlock)
            : Cypher.concat(sortBlock, ...cypherFieldSubqueries);

        let clause: Cypher.Clause;

        // Top-level read part of a mutation does not contains the MATCH clause as is implicit in the mutation.
        if (isCreateSelection) {
            clause = Cypher.concat(filterSubqueriesClause, filterSubqueryWith, sortAndLimitBlock, subqueries, ret);
        } else {
            clause = Cypher.concat(
                ...preSelection,
                matchClause,
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

    private getReturnStatement(context: QueryASTContext, returnVariable): Cypher.Return {
        const projection = this.getProjectionMap(context);
        if (context.shouldCollect) {
            return new Cypher.Return([Cypher.collect(projection), returnVariable]);
        }
        return new Cypher.Return([projection, returnVariable]);
    }

    private hasCypherSort(): boolean {
        return this.sortFields.some((s) => s instanceof CypherPropertySort);
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([
            ...this.filters,
            ...this.authFilters,
            ...this.fields,
            this.pagination,
            ...this.sortFields,
        ]);
    }

    protected getFieldsSubqueries(context: QueryASTContext): Cypher.Clause[] {
        const nonCypherFields = this.fields.filter((f) => !(f instanceof CypherAttributeField));
        if (!hasTarget(context)) throw new Error("No parent node found!");
        return wrapSubqueriesInCypherCalls(context, nonCypherFields, [context.target]);
    }

    protected getCypherFieldsSubqueries(context: QueryASTContext): Cypher.Clause[] {
        if (!hasTarget(context)) throw new Error("No parent node found!");
        return wrapSubqueriesInCypherCalls(context, this.getCypherFields(), [context.target]);
    }

    private getCypherFields(): Field[] {
        return this.fields.filter((f) => {
            return f instanceof CypherAttributeField;
        });
    }

    protected getProjectionMap(context: QueryASTContext): Cypher.MapProjection {
        if (!hasTarget(context)) throw new Error("No parent node found!");
        const projectionFields = this.fields.map((f) => f.getProjectionField(context.target));
        const sortProjectionFields = this.sortFields.map((f) => f.getProjectionField(context));

        const uniqueProjectionFields = Array.from(new Set([...projectionFields, ...sortProjectionFields])); // TODO remove duplicates with alias

        const stringFields: string[] = [];
        let otherFields: Record<string, Cypher.Expr> = {};

        for (const field of uniqueProjectionFields) {
            if (typeof field === "string") stringFields.push(field);
            else {
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
