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

import { mergeDeep } from "@graphql-tools/utils";
import type { FieldsByTypeName, ResolveTree } from "graphql-parse-resolve-info";
import { Integer } from "neo4j-driver";
import type { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { EntityAdapter } from "../../../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { GraphQLOptionsArg } from "../../../types";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { filterTruthy, isRecord } from "../../../utils/utils";
import type { Filter } from "../ast/filters/Filter";
import type { AggregationOperation } from "../ast/operations/AggregationOperation";
import type { ConnectionReadOperation } from "../ast/operations/ConnectionReadOperation";
import type { CypherOperation } from "../ast/operations/CypherOperation";
import type { CypherScalarOperation } from "../ast/operations/CypherScalarOperation";
import type { ReadOperation } from "../ast/operations/ReadOperation";
import type { CompositeAggregationOperation } from "../ast/operations/composite/CompositeAggregationOperation";
import type { CompositeConnectionReadOperation } from "../ast/operations/composite/CompositeConnectionReadOperation";
import type { CompositeCypherOperation } from "../ast/operations/composite/CompositeCypherOperation";
import type { CompositeReadOperation } from "../ast/operations/composite/CompositeReadOperation";
import type { Operation } from "../ast/operations/operations";
import type { FulltextSelection } from "../ast/selection/FulltextSelection";
import type { VectorSelection } from "../ast/selection/VectorSelection";
import { assertIsConcreteEntity, isConcreteEntity } from "../utils/is-concrete-entity";
import { isInterfaceEntity } from "../utils/is-interface-entity";
import { isUnionEntity } from "../utils/is-union-entity";
import type { AuthorizationFactory } from "./AuthorizationFactory";
import type { FieldFactory } from "./FieldFactory";
import type { FilterFactory } from "./FilterFactory";
import { AggregateFactory } from "./Operations/AggregateFactory";
import { ConnectionFactory } from "./Operations/ConnectionFactory";
import { CreateFactory } from "./Operations/CreateFactory";
import { CustomCypherFactory } from "./Operations/CustomCypherFactory";
import { DeleteFactory } from "./Operations/DeleteFactory";
import { FulltextFactory } from "./Operations/FulltextFactory";
import { ReadFactory } from "./Operations/ReadFactory";
import { UpdateFactory } from "./Operations/UpdateFactory";
import { VectorFactory } from "./Operations/VectorFactory";
import type { QueryASTFactory } from "./QueryASTFactory";
import type { SortAndPaginationFactory } from "./SortAndPaginationFactory";
import { parseTopLevelOperationField } from "./parsers/parse-operation-fields";
import { parseSelectionSetField } from "./parsers/parse-selection-set-fields";

export class OperationsFactory {
    private filterFactory: FilterFactory;
    private fieldFactory: FieldFactory;
    private sortAndPaginationFactory: SortAndPaginationFactory;
    private authorizationFactory: AuthorizationFactory;
    // specialized operations factories
    private createFactory: CreateFactory;
    private updateFactory: UpdateFactory;
    private deleteFactory: DeleteFactory;
    private fulltextFactory: FulltextFactory;
    private aggregateFactory: AggregateFactory;
    private customCypherFactory: CustomCypherFactory;
    private connectionFactory: ConnectionFactory;
    private readFactory: ReadFactory;
    private vectorFactory: VectorFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.filterFactory = queryASTFactory.filterFactory;
        this.fieldFactory = queryASTFactory.fieldFactory;
        this.sortAndPaginationFactory = queryASTFactory.sortAndPaginationFactory;
        this.authorizationFactory = queryASTFactory.authorizationFactory;
        this.createFactory = new CreateFactory(queryASTFactory);
        this.updateFactory = new UpdateFactory(queryASTFactory);
        this.deleteFactory = new DeleteFactory(queryASTFactory);
        this.fulltextFactory = new FulltextFactory(queryASTFactory);
        this.aggregateFactory = new AggregateFactory(queryASTFactory);
        this.customCypherFactory = new CustomCypherFactory(queryASTFactory);
        this.connectionFactory = new ConnectionFactory(queryASTFactory);
        this.readFactory = new ReadFactory(queryASTFactory);
        this.vectorFactory = new VectorFactory(queryASTFactory);
    }

    public createTopLevelOperation({
        entity,
        resolveTree,
        context,
        varName,
        reference,
        resolveAsUnwind = false,
    }: {
        entity?: EntityAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        varName?: string;
        reference?: any;
        resolveAsUnwind?: boolean;
    }): Operation {
        // Handles deprecated top level fulltext
        if (
            entity &&
            isConcreteEntity(entity) &&
            Boolean(entity.annotations.fulltext) &&
            context.fulltext &&
            context.resolveTree.args.phrase
        ) {
            const indexName = context.fulltext.indexName ?? context.fulltext.name;
            if (indexName === undefined) {
                throw new Error("The name of the fulltext index should be defined using the indexName argument.");
            }
            assertIsConcreteEntity(entity);
            return this.fulltextFactory.createFulltextOperation(entity, resolveTree, context);
        }

        const operationMatch = parseTopLevelOperationField(resolveTree.name, context, entity);
        switch (operationMatch) {
            case "READ": {
                if (context.resolveTree.args.fulltext || context.resolveTree.args.phrase) {
                    assertIsConcreteEntity(entity);
                    return this.fulltextFactory.createFulltextOperation(entity, resolveTree, context);
                }
                if (!entity) {
                    throw new Error("Entity is required for top level read operations");
                }
                return this.readFactory.createReadOperation({
                    entityOrRel: entity,
                    resolveTree,
                    context,
                    varName,
                    reference,
                });
            }
            case "VECTOR": {
                if (!entity) {
                    throw new Error("Entity is required for top level connection read operations");
                }
                if (!isConcreteEntity(entity)) {
                    throw new Error("Vector operations are only supported on concrete entities");
                }

                return this.vectorFactory.createVectorOperation(entity, resolveTree, context);
            }
            case "CONNECTION": {
                if (!entity) {
                    throw new Error("Entity is required for top level connection read operations");
                }
                const topLevelConnectionResolveTree =
                    this.connectionFactory.normalizeResolveTreeForTopLevelConnection(resolveTree);
                return this.connectionFactory.createConnectionOperationAST({
                    target: entity,
                    resolveTree: topLevelConnectionResolveTree,
                    context,
                });
            }
            case "AGGREGATE": {
                if (!entity || isUnionEntity(entity)) {
                    throw new Error("Aggregate operations are not supported for Union types");
                }
                return this.aggregateFactory.createAggregationOperation(entity, resolveTree, context);
            }
            case "CREATE": {
                assertIsConcreteEntity(entity);
                if (resolveAsUnwind) {
                    return this.createFactory.createUnwindCreateOperation(entity, resolveTree, context);
                }
                return this.createFactory.createCreateOperation(entity, resolveTree, context);
            }
            case "UPDATE": {
                assertIsConcreteEntity(entity);
                return this.updateFactory.createUpdateOperation(entity, resolveTree, context);
            }
            case "DELETE": {
                assertIsConcreteEntity(entity);
                return this.deleteFactory.createTopLevelDeleteOperation({
                    entity,
                    resolveTree,
                    context,
                    varName,
                });
            }
            case "CUSTOM_CYPHER": {
                return this.customCypherFactory.createTopLevelCustomCypherOperation({ entity, resolveTree, context });
            }
            default: {
                throw new Error(`Unsupported top level operation: ${resolveTree.name}`);
            }
        }
    }
    /**
     *  Proxy methods to specialized operations factories.
     *  TODO: Refactor the following to use a generic dispatcher as done in createTopLevelOperation
     **/
    public createReadOperation(arg: {
        entityOrRel: EntityAdapter | RelationshipAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        varName?: string;
        reference?: any;
    }): ReadOperation | CompositeReadOperation {
        return this.readFactory.createReadOperation(arg);
    }

    public getFulltextSelection(
        entity: ConcreteEntityAdapter,
        context: Neo4jGraphQLTranslationContext
    ): FulltextSelection {
        return this.fulltextFactory.getFulltextSelection(entity, context);
    }

    public getVectorSelection(entity: ConcreteEntityAdapter, context: Neo4jGraphQLTranslationContext): VectorSelection {
        return this.vectorFactory.getVectorSelection(entity, context);
    }

    public createAggregationOperation(
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter | InterfaceEntityAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): AggregationOperation | CompositeAggregationOperation {
        return this.aggregateFactory.createAggregationOperation(entityOrRel, resolveTree, context);
    }

    public splitConnectionFields(rawFields: Record<string, ResolveTree>): {
        node: ResolveTree | undefined;
        edge: ResolveTree | undefined;
        fields: Record<string, ResolveTree>;
    } {
        return this.connectionFactory.splitConnectionFields(rawFields);
    }

    public createConnectionOperationAST(arg: {
        relationship?: RelationshipAdapter;
        target: ConcreteEntityAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
    }): ConnectionReadOperation | CompositeConnectionReadOperation {
        return this.connectionFactory.createConnectionOperationAST(arg);
    }

    public createCompositeConnectionOperationAST(arg: {
        relationship?: RelationshipAdapter;
        target: InterfaceEntityAdapter | UnionEntityAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
    }): CompositeConnectionReadOperation {
        return this.connectionFactory.createCompositeConnectionOperationAST(arg);
    }

    public hydrateReadOperation<T extends ReadOperation>(arg: {
        entity: ConcreteEntityAdapter;
        operation: T;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        whereArgs: Record<string, any> | Filter[];
        partialOf?: InterfaceEntityAdapter | UnionEntityAdapter;
    }): T {
        return this.readFactory.hydrateReadOperation(arg);
    }

    public hydrateConnectionOperation<T extends ConnectionReadOperation>(arg: {
        relationship?: RelationshipAdapter;
        target: ConcreteEntityAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        operation: T;
        whereArgs: Record<string, any>;
        resolveTreeEdgeFields: Record<string, ResolveTree>;
    }): T {
        return this.connectionFactory.hydrateConnectionOperationAST(arg);
    }

    public createCustomCypherOperation(arg: {
        resolveTree?: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        entity?: EntityAdapter;
        cypherAttributeField: AttributeAdapter;
        cypherArguments?: Record<string, any>;
    }): CypherOperation | CompositeCypherOperation | CypherScalarOperation {
        return this.customCypherFactory.createCustomCypherOperation(arg);
    }
    /**
     * END of proxy methods
     **/

    public hydrateOperation<T extends ReadOperation>({
        entity,
        operation,
        whereArgs,
        context,
        sortArgs,
        fieldsByTypeName,
        partialOf,
    }: {
        entity: ConcreteEntityAdapter;
        operation: T;
        context: Neo4jGraphQLTranslationContext;
        whereArgs: Record<string, any>;
        sortArgs?: Record<string, any>;
        fieldsByTypeName: FieldsByTypeName;
        partialOf?: UnionEntityAdapter | InterfaceEntityAdapter;
    }): T {
        const concreteProjectionFields = { ...fieldsByTypeName[entity.name] };
        // Get the abstract types of the interface
        const entityInterfaces = entity.compositeEntities;

        const interfacesFields = filterTruthy(entityInterfaces.map((i) => fieldsByTypeName[i.name]));

        const projectionFields = mergeDeep<Record<string, ResolveTree>[]>([
            ...interfacesFields,
            concreteProjectionFields,
        ]);
        const fields = this.fieldFactory.createFields(entity, projectionFields, context);

        if (partialOf && isInterfaceEntity(partialOf)) {
            const filters = this.filterFactory.createInterfaceNodeFilters({
                entity: partialOf,
                targetEntity: entity,
                whereFields: whereArgs,
            });
            operation.addFilters(...filters);
        } else {
            const filters = this.filterFactory.createNodeFilters(entity, whereArgs, context);
            operation.addFilters(...filters);
        }

        const authFilters = this.authorizationFactory.getAuthFilters({
            entity,
            operations: ["READ"],
            attributes: this.getSelectedAttributes(entity, projectionFields),
            context,
        });

        operation.setFields(fields);

        operation.addAuthFilters(...authFilters);

        if (sortArgs) {
            const sortOptions = this.getOptions(entity, sortArgs);

            if (sortOptions) {
                const sort = this.sortAndPaginationFactory.createSortFields(sortOptions, entity, context);
                operation.addSort(...sort);

                const pagination = this.sortAndPaginationFactory.createPagination(sortOptions);
                if (pagination) {
                    operation.addPagination(pagination);
                }
            }
        }
        return operation;
    }

    public getOptions(entity: EntityAdapter, options?: Record<string, any>): GraphQLOptionsArg | undefined {
        if (!options) {
            return undefined;
        }
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

    public getSelectedAttributes(
        entity: ConcreteEntityAdapter,
        rawFields: Record<string, ResolveTree>
    ): AttributeAdapter[] {
        return filterTruthy(
            Object.values(rawFields).map((field: ResolveTree) => {
                const { fieldName } = parseSelectionSetField(field.name);
                return entity.findAttribute(fieldName);
            })
        );
    }

    public getWhereArgs(resolveTree: ResolveTree, reference?: any): Record<string, any> {
        const whereArgs = isRecord(resolveTree.args.where) ? resolveTree.args.where : {};

        if (resolveTree.name === "_entities" && reference) {
            const { __typename, ...referenceWhere } = reference;
            return { ...referenceWhere, ...whereArgs };
        }
        return whereArgs;
    }
}
