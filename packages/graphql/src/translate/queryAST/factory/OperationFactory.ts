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
import { FilterFactory } from "./FilterFactory";
import { FieldFactory } from "./FieldFactory";
import type { QueryASTFactory } from "./QueryASTFactory";
import { ConnectionReadOperation } from "../ast/operations/ConnectionReadOperation";
import { ReadOperation } from "../ast/operations/ReadOperation";
import type { ConnectionSortArg, Context, GraphQLOptionsArg } from "../../../types";
import { SortAndPaginationFactory } from "./SortAndPaginationFactory";
import type { Integer } from "neo4j-driver";
import type { Filter } from "../ast/filters/Filter";
import { AggregationOperation } from "../ast/operations/AggregationOperation";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { AuthorizationFactory } from "./AuthorizationFactory";
import { AuthFilterFactory } from "./AuthFilterFactory";

export class OperationsFactory {
    private filterFactory: FilterFactory;
    private fieldFactory: FieldFactory;
    private sortAndPaginationFactory: SortAndPaginationFactory;
    private queryASTFactory: QueryASTFactory;
    private authorizationFactory: AuthorizationFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
        this.filterFactory = new FilterFactory(queryASTFactory);
        this.fieldFactory = new FieldFactory(queryASTFactory);
        this.sortAndPaginationFactory = new SortAndPaginationFactory();

        const authFilterFactory = new AuthFilterFactory(queryASTFactory);
        this.authorizationFactory = new AuthorizationFactory(authFilterFactory);
    }

    public createReadOperationAST(
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter,
        resolveTree: ResolveTree,
        context: Context
    ): ReadOperation {
        const entity = (
            entityOrRel instanceof RelationshipAdapter ? entityOrRel.target : entityOrRel
        ) as ConcreteEntityAdapter;
        const projectionFields = { ...resolveTree.fieldsByTypeName[entity.name] };

        const whereArgs = (resolveTree.args.where || {}) as Record<string, unknown>;
        const operation = new ReadOperation(entityOrRel, Boolean(resolveTree.args?.directed ?? true));
        const fields = this.fieldFactory.createFields(entity, projectionFields, context);

        const authFilters = this.authorizationFactory.createEntityAuthFilters(entity, ["READ"], context);

        let filters: Filter[];
        if (entityOrRel instanceof RelationshipAdapter) {
            filters = this.filterFactory.createRelationshipFilters(entityOrRel, whereArgs);
        } else {
            filters = this.filterFactory.createNodeFilters(entityOrRel, whereArgs);
        }
        operation.setFields(fields);
        operation.setFilters(filters);
        if (authFilters) {
            operation.setAuthFilters(authFilters);
        }

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
    public createAggregationOperation(
        relationship: RelationshipAdapter,
        resolveTree: ResolveTree
    ): AggregationOperation {
        const entity = relationship.target as ConcreteEntityAdapter;

        const projectionFields = { ...resolveTree.fieldsByTypeName[relationship.getAggregationFieldTypename()] };
        const edgeRawFields = {
            ...projectionFields.edge?.fieldsByTypeName[relationship.getAggregationFieldTypename("edge")],
        };
        const nodeRawFields = {
            ...projectionFields.node?.fieldsByTypeName[relationship.getAggregationFieldTypename("node")],
        };
        delete projectionFields.node;
        delete projectionFields.edge;

        const whereArgs = (resolveTree.args.where || {}) as Record<string, unknown>;
        const operation = new AggregationOperation(relationship, Boolean(resolveTree.args?.directed ?? true));
        const fields = this.fieldFactory.createAggregationFields(entity, projectionFields);
        const nodeFields = this.fieldFactory.createAggregationFields(entity, nodeRawFields);
        const edgeFields = this.fieldFactory.createAggregationFields(relationship, edgeRawFields);

        const filters = this.filterFactory.createNodeFilters(relationship.target as ConcreteEntityAdapter, whereArgs); // Aggregation filters only apply to target node

        operation.setFields(fields);
        operation.setNodeFields(nodeFields);
        operation.setEdgeFields(edgeFields);
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

    public createConnectionOperationAST(
        relationship: RelationshipAdapter,
        resolveTree: ResolveTree,
        context: Context
    ): ConnectionReadOperation {
        const whereArgs = (resolveTree.args.where || {}) as Record<string, any>;
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

        const nodeFields = this.fieldFactory.createFields(
            relationship.target as ConcreteEntityAdapter,
            nodeRawFields,
            context
        );
        const edgeFields = this.fieldFactory.createFields(relationship, edgeRawFields, context);
        const authFilters = this.authorizationFactory.createEntityAuthFilters(
            relationship.target as ConcreteEntityAdapter,
            ["READ"],
            context
        );

        const filters = this.filterFactory.createConnectionPredicates(relationship, whereArgs);
        operation.setNodeFields(nodeFields);
        operation.setEdgeFields(edgeFields);
        operation.setFilters(filters);
        if (authFilters) {
            operation.setAuthFilters(authFilters);
        }
        operation.setEdgeFields(edgeFields);
        return operation;
    }
}
