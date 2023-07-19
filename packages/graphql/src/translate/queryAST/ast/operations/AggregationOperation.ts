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
import { asArray, filterTruthy } from "../../../../utils/utils";
import { createNodeFromEntity, createRelationshipFromEntity } from "../../utils/create-node-from-entity";
import type { Filter } from "../filters/Filter";
import Cypher from "@neo4j/cypher-builder";
import type { OperationTranspileOptions } from "./operations";
import { Operation } from "./operations";
import type { Pagination } from "../pagination/Pagination";
import type { PropertySort } from "../sort/PropertySort";
import type { QueryASTNode } from "../QueryASTNode";
import { Relationship } from "../../../../schema-model/relationship/Relationship";
import { getRelationshipDirection } from "../../utils/get-relationship-direction";
import type { AggregationField } from "../fields/aggregation-fields/AggregationField";

// TODO: somewhat dupe of readOperation
export class AggregationOperation extends Operation {
    public readonly entity: ConcreteEntity | Relationship; // TODO: normal entities
    protected directed: boolean;

    public fields: AggregationField[] = []; // Aggregation fields
    public nodeFields: AggregationField[] = []; // Aggregation node fields

    public aggregationProjectionMap = new Cypher.Map();

    protected filters: Filter[] = [];
    protected pagination: Pagination | undefined;
    protected sortFields: PropertySort[] = [];

    public nodeAlias: string | undefined; // This is just to maintain naming with the old way (this), remove after refactor

    constructor(entity: ConcreteEntity | Relationship, directed = true) {
        super();
        this.entity = entity;
        this.directed = directed;
    }

    public get children(): QueryASTNode[] {
        return filterTruthy([...this.fields, ...this.filters, ...this.sortFields, this.pagination]);
    }

    public setFields(fields: AggregationField[]) {
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

    private createSubquery(
        entity: Relationship,
        field: AggregationField,
        pattern: Cypher.Pattern,
        targetNode: Cypher.Node,
        { returnVariable, parentNode }: OperationTranspileOptions
    ): Cypher.Clause {
        const matchClause = new Cypher.Match(pattern);
        const filterPredicates = this.getPredicates(targetNode);

        if (filterPredicates) {
            matchClause.where(filterPredicates);
        }
        // const subqueries = Cypher.concat(...this.getFieldsSubqueries(targetNode));
        const ret = this.getFieldProjectionClause(targetNode, returnVariable, field);
        // const ret = new Cypher.With([projection, targetNode]).return([Cypher.collect(targetNode), returnVariable]);

        let sortClause: Cypher.With | undefined;
        if (this.sortFields.length > 0 || this.pagination) {
            sortClause = new Cypher.With("*");
            this.addSortToClause(targetNode, sortClause);
        }
        // return Cypher.concat(matchClause, subqueries, sortClause, ret);
        return Cypher.concat(matchClause, sortClause, ret);
    }

    public transpileNestedRelationship(
        // Create new Clause per field
        entity: Relationship,
        { parentNode }: OperationTranspileOptions
    ): Cypher.Clause[] {
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

        const fieldSubqueries = this.fields.map((f) => {
            const returnVariable = new Cypher.Variable();
            this.aggregationProjectionMap.set(f.getProjectionField(returnVariable));
            return this.createSubquery(entity, f, pattern, targetNode, { returnVariable, parentNode });
        });

        const nodeMap = new Cypher.Map();
        const nodeFieldSubqueries = this.nodeFields.map((f) => {
            const returnVariable = new Cypher.Variable();
            nodeMap.set(f.getProjectionField(returnVariable));
            return this.createSubquery(entity, f, pattern, targetNode, { returnVariable, parentNode });
        });

        if (nodeMap.size > 0) {
            this.aggregationProjectionMap.set("node", nodeMap);
        }

        return [...fieldSubqueries, ...nodeFieldSubqueries];
    }

    protected getProjectionClause(target: Cypher.Node, returnVariable: Cypher.Variable): Cypher.Return {
        const nodeMap = new Cypher.Map();
        this.fields
            .map((f) => f.getProjectionField(returnVariable))
            .forEach((fields) => {
                this.aggregationProjectionMap.set(fields);
            });
        this.nodeFields
            .map((f) => f.getProjectionField(returnVariable))
            .forEach((fields) => {
                nodeMap.set(fields);
            });
        if (nodeMap.size > 0) {
            this.aggregationProjectionMap.set("node", nodeMap);
        }

        const aggExpr = this.fields.map((f) => {
            return f.getAggregationExpr(target);
        });

        return new Cypher.Return([aggExpr[0] as any, returnVariable]);
    }
    protected getFieldProjectionClause(
        target: Cypher.Node,
        returnVariable: Cypher.Variable,
        field: AggregationField
    ): Cypher.Clause {
        return field.getAggregationProjection(target, returnVariable);
    }

    private getPredicates(target: Cypher.Node): Cypher.Predicate | undefined {
        return Cypher.and(...this.filters.map((f) => f.getPredicate(target)));
    }

    // TODO: remove
    public transpile2({ returnVariable, parentNode }: OperationTranspileOptions): Cypher.Clause[] {
        return this.transpileNestedRelationship(this.entity as Relationship, { returnVariable, parentNode });
    }
    public transpile({ returnVariable, parentNode }: OperationTranspileOptions): Cypher.Clause {
        if (this.entity instanceof Relationship) {
            return Cypher.concat(...this.transpileNestedRelationship(this.entity, { returnVariable, parentNode }));
        }
        const node = createNodeFromEntity(this.entity, this.nodeAlias);

        const filterPredicates = this.getPredicates(node);
        const projectionFields = this.fields.map((f) => f.getProjectionField(node));
        const sortProjectionFields = this.sortFields.map((f) => f.getProjectionField());

        const projection = this.getProjectionMap(
            node,
            Array.from(new Set([...projectionFields, ...sortProjectionFields])) // TODO remove duplicates
        );

        const matchClause = new Cypher.Match(node);
        if (filterPredicates) {
            matchClause.where(filterPredicates);
        }
        const subqueries = Cypher.concat(...this.getFieldsSubqueries(node));

        const ret = new Cypher.Return([projection, returnVariable]);

        let sortClause: Cypher.With | undefined;
        if (this.sortFields.length > 0 || this.pagination) {
            sortClause = new Cypher.With("*");
            this.addSortToClause(node, sortClause);
        }
        return Cypher.concat(matchClause, subqueries, sortClause, ret);
    }

    protected getFieldsSubqueries(node: Cypher.Node): Cypher.Clause[] {
        return filterTruthy(
            this.fields.map((f) => {
                return f.getSubquery(node);
            })
        ).map((sq) => {
            return new Cypher.Call(Cypher.concat(...asArray(sq))).innerWith(node);
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

    public setNodeFields(fields: AggregationField[]) {
        this.nodeFields = fields;
    }
}
