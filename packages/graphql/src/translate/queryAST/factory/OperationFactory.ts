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
import type { ConnectionQueryArgs, GraphQLOptionsArg } from "../../../types";
import { SortAndPaginationFactory } from "./SortAndPaginationFactory";
import { Integer } from "neo4j-driver";
import { AggregationOperation } from "../ast/operations/AggregationOperation";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { AuthorizationFactory } from "./AuthorizationFactory";
import { AuthFilterFactory } from "./AuthFilterFactory";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { InterfaceConnectionReadOperation } from "../ast/operations/interfaces/InterfaceConnectionReadOperation";
import { isConcreteEntity } from "../utils/is-concrete-entity";
import { InterfaceConnectionPartial } from "../ast/operations/interfaces/InterfaceConnectionPartial";
import type { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { InterfaceReadOperation } from "../ast/operations/interfaces/InterfaceReadOperation";
import { InterfaceReadPartial } from "../ast/operations/interfaces/InterfaceReadPartial";
import { isUnionEntity } from "../utils/is-union-entity";
import { getConcreteWhere } from "../utils/get-concrete-where";

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
        context: Neo4jGraphQLTranslationContext
    ): ReadOperation | InterfaceReadOperation {
        const entity = entityOrRel instanceof RelationshipAdapter ? entityOrRel.target : entityOrRel;
        const relationship = entityOrRel instanceof RelationshipAdapter ? entityOrRel : undefined;
        const resolveTreeWhere = (resolveTree.args.where ?? {}) as Record<string, any>;
        if (isConcreteEntity(entity)) {
            const operation = new ReadOperation({
                target: entity,
                relationship,
                directed: Boolean(resolveTree.args?.directed ?? true),
            });

            return this.hydrateReadOperation({
                operation,
                entity,
                resolveTree,
                context,
                whereArgs: resolveTreeWhere,
            });
        } else {
            const concreteReadOperations = entity.concreteEntities.map((concreteEntity: ConcreteEntityAdapter) => {
                const readPartial = new InterfaceReadPartial({
                    relationship,
                    directed: Boolean(resolveTree.args?.directed ?? true),
                    target: concreteEntity,
                });

                const whereArgs = getConcreteWhere(resolveTreeWhere, entity, concreteEntity);

                return this.hydrateReadOperation({
                    entity: concreteEntity,
                    resolveTree,
                    context,
                    operation: readPartial,
                    whereArgs: whereArgs,
                });
            });

            const interfaceReadOp = new InterfaceReadOperation({
                interfaceEntity: entity,
                children: concreteReadOperations,
                relationship,
            });
            this.hydrateInterfaceReadOperationWithPagination(entity, interfaceReadOp, resolveTree);
            return interfaceReadOp;
        }
    }

    private hydrateInterfaceReadOperationWithPagination(
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter,
        operation:  InterfaceReadOperation | ReadOperation,
        resolveTree: ResolveTree
    ) {
        const options = this.getOptions(entity, (resolveTree.args.options ?? {}) as any);
        if (options) {
            const sort = this.sortAndPaginationFactory.createSortFields(options, entity);
            operation.addSort(...sort);

            const pagination = this.sortAndPaginationFactory.createPagination(options);
            if (pagination) {
                operation.addPagination(pagination);
            }
        }
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

        const filters = this.filterFactory.createNodeFilters(
            relationship.target as ConcreteEntityAdapter | InterfaceEntityAdapter,
            whereArgs
        ); // Aggregation filters only apply to target node

        operation.setFields(fields);
        operation.setNodeFields(nodeFields);
        operation.setEdgeFields(edgeFields);
        operation.setFilters(filters);
        // TODO: Duplicate logic with hydrateReadOperationWithPagination, check if it's correct to unify.
        const options = this.getOptions(entity, (resolveTree.args.options ?? {}) as any);
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
        context: Neo4jGraphQLTranslationContext
    ): ConnectionReadOperation | InterfaceConnectionReadOperation {
        const target = relationship.target;

        const directed = Boolean(resolveTree.args.directed) ?? true;
        if (isConcreteEntity(target)) {
            const operation = new ConnectionReadOperation({ relationship, directed, target });

            return this.hydrateConnectionOperationAST({
                relationship,
                target: target,
                resolveTree,
                context,
                operation,
            });
        } else {
            const concreteConnectionOperations = target.concreteEntities.map(
                (concreteEntity: ConcreteEntityAdapter) => {
                    const connectionPartial = new InterfaceConnectionPartial({
                        relationship,
                        directed,
                        target: concreteEntity,
                    });

                    return this.hydrateConnectionOperationAST({
                        relationship,
                        target: concreteEntity,
                        resolveTree,
                        context,
                        operation: connectionPartial,
                    });
                }
            );
            const interfaceConnectionOp = new InterfaceConnectionReadOperation(concreteConnectionOperations);

            // These sort fields will be duplicated on nested "InterfaceConnectionPartial"
            this.hydrateConnectionOperationsASTWithSort({
                relationship,
                resolveTree,
                operation: interfaceConnectionOp,
            });
            return interfaceConnectionOp;
        }
    }

    // eslint-disable-next-line @typescript-eslint/comma-dangle
    private hydrateConnectionOperationsASTWithSort<
        T extends ConnectionReadOperation | InterfaceConnectionReadOperation
    >({
        relationship,
        resolveTree,
        operation,
    }: {
        relationship: RelationshipAdapter;
        resolveTree: ResolveTree;
        operation: T;
    }): T {
        let options: Pick<ConnectionQueryArgs, "first" | "after" | "sort"> | undefined;

        if (!isUnionEntity(relationship.target)) {
            options = this.getConnectionOptions(relationship.target, resolveTree.args);
        } else {
            options = resolveTree.args;
        }
        const first = options?.first;
        const sort = options?.sort;
        // const after = options?.after;

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

        return operation;
    }

    private hydrateConnectionOperationAST<T extends ConnectionReadOperation>({
        relationship,
        target,
        resolveTree,
        context,
        operation,
    }: {
        relationship: RelationshipAdapter;
        target: ConcreteEntityAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        operation: T;
    }): T {
        let whereArgs = (resolveTree.args.where || {}) as Record<string, any>;
        const connectionFields = { ...resolveTree.fieldsByTypeName[relationship.connectionFieldTypename] };
        const edgeRawFields = {
            ...connectionFields.edges?.fieldsByTypeName[relationship.relationshipFieldTypename],
        };

        // Getting fields for relationship and target to get both, interface and concrete entity types
        const nodeRawFields = {
            ...edgeRawFields.node?.fieldsByTypeName[target.name],
            ...edgeRawFields.node?.fieldsByTypeName[relationship.target.name],
        };

        delete edgeRawFields.node;
        delete edgeRawFields.edge;

        this.hydrateConnectionOperationsASTWithSort({
            relationship,
            resolveTree,
            operation,
        });

        const nodeFields = this.fieldFactory.createFields(target, nodeRawFields, context);
        const edgeFields = this.fieldFactory.createFields(relationship, edgeRawFields, context);
        const authFilters = this.authorizationFactory.createEntityAuthFilters(target, ["READ"], context);

        if (isUnionEntity(relationship.target)) {
            // Small hack due to where arguments being one level nested for unions
            whereArgs = whereArgs[target.name];
        }

        const filters = this.filterFactory.createConnectionPredicates(relationship, target, whereArgs);
        operation.setNodeFields(nodeFields);
        operation.setEdgeFields(edgeFields);
        operation.setFilters(filters);
        if (authFilters) {
            operation.setAuthFilters(authFilters);
        }
        return operation;
    }

    private hydrateReadOperation<T extends ReadOperation>({
        entity,
        operation,
        resolveTree,
        context,
        whereArgs,
    }: {
        entity: ConcreteEntityAdapter;
        operation: T;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        whereArgs: Record<string, any>;
    }): T {
        let projectionFields = { ...resolveTree.fieldsByTypeName[entity.name] };

        // Get the abstract types of the interface
        const entityInterfaces = entity.compositeEntities;
        for (const interfaceEntity of entityInterfaces) {
            projectionFields = { ...resolveTree.fieldsByTypeName[interfaceEntity.name], ...projectionFields };
        }

        const fields = this.fieldFactory.createFields(entity, projectionFields, context);

        const authFilters = this.authorizationFactory.createEntityAuthFilters(entity, ["READ"], context);

        const filters = this.filterFactory.createNodeFilters(entity, whereArgs);

        operation.setFields(fields);
        operation.setFilters(filters);
        if (authFilters) {
            operation.setAuthFilters(authFilters);
        }
        this.hydrateInterfaceReadOperationWithPagination(entity, operation, resolveTree);

        return operation;
    }

    private getOptions(
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter,
        options: Record<string, any>
    ): GraphQLOptionsArg | undefined {
        const limitDirective = isUnionEntity(entity) ? undefined : entity.annotations.limit;

        let limit: Integer | number | undefined = options?.limit ?? limitDirective?.default ?? limitDirective?.max;
        if (limit instanceof Integer) {
            limit = limit.toNumber();
        }
        const maxLimit = limitDirective?.max;
        if (limit !== undefined && maxLimit !== undefined) {
            limit = Math.min(limit, maxLimit);
        }

        if (limit === undefined && options.offset === undefined && options.sort === undefined) return undefined;

        return {
            limit,
            offset: options.offset,
            sort: options.sort,
        };
    }

    private getConnectionOptions(
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter,
        options: Record<string, any>
    ): Pick<ConnectionQueryArgs, "first" | "after" | "sort"> | undefined {
        const limitDirective = entity.annotations.limit;

        let limit: Integer | number | undefined = options?.first ?? limitDirective?.default ?? limitDirective?.max;
        if (limit instanceof Integer) {
            limit = limit.toNumber();
        }
        const maxLimit = limitDirective?.max;
        if (limit !== undefined && maxLimit !== undefined) {
            limit = Math.min(limit, maxLimit);
        }

        if (limit === undefined && options.after === undefined && options.sort === undefined) return undefined;

        return {
            first: limit,
            after: options.after,
            sort: options.sort,
        };
    }
}
