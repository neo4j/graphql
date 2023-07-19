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

import type { ResolveTree } from "graphql-parse-resolve-info";
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { FilterFactory } from "./FilterFactory";
import { FieldFactory } from "./FieldFactory";
import type { QueryASTFactory } from "./QueryASTFactory";
import { Relationship } from "../../../schema-model/relationship/Relationship";
import { ConnectionReadOperation } from "../ast/operations/ConnectionReadOperation";
import { ReadOperation } from "../ast/operations/ReadOperation";
import type { ConnectionSortArg, GraphQLOptionsArg } from "../../../types";
import { SortAndPaginationFactory } from "./SortAndPagintationFactory";
import type { Integer } from "neo4j-driver";
import type { Filter } from "../ast/filters/Filter";
import { AggregationOperation } from "../ast/operations/AggregationOperation";

export class OperationsFactory {
    private filterFactory: FilterFactory;
    private fieldFactory: FieldFactory;
    private sortAndPaginationFactory: SortAndPaginationFactory;
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
        this.filterFactory = new FilterFactory(queryASTFactory);
        this.fieldFactory = new FieldFactory(queryASTFactory);
        this.sortAndPaginationFactory = new SortAndPaginationFactory();
    }

    public createReadOperationAST(entityOrRel: ConcreteEntity | Relationship, resolveTree: ResolveTree): ReadOperation {
        const entity = (entityOrRel instanceof Relationship ? entityOrRel.target : entityOrRel) as ConcreteEntity;
        const projectionFields = { ...resolveTree.fieldsByTypeName[entity.name] };

        const whereArgs = (resolveTree.args.where || {}) as Record<string, unknown>;
        const operation = new ReadOperation(entityOrRel, Boolean(resolveTree.args?.directed ?? true));
        const fields = this.fieldFactory.createFields(entity, projectionFields);

        let filters: Filter[];
        if (entityOrRel instanceof Relationship) {
            filters = this.filterFactory.createRelationshipFilters(entityOrRel, whereArgs);
        } else {
            filters = this.filterFactory.createFilters(entityOrRel, whereArgs);
        }
        operation.setFields(fields);
        operation.setFilters(filters);

        const options = resolveTree.args.options as GraphQLOptionsArg | undefined;
        if (options) {
            const sort = this.sortAndPaginationFactory.createSortFields(options, entity);
            operation.addSort(...sort);

            const pagination = this.sortAndPaginationFactory.createPagination(options);
            if (pagination) {
                operation.addPagination(pagination);
            }
        }

        return operation;
    }

    // TODO: dupe from read operation
    public createAggregationOperation(relationship: Relationship, resolveTree: ResolveTree): AggregationOperation {
        const entity = relationship.target as ConcreteEntity;

        const projectionFields = { ...resolveTree.fieldsByTypeName[relationship.getAggregationFieldTypename()] };
        const edgeRawFields = {
            ...projectionFields.edges?.fieldsByTypeName[relationship.getAggregationFieldTypename("edge")],
        };
        const nodeRawFields = {
            ...projectionFields.node?.fieldsByTypeName[relationship.getAggregationFieldTypename("node")],
        };
        delete projectionFields.node;
        delete projectionFields.edge;

        // const projectionFields = { ...resolveTree.fieldsByTypeName[entity.name] };

        const whereArgs = (resolveTree.args.where || {}) as Record<string, unknown>;
        const operation = new AggregationOperation(relationship, Boolean(resolveTree.args?.directed ?? true));
        const fields = this.fieldFactory.createAggregationFields(entity, projectionFields);
        const nodeFields = this.fieldFactory.createAggregationFields(entity, nodeRawFields);

        let filters: Filter[];
        if (relationship instanceof Relationship) {
            filters = this.filterFactory.createRelationshipFilters(relationship, whereArgs);
        } else {
            filters = this.filterFactory.createFilters(relationship, whereArgs);
        }
        operation.setFields(fields);
        operation.setNodeFields(nodeFields);
        operation.setFilters(filters);

        const options = resolveTree.args.options as GraphQLOptionsArg | undefined;
        if (options) {
            const sort = this.sortAndPaginationFactory.createSortFields(options, entity);
            operation.addSort(...sort);

            const pagination = this.sortAndPaginationFactory.createPagination(options);
            if (pagination) {
                operation.addPagination(pagination);
            }
        }

        return operation;
    }

    public createConnectionOperationAST(relationship: Relationship, resolveTree: ResolveTree): ConnectionReadOperation {
        const whereArgs = (resolveTree.args.where || {}) as Record<string, any>;
        const nodeWhere = whereArgs.node || {};
        const edgeWhere = whereArgs.edge || {}; // In nested operations

        const connectionFields = { ...resolveTree.fieldsByTypeName[relationship.connectionFieldTypename] };
        const edgeRawFields = {
            ...connectionFields.edges?.fieldsByTypeName[relationship.relationshipFieldTypename],
        };
        const nodeRawFields = { ...edgeRawFields.node?.fieldsByTypeName[relationship.target.name] };

        delete edgeRawFields.node;
        delete edgeRawFields.edge;

        const directed = Boolean(resolveTree.args.directed) ?? true;

        const operation = new ConnectionReadOperation({ relationship, directed });
        const first = resolveTree.args.first as number | Integer | undefined;
        const sort = resolveTree.args.sort as ConnectionSortArg[];

        if (first) {
            const pagination = this.sortAndPaginationFactory.createPagination({
                limit: first,
            });
            if (pagination) {
                operation.addPagination(pagination);
            }
        }

        if (sort) {
            sort.forEach((options) => {
                const sort = this.sortAndPaginationFactory.createConnectionSortFields(options, relationship);
                operation.addSort(sort);
            });
        }

        const nodeFields = this.fieldFactory.createFields(relationship.target as ConcreteEntity, nodeRawFields);
        const edgeFields = this.fieldFactory.createFields(relationship, edgeRawFields);
        const nodeFilters = this.filterFactory.createFilters(relationship.target as ConcreteEntity, nodeWhere);
        const edgeFilters = this.filterFactory.createRelationshipFilters(relationship, edgeWhere);
        operation.setNodeFields(nodeFields);
        operation.setNodeFilters(nodeFilters);
        operation.setEdgeFilters(edgeFilters);
        operation.setEdgeFields(edgeFields);
        return operation;
    }
}
