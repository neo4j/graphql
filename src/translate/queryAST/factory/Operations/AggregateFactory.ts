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
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import { AggregationOperation } from "../../ast/operations/AggregationOperation";
import { CompositeAggregationOperation } from "../../ast/operations/composite/CompositeAggregationOperation";
import { CompositeAggregationPartial } from "../../ast/operations/composite/CompositeAggregationPartial";
import type { EntitySelection } from "../../ast/selection/EntitySelection";
import { NodeSelection } from "../../ast/selection/NodeSelection";
import { RelationshipSelection } from "../../ast/selection/RelationshipSelection";
import { getConcreteEntities } from "../../utils/get-concrete-entities";
import { isConcreteEntity } from "../../utils/is-concrete-entity";
import { isInterfaceEntity } from "../../utils/is-interface-entity";
import type { QueryASTFactory } from "../QueryASTFactory";

export class AggregateFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    // TODO: dupe from read operation
    public createAggregationOperation(
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter | InterfaceEntityAdapter,
        resolveTree: ResolveTree,
        context: Neo4jGraphQLTranslationContext
    ): AggregationOperation | CompositeAggregationOperation {
        let entity: ConcreteEntityAdapter | InterfaceEntityAdapter;
        if (entityOrRel instanceof RelationshipAdapter) {
            entity = entityOrRel.target as ConcreteEntityAdapter; // TODO: check this seems wrong but outside of the scope of this PR
        } else {
            entity = entityOrRel;
        }

        const resolveTreeWhere = this.queryASTFactory.operationsFactory.getWhereArgs(resolveTree);

        if (entityOrRel instanceof RelationshipAdapter) {
            if (isConcreteEntity(entity)) {
                checkEntityAuthentication({
                    entity: entity.entity,
                    targetOperations: ["AGGREGATE"],
                    context,
                });

                const selection = new RelationshipSelection({
                    relationship: entityOrRel,
                    directed: Boolean(resolveTree.args?.directed ?? true),
                });

                const operation = new AggregationOperation({
                    entity: entityOrRel,
                    directed: Boolean(resolveTree.args?.directed ?? true),
                    selection,
                });

                return this.hydrateAggregationOperation({
                    relationship: entityOrRel,
                    operation,
                    entity,
                    resolveTree,
                    context,
                    whereArgs: resolveTreeWhere,
                });
            } else {
                const concreteEntities = getConcreteEntities(entity, resolveTreeWhere);

                const parsedProjectionFields = this.getAggregationParsedProjectionFields(entityOrRel, resolveTree);

                const nodeRawFields = {
                    ...parsedProjectionFields.node?.fieldsByTypeName[
                        entityOrRel.operations.getAggregationFieldTypename("node")
                    ],
                };

                const concreteAggregationOperations = concreteEntities.map((concreteEntity: ConcreteEntityAdapter) => {
                    const aggregationPartial = new CompositeAggregationPartial({
                        target: concreteEntity,
                        entity: entityOrRel,
                        directed: Boolean(resolveTree.args?.directed ?? true),
                    });

                    const attributes = this.queryASTFactory.operationsFactory.getSelectedAttributes(
                        concreteEntity,
                        nodeRawFields
                    );
                    const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
                        entity: concreteEntity,
                        operations: ["AGGREGATE"],
                        context,
                        attributes,
                    });
                    aggregationPartial.addAuthFilters(...authFilters);

                    return aggregationPartial;
                });

                const compositeAggregationOp = new CompositeAggregationOperation({
                    compositeEntity: entity,
                    children: concreteAggregationOperations,
                });

                this.hydrateAggregationOperation({
                    relationship: entityOrRel,
                    entity,
                    resolveTree,
                    context,
                    operation: compositeAggregationOp,
                    whereArgs: resolveTreeWhere,
                });

                return compositeAggregationOp;
            }
        } else {
            if (isConcreteEntity(entity)) {
                let selection: EntitySelection;
                // NOTE: If we introduce vector index aggregation, checking the phrase will cause a problem
                if (context.resolveTree.args.fulltext || context.resolveTree.args.phrase) {
                    selection = this.queryASTFactory.operationsFactory.getFulltextSelection(entity, context);
                } else {
                    selection = new NodeSelection({
                        target: entity,
                        alias: "this",
                    });
                }

                const operation = new AggregationOperation({
                    entity,
                    directed: Boolean(resolveTree.args?.directed ?? true),
                    selection,
                });

                const parsedProjectionFields = this.getAggregationParsedProjectionFields(entity, resolveTree);

                const fields = this.queryASTFactory.fieldFactory.createAggregationFields(
                    entity,
                    parsedProjectionFields.fields
                );

                operation.setFields(fields);

                const whereArgs = this.queryASTFactory.operationsFactory.getWhereArgs(resolveTree);
                const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
                    entity,
                    operations: ["AGGREGATE"],
                    attributes: this.queryASTFactory.operationsFactory.getSelectedAttributes(
                        entity,
                        parsedProjectionFields.fields
                    ),
                    context,
                });

                const filters = this.queryASTFactory.filterFactory.createNodeFilters(entity, whereArgs); // Aggregation filters only apply to target node

                operation.addFilters(...filters);
                operation.addAuthFilters(...authFilters);

                // TODO: Duplicate logic with hydrateReadOperationWithPagination, check if it's correct to unify.
                const options = this.queryASTFactory.operationsFactory.getOptions(
                    entity,
                    (resolveTree.args.options ?? {}) as any
                );
                if (options) {
                    const sort = this.queryASTFactory.sortAndPaginationFactory.createSortFields(
                        options,
                        entity,
                        context
                    );
                    operation.addSort(...sort);

                    const pagination = this.queryASTFactory.sortAndPaginationFactory.createPagination(options);
                    if (pagination) {
                        operation.addPagination(pagination);
                    }
                }

                return operation;
            } else {
                // TOP level interface/union
                const concreteEntities = getConcreteEntities(entity, resolveTreeWhere);

                const parsedProjectionFields = this.getAggregationParsedProjectionFields(entity, resolveTree);

                const concreteAggregationOperations = concreteEntities.map((concreteEntity: ConcreteEntityAdapter) => {
                    const aggregationPartial = new CompositeAggregationPartial({
                        target: concreteEntity,
                        directed: Boolean(resolveTree.args?.directed ?? true),
                    });

                    const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
                        entity: concreteEntity,
                        operations: ["AGGREGATE"],
                        attributes: this.queryASTFactory.operationsFactory.getSelectedAttributes(
                            concreteEntity,
                            parsedProjectionFields.fields
                        ),
                        context,
                    });

                    aggregationPartial.addAuthFilters(...authFilters);

                    return aggregationPartial;
                });

                const compositeAggregationOp = new CompositeAggregationOperation({
                    compositeEntity: entity,
                    children: concreteAggregationOperations,
                });

                return this.hydrateAggregationOperation({
                    entity,
                    resolveTree,
                    context,
                    operation: compositeAggregationOp,
                    whereArgs: resolveTreeWhere,
                });
            }
        }
    }

    private getAggregationParsedProjectionFields(
        adapter: InterfaceEntityAdapter | RelationshipAdapter | ConcreteEntityAdapter,
        resolveTree: ResolveTree
    ): {
        node: ResolveTree | undefined;
        edge: ResolveTree | undefined;
        fields: Record<string, ResolveTree>;
    } {
        const rawProjectionFields = {
            ...resolveTree.fieldsByTypeName[adapter.operations.getAggregationFieldTypename()],
        };

        return this.queryASTFactory.operationsFactory.splitConnectionFields(rawProjectionFields);
    }

    private hydrateAggregationOperation<T extends AggregationOperation | CompositeAggregationOperation>({
        relationship,
        entity,
        operation,
        resolveTree,
        context,
        whereArgs,
    }: {
        relationship?: RelationshipAdapter;
        entity: ConcreteEntityAdapter | InterfaceEntityAdapter;
        operation: T;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        whereArgs: Record<string, any>;
    }): T {
        if (relationship) {
            const parsedProjectionFields = this.getAggregationParsedProjectionFields(relationship, resolveTree);

            const edgeRawFields = {
                ...parsedProjectionFields.edge?.fieldsByTypeName[
                    relationship.operations.getAggregationFieldTypename("edge")
                ],
            };

            const nodeRawFields = {
                ...parsedProjectionFields.node?.fieldsByTypeName[
                    relationship.operations.getAggregationFieldTypename("node")
                ],
            };

            const fields = this.queryASTFactory.fieldFactory.createAggregationFields(
                entity,
                parsedProjectionFields.fields
            );
            const nodeFields = this.queryASTFactory.fieldFactory.createAggregationFields(entity, nodeRawFields);
            const edgeFields = this.queryASTFactory.fieldFactory.createAggregationFields(relationship, edgeRawFields);
            if (isInterfaceEntity(entity)) {
                const filters = this.queryASTFactory.filterFactory.createInterfaceNodeFilters({
                    entity,
                    whereFields: whereArgs,
                });
                operation.addFilters(...filters);
            } else {
                const filters = this.queryASTFactory.filterFactory.createNodeFilters(entity, whereArgs); // Aggregation filters only apply to target node
                operation.addFilters(...filters);

                const attributes = this.queryASTFactory.operationsFactory.getSelectedAttributes(entity, nodeRawFields);

                const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
                    entity,
                    operations: ["AGGREGATE"],
                    attributes,
                    context,
                });

                operation.addAuthFilters(...authFilters);
            }

            operation.setFields(fields);
            operation.setNodeFields(nodeFields);
            operation.setEdgeFields(edgeFields);
        } else {
            const rawProjectionFields = {
                ...resolveTree.fieldsByTypeName[entity.operations.aggregateTypeNames.selection],
            };

            const fields = this.queryASTFactory.fieldFactory.createAggregationFields(entity, rawProjectionFields);

            if (isInterfaceEntity(entity)) {
                const filters = this.queryASTFactory.filterFactory.createInterfaceNodeFilters({
                    entity,
                    whereFields: whereArgs,
                });
                operation.addFilters(...filters);
            } else {
                const filters = this.queryASTFactory.filterFactory.createNodeFilters(entity, whereArgs); // Aggregation filters only apply to target node
                operation.addFilters(...filters);
                const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
                    entity,
                    operations: ["AGGREGATE"],
                    context,
                });

                operation.addAuthFilters(...authFilters);
            }
            operation.setFields(fields);
        }

        const options = this.queryASTFactory.operationsFactory.getOptions(
            entity,
            (resolveTree.args.options ?? {}) as any
        );
        if (options) {
            const sort = this.queryASTFactory.sortAndPaginationFactory.createSortFields(options, entity, context);
            operation.addSort(...sort);

            const pagination = this.queryASTFactory.sortAndPaginationFactory.createPagination(options);
            if (pagination) {
                operation.addPagination(pagination);
            }
        }

        return operation;
    }
}
