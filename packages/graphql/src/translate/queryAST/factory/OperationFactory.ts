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
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import { ConnectionReadOperation } from "../ast/operations/ConnectionReadOperation";
import { ReadOperation } from "../ast/operations/ReadOperation";
import type { ConnectionSortArg, GraphQLOptionsArg } from "../../../types";
import { SortAndPaginationFactory } from "./SortAndPagintationFactory";
import type { Integer } from "neo4j-driver";

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

    public createReadOperationAST(entity: ConcreteEntity, resolveTree: ResolveTree): ReadOperation {
        const projectionFields = { ...resolveTree.fieldsByTypeName[entity.name] };
        const whereArgs = (resolveTree.args.where || {}) as Record<string, unknown>;
        const operation = new ReadOperation(entity);
        const fields = this.fieldFactory.createFields(entity, projectionFields);
        const filters = this.filterFactory.createFilters(entity, whereArgs);
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

        const operation = new ConnectionReadOperation(relationship);
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
            // TODO: check why it is an array
            const sortOptions = sort.reduce((acc, r) => {
                return { ...acc, ...r };
            }, {});
            const sortFields = this.sortAndPaginationFactory.createConnectionSortFields(sortOptions, relationship);
            operation.addSort(sortFields.node, sortFields.edge);
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
