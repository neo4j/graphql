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

import { asArray, filterTruthy } from "../../../../utils/utils";
import { createNodeFromEntity, createRelationshipFromEntity } from "../../utils/create-node-from-entity";
import type { Filter } from "../filters/Filter";
import Cypher from "@neo4j/cypher-builder";
import type { OperationTranspileOptions, OperationTranspileResult } from "./operations";
import { Operation } from "./operations";
import type { Pagination } from "../pagination/Pagination";
import type { PropertySort } from "../sort/PropertySort";
import type { AggregationField } from "../fields/aggregation-fields/AggregationField";
import { QueryASTContext } from "../QueryASTContext";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";

// TODO: somewhat dupe of readOperation
export class AggregationOperation extends Operation {
    public readonly entity: ConcreteEntityAdapter | RelationshipAdapter; // TODO: normal entities
    protected directed: boolean;

    public fields: AggregationField[] = []; // Aggregation fields
    public nodeFields: AggregationField[] = []; // Aggregation node fields
    public edgeFields: AggregationField[] = []; // Aggregation node fields

    public aggregationProjectionMap = new Cypher.Map();

    protected filters: Filter[] = [];
    protected pagination: Pagination | undefined;
    protected sortFields: PropertySort[] = [];

    public nodeAlias: string | undefined; // This is just to maintain naming with the old way (this), remove after refactor

    constructor(entity: ConcreteEntityAdapter | RelationshipAdapter, directed = true) {
        super();
        this.entity = entity;
        this.directed = directed;
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
        entity: RelationshipAdapter,
        field: AggregationField,
        pattern: Cypher.Pattern,
        target: Cypher.Variable,
        { returnVariable, parentNode }: OperationTranspileOptions,
        queryASTContext: QueryASTContext
    ): Cypher.Clause {
        const matchClause = new Cypher.Match(pattern);
        const filterPredicates = this.getPredicates(queryASTContext);

        if (filterPredicates) {
            matchClause.where(filterPredicates);
        }
        // const subqueries = Cypher.concat(...this.getFieldsSubqueries(targetNode));
        const ret = this.getFieldProjectionClause(target, returnVariable, field);
        // const ret = new Cypher.With([projection, targetNode]).return([Cypher.collect(targetNode), returnVariable]);

        let sortClause: Cypher.With | undefined;
        if (this.sortFields.length > 0 || this.pagination) {
            sortClause = new Cypher.With("*");
            this.addSortToClause(target, sortClause);
        }
        // return Cypher.concat(matchClause, subqueries, sortClause, ret);
        return Cypher.concat(matchClause, sortClause, ret);
    }

    private transpileNestedRelationship(
        // Create new Clause per field
        entity: RelationshipAdapter,
        { parentNode }: OperationTranspileOptions
    ): Cypher.Clause[] {
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

        const nestedContext = new QueryASTContext({ target: targetNode, relationship: relVar, source: parentNode });
        const fieldSubqueries = this.fields.map((f) => {
            const returnVariable = new Cypher.Variable();
            this.aggregationProjectionMap.set(f.getProjectionField(returnVariable));
            return this.createSubquery(entity, f, pattern, targetNode, { returnVariable, parentNode }, nestedContext);
        });

        const nodeMap = new Cypher.Map();
        const edgeMap = new Cypher.Map();
        const nodeFieldSubqueries = this.nodeFields.map((f) => {
            const returnVariable = new Cypher.Variable();
            nodeMap.set(f.getProjectionField(returnVariable));
            return this.createSubquery(entity, f, pattern, targetNode, { returnVariable, parentNode }, nestedContext);
        });
        const edgeFieldSubqueries = this.edgeFields.map((f) => {
            const returnVariable = new Cypher.Variable();
            edgeMap.set(f.getProjectionField(returnVariable));
            return this.createSubquery(entity, f, pattern, relVar, { returnVariable, parentNode }, nestedContext);
        });

        if (nodeMap.size > 0) {
            this.aggregationProjectionMap.set("node", nodeMap);
        }
        if (edgeMap.size > 0) {
            this.aggregationProjectionMap.set("edge", edgeMap);
        }

        return [...fieldSubqueries, ...nodeFieldSubqueries, ...edgeFieldSubqueries];
    }

    protected getFieldProjectionClause(
        target: Cypher.Variable,
        returnVariable: Cypher.Variable,
        field: AggregationField
    ): Cypher.Clause {
        return field.getAggregationProjection(target, returnVariable);
    }

    private getPredicates(queryASTContext: QueryASTContext): Cypher.Predicate | undefined {
        return Cypher.and(...this.filters.map((f) => f.getPredicate(queryASTContext)));
    }

    public transpile({ returnVariable, parentNode }: OperationTranspileOptions): OperationTranspileResult {
        const clauses = this.transpileNestedRelationship(this.entity as RelationshipAdapter, { returnVariable, parentNode });
        return {
            clauses,
            projectionExpr: this.aggregationProjectionMap,
        };
    }

    protected getFieldsSubqueries(node: Cypher.Node): Cypher.Clause[] {
        return filterTruthy(
            this.fields.map((f) => {
                return f.getSubqueries(node);
            })
        ).map((sq) => {
            return new Cypher.Call(Cypher.concat(...asArray(sq))).innerWith(node);
        });
    }

    private addSortToClause(node: Cypher.Variable, clause: Cypher.With | Cypher.Return): void {
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

    public setEdgeFields(fields: AggregationField[]) {
        this.edgeFields = fields;
    }
}
