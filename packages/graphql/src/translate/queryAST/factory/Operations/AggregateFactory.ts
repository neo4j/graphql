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
import { findFieldsByNameInFieldsByTypeNameField } from "../parsers/find-fields-by-name-in-fields-by-type-name-field";

export class AggregateFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    // TODO: dupe from read operation
    public createAggregationOperation({
        entityOrRel,
        resolveTree,
        context,
        extraWhereArgs = {},
    }: {
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter | InterfaceEntityAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
        extraWhereArgs?: Record<string, any>;
    }): AggregationOperation | CompositeAggregationOperation {
        let entity: ConcreteEntityAdapter | InterfaceEntityAdapter;
        if (entityOrRel instanceof RelationshipAdapter) {
            entity = entityOrRel.target as ConcreteEntityAdapter; // TODO: check this seems wrong but outside of the scope of this PR
        } else {
            entity = entityOrRel;
        }

        const resolveTreeWhere = extraWhereArgs;

        if (entityOrRel instanceof RelationshipAdapter) {
            if (isConcreteEntity(entity)) {
                // RELATIONSHIP WITH CONCRETE TARGET
                checkEntityAuthentication({
                    entity: entity.entity,
                    targetOperations: ["AGGREGATE"],
                    context,
                });

                const selection = new RelationshipSelection({
                    relationship: entityOrRel,
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
                // RELATIONSHIP WITH INTERFACE TARGET
                const concreteEntities = getConcreteEntities(entity, resolveTreeWhere.node ?? {});

                const concreteAggregationOperations = concreteEntities.map((concreteEntity: ConcreteEntityAdapter) => {
                    const aggregationPartial = new CompositeAggregationPartial({
                        target: concreteEntity,
                        entity: entityOrRel,
                        directed: Boolean(resolveTree.args?.directed ?? true),
                    });

                    const parsedProjectionFields = this.getAggregationParsedProjectionFields(entityOrRel, resolveTree);

                    const nodeRawFields = {
                        ...parsedProjectionFields.node?.fieldsByTypeName[
                            entityOrRel.operations.getAggregateFieldTypename("node")
                        ],
                    };

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
                // TOP LEVEL CONCRETE

                const selection = new NodeSelection({
                    target: entity,
                    alias: "this",
                });

                const operation = new AggregationOperation({
                    entity,
                    directed: Boolean(resolveTree.args?.directed ?? true),
                    selection,
                });

                return this.hydrateAggregationOperation({
                    operation,
                    entity,
                    resolveTree,
                    context,
                    whereArgs: resolveTreeWhere,
                });
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

    /** @deprecated */
    public createAggregationOperationDeprecated({
        entityOrRel,
        resolveTree,
        context,
    }: {
        entityOrRel: ConcreteEntityAdapter | RelationshipAdapter | InterfaceEntityAdapter;
        resolveTree: ResolveTree;
        context: Neo4jGraphQLTranslationContext;
    }): AggregationOperation | CompositeAggregationOperation {
        let entity: ConcreteEntityAdapter | InterfaceEntityAdapter;
        if (entityOrRel instanceof RelationshipAdapter) {
            entity = entityOrRel.target as ConcreteEntityAdapter; // TODO: check this seems wrong but outside of the scope of this PR
        } else {
            entity = entityOrRel;
        }

        const resolveTreeWhere = {
            ...this.queryASTFactory.operationsFactory.getWhereArgs(resolveTree),
        };

        if (entityOrRel instanceof RelationshipAdapter) {
            if (isConcreteEntity(entity)) {
                // RELATIONSHIP WITH CONCRETE TARGET
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
                return this.hydrateAggregationOperationDeprecated({
                    relationship: entityOrRel,
                    operation,
                    entity,
                    resolveTree,
                    context,
                    whereArgs: resolveTreeWhere,
                });
            } else {
                // RELATIONSHIP WITH INTERFACE TARGET
                const concreteEntities = getConcreteEntities(entity, resolveTreeWhere);

                const parsedProjectionFields = this.getAggregationParsedProjectionFields(entityOrRel, resolveTree);

                const nodeRawFields = {
                    ...parsedProjectionFields.node?.fieldsByTypeName[
                        entityOrRel.operations.getAggregateFieldTypename("node")
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

                this.hydrateAggregationOperationDeprecated({
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
                // TOP LEVEL CONCRETE
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

                return this.hydrateAggregationOperationDeprecated({
                    operation,
                    entity,
                    resolveTree,
                    context,
                    whereArgs: resolveTreeWhere,
                });
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

                return this.hydrateAggregationOperationDeprecated({
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
            ...resolveTree.fieldsByTypeName[adapter.operations.getAggregateFieldTypename()],
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
        // whereArgs = whereArgs.node ?? {};
        const deprecatedAttributes = false;
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
                parsedProjectionFields.fields,
                deprecatedAttributes
            );
            const nodeFields = this.queryASTFactory.fieldFactory.createAggregationFields(
                entity,
                nodeRawFields,
                deprecatedAttributes
            );
            const edgeFields = this.queryASTFactory.fieldFactory.createAggregationFields(
                relationship,
                edgeRawFields,
                deprecatedAttributes
            );
            if (isInterfaceEntity(entity)) {
                const nodeFilters = this.queryASTFactory.filterFactory.createInterfaceNodeFilters({
                    entity,
                    whereFields: whereArgs.node ?? {},
                });

                const edgefilters = this.queryASTFactory.filterFactory.createEdgeFilters(
                    relationship,
                    whereArgs.edge ?? {}
                );
                operation.addFilters(...nodeFilters, ...edgefilters);
            } else {
                const nodeFilters = this.queryASTFactory.filterFactory.createNodeFilters(
                    entity,
                    whereArgs.node ?? whereArgs ?? {}
                ); // Aggregation filters only apply to target node
                const edgeFilters = this.queryASTFactory.filterFactory.createEdgeFilters(
                    relationship,
                    whereArgs.edge ?? whereArgs ?? {}
                ); // Aggregation filters only apply to target node
                operation.addFilters(...nodeFilters, ...edgeFilters);

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
                ...resolveTree.fieldsByTypeName[entity.operations.aggregateTypeNames.node], // Handles both, deprecated and new aggregation parsing
            };

            const fields = this.queryASTFactory.fieldFactory.createAggregationFields(
                entity,
                rawProjectionFields,
                deprecatedAttributes
            );
            // TOP Level aggregate in connection
            const connectionFields = {
                // TOP level connection fields
                ...resolveTree.fieldsByTypeName[entity.operations.aggregateTypeNames.connection],
            };

            const nodeResolveTree = findFieldsByNameInFieldsByTypeNameField(connectionFields, "node")[0];
            const nodeRawFields = {
                ...nodeResolveTree?.fieldsByTypeName[entity.operations.aggregateTypeNames.node],
            };

            const nodeFields = this.queryASTFactory.fieldFactory.createAggregationFields(
                entity,
                nodeRawFields,
                deprecatedAttributes
            );
            operation.setNodeFields(nodeFields);
            const countResolveTree = findFieldsByNameInFieldsByTypeNameField(connectionFields, "count")[0];

            if (countResolveTree) {
                const connetionTopFields = this.queryASTFactory.fieldFactory.createAggregationFields(
                    entity,
                    {
                        count: countResolveTree,
                    },
                    deprecatedAttributes
                );
                fields.push(...connetionTopFields);
            }

            if (isInterfaceEntity(entity)) {
                const filters = this.queryASTFactory.filterFactory.createInterfaceNodeFilters({
                    entity,
                    whereFields: whereArgs.node ?? {},
                });
                operation.addFilters(...filters);
            } else {
                const filters = this.queryASTFactory.filterFactory.createNodeFilters(entity, whereArgs.node ?? {}); // Aggregation filters only apply to target node
                operation.addFilters(...filters);
                const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
                    entity,
                    operations: ["AGGREGATE"],
                    context,
                    attributes: this.queryASTFactory.operationsFactory.getSelectedAttributes(entity, {
                        ...nodeRawFields,
                        ...rawProjectionFields,
                    }),
                });

                operation.addAuthFilters(...authFilters);
            }
            operation.setFields(fields);
        }

        return operation;
    }

    /** @deprecated */
    private hydrateAggregationOperationDeprecated<T extends AggregationOperation | CompositeAggregationOperation>({
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
        const deprecatedAttributes = true;
        if (relationship) {
            const parsedProjectionFields = this.getAggregationParsedProjectionFields(relationship, resolveTree);

            const edgeRawFields = {
                ...parsedProjectionFields.edge?.fieldsByTypeName[
                    relationship.operations.getAggregateFieldTypename("edge")
                ],
            };

            const nodeRawFields = {
                ...parsedProjectionFields.node?.fieldsByTypeName[
                    relationship.operations.getAggregateFieldTypename("node")
                ],
            };

            const fields = this.queryASTFactory.fieldFactory.createAggregationFields(
                entity,
                parsedProjectionFields.fields,
                deprecatedAttributes
            );
            const nodeFields = this.queryASTFactory.fieldFactory.createAggregationFields(
                entity,
                nodeRawFields,
                deprecatedAttributes
            );
            const edgeFields = this.queryASTFactory.fieldFactory.createAggregationFields(
                relationship,
                edgeRawFields,
                deprecatedAttributes
            );
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
                ...resolveTree.fieldsByTypeName[entity.operations.aggregateTypeNames.node], // Handles both, deprecated and new aggregation parsing
            };

            const fields = this.queryASTFactory.fieldFactory.createAggregationFields(
                entity,
                rawProjectionFields,
                deprecatedAttributes
            );
            // TOP Level aggregate in connection
            const connectionFields = {
                // TOP level connection fields
                ...resolveTree.fieldsByTypeName[entity.operations.aggregateTypeNames.connection],
            };

            const nodeResolveTree = findFieldsByNameInFieldsByTypeNameField(connectionFields, "node")[0];
            const nodeRawFields = {
                ...nodeResolveTree?.fieldsByTypeName[entity.operations.aggregateTypeNames.node],
            };

            const nodeFields = this.queryASTFactory.fieldFactory.createAggregationFields(
                entity,
                nodeRawFields,
                deprecatedAttributes
            );
            operation.setNodeFields(nodeFields);
            const countResolveTree = findFieldsByNameInFieldsByTypeNameField(connectionFields, "count")[0];

            if (countResolveTree) {
                const connetionTopFields = this.queryASTFactory.fieldFactory.createAggregationFields(
                    entity,
                    {
                        count: countResolveTree,
                    },
                    deprecatedAttributes
                );
                fields.push(...connetionTopFields);
            }

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
                    attributes: this.queryASTFactory.operationsFactory.getSelectedAttributes(entity, {
                        ...nodeRawFields,
                        ...rawProjectionFields,
                    }),
                });

                operation.addAuthFilters(...authFilters);
            }
            operation.setFields(fields);
        }

        return operation;
    }
}
