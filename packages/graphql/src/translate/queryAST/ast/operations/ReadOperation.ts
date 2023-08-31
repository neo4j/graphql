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

import { filterTruthy } from "../../../../utils/utils";
import { createNodeFromEntity, createRelationshipFromEntity } from "../../utils/create-node-from-entity";
import type { Field } from "../fields/Field";
import type { Filter } from "../filters/Filter";
import Cypher from "@neo4j/cypher-builder";
import type { OperationTranspileOptions, OperationTranspileResult } from "./operations";
import { Operation } from "./operations";
import type { Pagination } from "../pagination/Pagination";
import type { PropertySort } from "../sort/PropertySort";
import { QueryASTContext } from "../QueryASTContext";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { AuthorizationFilters } from "../filters/authorization-filters/AuthorizationFilters";
import type { QueryASTNode } from "../QueryASTNode";

export class ReadOperation extends Operation {
    public readonly entity: ConcreteEntityAdapter | RelationshipAdapter; // TODO: normal entities
    protected directed: boolean;

    public fields: Field[] = [];
    protected filters: Filter[] = [];
    protected authFilters: AuthorizationFilters | undefined;

    protected pagination: Pagination | undefined;
    protected sortFields: PropertySort[] = [];

    public nodeAlias: string | undefined; // This is just to maintain naming with the old way (this), remove after refactor

    constructor(entity: ConcreteEntityAdapter | RelationshipAdapter, directed = true) {
        super();
        this.entity = entity;
        this.directed = directed;
    }

    public setFields(fields: Field[]) {
        this.fields = fields;
    }

    public addSort(...sort: PropertySort[]): void {
        this.sortFields.push(...sort);
    }

    public addPagination(pagination: Pagination): void {
        this.pagination = pagination;
    }

    public setFilters(filters: Filter[]) {
        this.filters = filters;
    }

    public setAuthFilters(filter: AuthorizationFilters) {
        this.authFilters = filter;
    }

    private transpileNestedRelationship(
        entity: RelationshipAdapter,
        { returnVariable, parentNode }: OperationTranspileOptions
    ): OperationTranspileResult {
        //TODO: dupe from transpile
        if (!parentNode) throw new Error("No parent node found!");
        const relVar = createRelationshipFromEntity(entity);
        const targetNode = createNodeFromEntity(entity.target as ConcreteEntityAdapter);
        const relDirection = entity.getCypherDirection(this.directed);

        const pattern = new Cypher.Pattern(parentNode)
            .withoutLabels()
            .related(relVar)
            .withDirection(relDirection)
            .to(targetNode);

        const matchClause = new Cypher.Match(pattern);
        const nestedContext = new QueryASTContext({ target: targetNode, relationship: relVar, source: parentNode });
        const filterPredicates = this.getPredicates(nestedContext);
        const authFilterSubqueries = this.authFilters ? this.authFilters.getSubqueries(targetNode) : [];
        const authFiltersPredicate = this.authFilters ? this.authFilters.getPredicate(nestedContext) : undefined;

        const wherePredicate = Cypher.and(filterPredicates, authFiltersPredicate);
        let withWhere: Cypher.Clause | undefined;
        if (wherePredicate) {
            withWhere = new Cypher.With("*").where(wherePredicate);
        }
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(targetNode));

        const ret = this.getProjectionClause(targetNode, returnVariable, entity.isList);

        let sortClause: Cypher.With | undefined;
        if (this.sortFields.length > 0 || this.pagination) {
            sortClause = new Cypher.With("*");
            this.addSortToClause(targetNode, sortClause);
        }
        const clause = Cypher.concat(matchClause, ...authFilterSubqueries, withWhere, subqueries, sortClause, ret);

        return {
            clauses: [clause],
            projectionExpr: returnVariable,
        };
    }

    protected getProjectionClause(
        target: Cypher.Node,
        returnVariable: Cypher.Variable,
        isArray: boolean
    ): Cypher.Return {
        const projection = this.getProjectionMap(target);

        let aggregationExpr: Cypher.Expr = Cypher.collect(target);
        if (!isArray) {
            aggregationExpr = Cypher.head(aggregationExpr);
        }
        return new Cypher.With([projection, target]).return([aggregationExpr, returnVariable]);
    }

    private getPredicates(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        return Cypher.and(...[...this.filters].map((f) => f.getPredicate(queryASTContext)));
    }

    public transpile({ returnVariable, parentNode }: OperationTranspileOptions): OperationTranspileResult {
        if (this.entity instanceof RelationshipAdapter) {
            return this.transpileNestedRelationship(this.entity, { returnVariable, parentNode });
        }
        const node = createNodeFromEntity(this.entity, this.nodeAlias);
        const context = new QueryASTContext({ target: node });
        const filterSubqueries = this.filters
            .flatMap((f) => f.getSubqueries(node))
            .map((sq) => new Cypher.Call(sq).innerWith(node));
        const filterPredicates = this.getPredicates(context);
        const authFilterSubqueries = this.authFilters ? this.authFilters.getSubqueries(node) : [];
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(node), ...authFilterSubqueries);
        const authFiltersPredicate = this.authFilters ? this.authFilters.getPredicate(context) : undefined;

        const projection = this.getProjectionMap(node);

        const matchClause = new Cypher.Match(node);

        let filterSubqueryWith: Cypher.With | undefined;
        let filterSubqueriesClause: Cypher.Clause | undefined = undefined;
        // TODO: add auth subqueries
        if (filterSubqueries.length > 0 || authFiltersPredicate) {
            // Using aurthFiltersPredicate here just to add a WITH * for compatibility
            filterSubqueriesClause = Cypher.concat(...filterSubqueries);
            filterSubqueryWith = new Cypher.With("*");
        }

        const wherePredicate = Cypher.and(filterPredicates, authFiltersPredicate);
        if (wherePredicate) {
            if (filterSubqueryWith) {
                filterSubqueryWith.where(wherePredicate); // TODO: should this only be for aggregation filters?
            } else {
                matchClause.where(wherePredicate);
            }
        }

        // let authWith: Cypher.Clause | undefined;
        // if (authFiltersPredicate) {
        //     authWith = new Cypher.With("*").where(authFiltersPredicate);
        // }
        const ret = new Cypher.Return([projection, returnVariable]);

        let sortClause: Cypher.With | undefined;
        if (this.sortFields.length > 0 || this.pagination) {
            sortClause = new Cypher.With("*");
            this.addSortToClause(node, sortClause);
        }
        const clause = Cypher.concat(
            matchClause,
            filterSubqueriesClause,
            filterSubqueryWith,
            // authWith,
            subqueries,
            sortClause,
            ret
        );

        return {
            clauses: [clause],
            projectionExpr: returnVariable,
        };
    }

    public getChildren(): QueryASTNode[] {
        return filterTruthy([...this.filters, this.authFilters, ...this.fields, this.pagination, ...this.sortFields]);
    }

    protected getFieldsSubqueries(node: Cypher.Node): Cypher.Clause[] {
        return filterTruthy(
            this.fields.flatMap((f) => {
                return f.getSubqueries(node);
            })
        ).map((sq) => {
            return new Cypher.Call(sq).innerWith(node);
        });
    }

    private getProjectionMap(node: Cypher.Node): Cypher.MapProjection {
        const projectionFields = this.fields.map((f) => f.getProjectionField(node));
        const sortProjectionFields = this.sortFields.map((f) => f.getProjectionField());

        const uniqueProjectionFields = Array.from(new Set([...projectionFields, ...sortProjectionFields])); // TODO remove duplicates with alias

        const stringFields: string[] = [];
        let otherFields: Record<string, Cypher.Expr> = {};

        for (const field of uniqueProjectionFields) {
            if (typeof field === "string") stringFields.push(field);
            else {
                otherFields = { ...otherFields, ...field };
            }
        }

        return new Cypher.MapProjection(node, stringFields, otherFields);
    }

    private addSortToClause(node: Cypher.Node, clause: Cypher.With | Cypher.Return): void {
        const orderByFields = this.sortFields.flatMap((f) => f.getSortFields(node));
        const pagination = this.pagination ? this.pagination.getPagination() : undefined;
        clause.orderBy(...orderByFields);

        if (pagination?.skip) {
            clause.skip(pagination.skip as any);
        }
        if (pagination?.limit) {
            clause.limit(pagination.limit as any);
        }
    }
}
