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

import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import { filterTruthy } from "../../../../utils/utils";
import { createNodeFromEntity, createRelationshipFromEntity } from "../../utils/create-node-from-entity";
import type { Field } from "../fields/Field";
import type { Filter } from "../filters/Filter";
import Cypher from "@neo4j/cypher-builder";
import type { OperationTranspileOptions, OperationTranspileResult } from "./operations";
import { Operation } from "./operations";
import type { Pagination } from "../pagination/Pagination";
import type { PropertySort } from "../sort/PropertySort";
import { Relationship } from "../../../../schema-model/relationship/Relationship";
import { getRelationshipDirection } from "../../utils/get-relationship-direction";

export class ReadOperation extends Operation {
    public readonly entity: ConcreteEntity | Relationship; // TODO: normal entities
    protected directed: boolean;

    public fields: Field[] = [];
    protected filters: Filter[] = [];
    protected pagination: Pagination | undefined;
    protected sortFields: PropertySort[] = [];

    public nodeAlias: string | undefined; // This is just to maintain naming with the old way (this), remove after refactor

    constructor(entity: ConcreteEntity | Relationship, directed = true) {
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

    private transpileNestedRelationship(
        entity: Relationship,
        { returnVariable, parentNode }: OperationTranspileOptions
    ): OperationTranspileResult {
        //TODO: dupe from transpile
        if (!parentNode) throw new Error("No parent node found!");
        const relVar = createRelationshipFromEntity(entity);
        const targetNode = createNodeFromEntity(entity.target as ConcreteEntity);
        const relDirection = getRelationshipDirection(entity, this.directed);

        const pattern = new Cypher.Pattern(parentNode)
            .withoutLabels()
            .related(relVar)
            .withDirection(relDirection)
            .to(targetNode);

        const matchClause = new Cypher.Match(pattern);
        const filterPredicates = this.getPredicates(targetNode);
        // const projectionFields = this.fields.map((f) => f.getProjectionField(targetNode));
        // const sortProjectionFields = this.sortFields.map((f) => f.getProjectionField());

        // const projection = this.getProjectionMap(
        //     targetNode,
        //     Array.from(new Set([...projectionFields, ...sortProjectionFields])) // TODO remove duplicates
        // );

        if (filterPredicates) {
            matchClause.where(filterPredicates);
        }
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(targetNode));
        const ret = this.getProjectionClause(targetNode, returnVariable);
        // const ret = new Cypher.With([projection, targetNode]).return([Cypher.collect(targetNode), returnVariable]);

        let sortClause: Cypher.With | undefined;
        if (this.sortFields.length > 0 || this.pagination) {
            sortClause = new Cypher.With("*");
            this.addSortToClause(targetNode, sortClause);
        }
        const clause = Cypher.concat(matchClause, subqueries, sortClause, ret);

        return {
            clauses: [clause],
            projectionExpr: returnVariable,
        };
    }

    protected getProjectionClause(target: Cypher.Node, returnVariable: Cypher.Variable): Cypher.Return {
        const projectionFields = this.fields.map((f) => f.getProjectionField(target));
        const sortProjectionFields = this.sortFields.map((f) => f.getProjectionField());

        const projection = this.getProjectionMap(
            target,
            Array.from(new Set([...projectionFields, ...sortProjectionFields])) // TODO remove duplicates
        );
        return new Cypher.With([projection, target]).return([Cypher.collect(target), returnVariable]);
    }

    private getPredicates(target: Cypher.Node): Cypher.Predicate | undefined {
        return Cypher.and(...this.filters.map((f) => f.getPredicate(target)));
    }

    public transpile({ returnVariable, parentNode }: OperationTranspileOptions): OperationTranspileResult {
        if (this.entity instanceof Relationship) {
            return this.transpileNestedRelationship(this.entity, { returnVariable, parentNode });
        }
        const node = createNodeFromEntity(this.entity, this.nodeAlias);

        const filterSubqueries = this.filters
            .flatMap((f) => f.getSubqueries(node))
            .map((sq) => new Cypher.Call(sq).innerWith(node));
        const filterPredicates = this.getPredicates(node);
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(node));

        const projectionFields = this.fields.map((f) => f.getProjectionField(node));
        const sortProjectionFields = this.sortFields.map((f) => f.getProjectionField());

        const projection = this.getProjectionMap(
            node,
            Array.from(new Set([...projectionFields, ...sortProjectionFields])) // TODO remove duplicates
        );

        const matchClause = new Cypher.Match(node);

        let filterSubqueryWith: Cypher.With | undefined;
        let filterSubqueriesClause: Cypher.Clause | undefined = undefined;

        if (filterSubqueries.length > 0) {
            filterSubqueriesClause = Cypher.concat(...filterSubqueries);
            filterSubqueryWith = new Cypher.With("*");
        }

        if (filterPredicates) {
            if (filterSubqueryWith) {
                filterSubqueryWith.where(filterPredicates); // TODO: should this only be for aggregation filters?
            } else {
                matchClause.where(filterPredicates);
            }
        }
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
            subqueries,
            sortClause,
            ret
        );

        return {
            clauses: [clause],
            projectionExpr: returnVariable,
        };
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

    private getProjectionMap(
        node: Cypher.Node,
        projectionFields: Array<string | Record<string, Cypher.Expr>>
    ): Cypher.MapProjection {
        const stringFields: string[] = [];
        let otherFields: Record<string, Cypher.Expr> = {};

        for (const field of projectionFields) {
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
