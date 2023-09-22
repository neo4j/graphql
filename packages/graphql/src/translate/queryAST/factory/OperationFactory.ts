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
import { filterTruthy, isObject, isString } from "../../../utils/utils";
import { parseSelectionSetField } from "./parsers/parse-selection-set-fields";
import type { AuthorizationFilters } from "../ast/filters/authorization-filters/AuthorizationFilters";
import { isInterfaceEntity } from "../utils/is-interface-entity";
import { getConcreteEntitiesInOnArgumentOfWhere } from "../utils/get-concrete-entities-in-on-argument-of-where";
import { checkEntityAuthentication } from "../../authorization/check-authentication";
import { mergeDeep } from "@graphql-tools/utils";
import { cursorToOffset } from "graphql-relay";

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

    private createAttributeAuthFilters({
        entity,
        rawFields,
        context,
    }: {
        entity: ConcreteEntityAdapter;
        rawFields: Record<string, ResolveTree>;
        context: Neo4jGraphQLTranslationContext;
    }): AuthorizationFilters[] {
        return filterTruthy(
            Object.values(rawFields).map((field: ResolveTree): AuthorizationFilters | undefined => {
                const { fieldName, isConnection, isAggregation } = parseSelectionSetField(field.name);
                const attribute = entity.findAttribute(fieldName);
                if (!attribute) return undefined;
                const result = this.authorizationFactory.createAttributeAuthFilters(
                    attribute,
                    entity,
                    ["READ"],
                    context
                );

                return result;
            })
        );
    }

    public createReadOperationAST(
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): ReadOperation | InterfaceReadOperation {
        const entity = entityOrRel instanceof RelationshipAdapter ? entityOrRel.target : entityOrRel;
        const relationship = entityOrRel instanceof RelationshipAdapter ? entityOrRel : undefined;
        const resolveTreeWhere: Record<string, any> = isObject(resolveTree.args.where) ? resolveTree.args.where : {};
        if (isConcreteEntity(entity)) {
            checkEntityAuthentication({
                entity: entity.entity,
                targetOperations: ["READ"],
                context,
            });
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
            const concreteEntities = getConcreteEntitiesInOnArgumentOfWhere(entity, resolveTreeWhere);
            const concreteReadOperations = concreteEntities.map((concreteEntity: ConcreteEntityAdapter) => {
                const readPartial = new InterfaceReadPartial({
                    relationship,
                    directed: Boolean(resolveTree.args?.directed ?? true),
                    target: concreteEntity,
                });

                const whereArgs = getConcreteWhere(entity, concreteEntity, resolveTreeWhere);

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
        operation: InterfaceReadOperation | ReadOperation,
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
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): AggregationOperation {
        const entity = relationship.target as ConcreteEntityAdapter;
        if (isConcreteEntity(entity)) {
            checkEntityAuthentication({
                entity: entity.entity,
                targetOperations: ["AGGREGATE"],
                context,
            });
        }

        const rawProjectionFields = { ...resolveTree.fieldsByTypeName[relationship.getAggregationFieldTypename()] };
        const parsedProjectionFields = this.splitConnectionFields(rawProjectionFields);
        const projectionFields = parsedProjectionFields.fields;

        const edgeRawFields = {
            ...parsedProjectionFields.edge?.fieldsByTypeName[relationship.getAggregationFieldTypename("edge")],
        };
        const nodeRawFields = {
            ...parsedProjectionFields.node?.fieldsByTypeName[relationship.getAggregationFieldTypename("node")],
        };

        const whereArgs = (resolveTree.args.where || {}) as Record<string, unknown>;
        const operation = new AggregationOperation(relationship, Boolean(resolveTree.args?.directed ?? true));
        const fields = this.fieldFactory.createAggregationFields(entity, projectionFields);
        const nodeFields = this.fieldFactory.createAggregationFields(entity, nodeRawFields);
        const edgeFields = this.fieldFactory.createAggregationFields(relationship, edgeRawFields);
        const authFilters = this.authorizationFactory.createEntityAuthFilters(entity, ["AGGREGATE"], context);

        const filters = this.filterFactory.createNodeFilters(
            relationship.target as ConcreteEntityAdapter | InterfaceEntityAdapter,
            whereArgs
        ); // Aggregation filters only apply to target node

        operation.setFields(fields);
        operation.setNodeFields(nodeFields);
        operation.setEdgeFields(edgeFields);
        operation.setFilters(filters);

        if (authFilters) {
            operation.addAuthFilters(authFilters);
        }

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
        const resolveTreeWhere: Record<string, any> = isObject(resolveTree.args.where) ? resolveTree.args.where : {};

        if (isConcreteEntity(target)) {
            checkEntityAuthentication({
                entity: target.entity,
                targetOperations: ["READ"],
                context,
            });

            const operation = new ConnectionReadOperation({ relationship, directed, target });

            return this.hydrateConnectionOperationAST({
                relationship,
                target: target,
                resolveTree,
                context,
                operation,
                whereArgs: resolveTreeWhere,
            });
        } else {
            let concreteConnectionOperations: ConnectionReadOperation[] = [];
            let nodeWhere: Record<string, any>;
            if (isInterfaceEntity(target)) {
                nodeWhere = isObject(resolveTreeWhere) ? resolveTreeWhere.node : {};
            } else {
                nodeWhere = resolveTreeWhere;
            }

            const concreteEntities = getConcreteEntitiesInOnArgumentOfWhere(target, nodeWhere);
            concreteConnectionOperations = concreteEntities.map((concreteEntity: ConcreteEntityAdapter) => {
                const connectionPartial = new InterfaceConnectionPartial({
                    relationship,
                    directed,
                    target: concreteEntity,
                });
                // nodeWhere with the shared filters applied
                const concreteNodeWhere = getConcreteWhere(target, concreteEntity, nodeWhere);
                let whereArgs: Record<string, any>;
                if (isInterfaceEntity(target)) {
                    whereArgs = { edge: resolveTreeWhere.edge ?? {}, node: concreteNodeWhere };
                } else {
                    whereArgs = concreteNodeWhere;
                }

                return this.hydrateConnectionOperationAST({
                    relationship,
                    target: concreteEntity,
                    resolveTree,
                    context,
                    operation: connectionPartial,
                    whereArgs: whereArgs,
                });
            });

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

        const afterArg = options?.after;
        const offset = isString(afterArg) ? cursorToOffset(afterArg) + 1 : undefined;

        if (first || offset) {
            const pagination = this.sortAndPaginationFactory.createPagination({
                limit: first,
                offset,
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

    private findFieldsByNameInResolveTree(
        resolveTreeObject: Record<string, ResolveTree>,
        fieldName: string
    ): ResolveTree[] {
        return Object.values(resolveTreeObject).filter((resolveTreeField) => resolveTreeField.name === fieldName);
    }

    private hydrateConnectionOperationAST<T extends ConnectionReadOperation>({
        relationship,
        target,
        resolveTree,
        context,
        operation,
        whereArgs,
    }: {
        relationship: RelationshipAdapter;
        target: ConcreteEntityAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        operation: T;
        whereArgs: Record<string, any>;
    }): T {
        const resolveTreeConnectionFields = { ...resolveTree.fieldsByTypeName[relationship.connectionFieldTypename] };

        const edgeFieldsRaw = this.findFieldsByNameInResolveTree(resolveTreeConnectionFields, "edges");
        const resolveTreeEdgeFields: Record<string, ResolveTree> =
            mergeDeep(
                filterTruthy(
                    edgeFieldsRaw.map(
                        (edgeField) => edgeField?.fieldsByTypeName[relationship.relationshipFieldTypename]
                    )
                )
            ) ?? {};
        const nodeFieldsRaw = this.findFieldsByNameInResolveTree(resolveTreeEdgeFields, "node");
        const resolveTreeNodeFields: Record<string, ResolveTree> =
            mergeDeep(
                filterTruthy(
                    nodeFieldsRaw.map((nodeField) => ({
                        ...nodeField?.fieldsByTypeName[target.name],
                        ...nodeField?.fieldsByTypeName[relationship.target.name],
                    }))
                )
            ) ?? {};

        this.hydrateConnectionOperationsASTWithSort({
            relationship,
            resolveTree,
            operation,
        });

        const nodeFields = this.fieldFactory.createFields(target, resolveTreeNodeFields, context);
        const edgeFields = this.fieldFactory.createFields(relationship, resolveTreeEdgeFields, context);
        const authFilters = this.authorizationFactory.createEntityAuthFilters(target, ["READ"], context);
        const authNodeAttributeFilters = this.createAttributeAuthFilters({
            entity: target,
            context,
            rawFields: resolveTreeNodeFields,
        });

        const filters = this.filterFactory.createConnectionPredicates(relationship, target, whereArgs);
        operation.setNodeFields(nodeFields);
        operation.setEdgeFields(edgeFields);
        operation.setFilters(filters);
        if (authFilters) {
            operation.addAuthFilters(authFilters);
        }

        if (authNodeAttributeFilters) {
            operation.addAuthFilters(...authNodeAttributeFilters);
        }

        return operation;
    }

    private splitConnectionFields(rawFields: Record<string, ResolveTree>): {
        node: ResolveTree | undefined;
        edge: ResolveTree | undefined;
        fields: Record<string, ResolveTree>;
    } {
        let nodeField: ResolveTree | undefined;
        let edgeField: ResolveTree | undefined;

        const fields: Record<string, ResolveTree> = {};

        Object.entries(rawFields).forEach(([key, field]) => {
            if (field.name === "node") {
                nodeField = field;
            } else if (field.name === "edge") {
                edgeField = field;
            } else {
                fields[key] = field;
            }
        });

        return {
            node: nodeField,
            edge: edgeField,
            fields,
        };
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

        const interfacesFields = filterTruthy(entityInterfaces.map((i) => resolveTree.fieldsByTypeName[i.name]));

        projectionFields = mergeDeep<Record<string, ResolveTree>[]>([...interfacesFields, projectionFields]);

        const fields = this.fieldFactory.createFields(entity, projectionFields, context);

        const authFilters = this.authorizationFactory.createEntityAuthFilters(entity, ["READ"], context);
        const authAttributeFilters = this.createAttributeAuthFilters({
            entity,
            context,
            rawFields: projectionFields,
        });

        const filters = this.filterFactory.createNodeFilters(entity, whereArgs);

        operation.setFields(fields);
        operation.setFilters(filters);
        if (authFilters) {
            operation.addAuthFilters(authFilters, ...authAttributeFilters);
        }
        if (authAttributeFilters) {
            operation.addAuthFilters(...authAttributeFilters);
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
