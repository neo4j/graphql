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

import { cursorToOffset } from "graphql-relay";
import type { Integer } from "neo4j-driver";
import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { LimitAnnotation } from "../../schema-model/annotation/LimitAnnotation";
import type { Attribute } from "../../schema-model/attribute/Attribute";
import { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Relationship } from "../../schema-model/relationship/Relationship";
import { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { QueryAST } from "../../translate/queryAST/ast/QueryAST";
import type { Field } from "../../translate/queryAST/ast/fields/Field";
import { OperationField } from "../../translate/queryAST/ast/fields/OperationField";
import { AttributeField } from "../../translate/queryAST/ast/fields/attribute-fields/AttributeField";
import { DateTimeField } from "../../translate/queryAST/ast/fields/attribute-fields/DateTimeField";
import { SpatialAttributeField } from "../../translate/queryAST/ast/fields/attribute-fields/SpatialAttributeField";
import { Pagination } from "../../translate/queryAST/ast/pagination/Pagination";
import { NodeSelection } from "../../translate/queryAST/ast/selection/NodeSelection";
import { RelationshipSelection } from "../../translate/queryAST/ast/selection/RelationshipSelection";
import { PropertySort } from "../../translate/queryAST/ast/sort/PropertySort";
import { filterTruthy } from "../../utils/utils";
import { V6ReadOperation } from "../queryIR/ConnectionReadOperation";
import { FilterFactory } from "./FilterFactory";
import type {
    GraphQLConnectionArgs,
    GraphQLConnectionArgsTopLevel,
    GraphQLSortArgument,
    GraphQLSortEdgeArgument,
    GraphQLTree,
    GraphQLTreeEdgeProperties,
    GraphQLTreeLeafField,
    GraphQLTreeNode,
    GraphQLTreeReadOperation,
    GraphQLTreeSortElement,
} from "./resolve-tree-parser/graphql-tree";

export class ReadOperationFactory {
    public schemaModel: Neo4jGraphQLSchemaModel;
    private filterFactory: FilterFactory;

    constructor(schemaModel: Neo4jGraphQLSchemaModel) {
        this.schemaModel = schemaModel;
        this.filterFactory = new FilterFactory(schemaModel);
    }

    public createAST({ graphQLTree, entity }: { graphQLTree: GraphQLTree; entity: ConcreteEntity }): QueryAST {
        const operation = this.generateOperation({
            graphQLTree,
            entity,
        });
        return new QueryAST(operation);
    }

    private generateOperation({
        graphQLTree,
        entity,
    }: {
        graphQLTree: GraphQLTree;
        entity: ConcreteEntity;
    }): V6ReadOperation {
        const connectionTree = graphQLTree.fields.connection;

        if (!connectionTree) {
            throw new Error("No Connection");
        }

        const target = new ConcreteEntityAdapter(entity);
        const selection = new NodeSelection({
            target,
        });

        const nodeResolveTree = connectionTree.fields.edges?.fields.node;
        const sortArgument = connectionTree.args.sort;
        const pagination = this.getPagination(connectionTree.args, entity);
        const nodeFields = this.getNodeFields(entity, nodeResolveTree);
        const sortInputFields = this.getTopLevelSortInputFields({
            entity,
            sortArgument,
        });
        return new V6ReadOperation({
            target,
            selection,
            fields: {
                edge: [],
                node: nodeFields,
            },
            pagination,
            sortFields: sortInputFields,
            filters: this.filterFactory.createTopLevelFilters({ entity, where: graphQLTree.args.where }),
        });
    }

    private generateRelationshipOperation({
        parsedTree,
        relationship,
    }: {
        parsedTree: GraphQLTreeReadOperation;
        relationship: Relationship;
    }): V6ReadOperation {
        const connectionTree = parsedTree.fields.connection;
        if (!connectionTree) {
            throw new Error("No Connection");
        }

        const relationshipAdapter = new RelationshipAdapter(relationship);
        if (!(relationshipAdapter.target instanceof ConcreteEntityAdapter)) {
            throw new QueryParseError("Interfaces not supported");
        }

        // Selection
        const selection = new RelationshipSelection({
            relationship: relationshipAdapter,
            alias: parsedTree.alias,
        });

        // Fields
        const nodeResolveTree = connectionTree.fields.edges?.fields.node;
        const propertiesResolveTree = connectionTree.fields.edges?.fields.properties;

        const edgeFields = this.getAttributeFields(relationship, propertiesResolveTree);

        const sortArgument = connectionTree.args.sort;
        const relTarget = relationshipAdapter.target.entity;
        const pagination = this.getPagination(connectionTree.args, relTarget);

        const nodeFields = this.getNodeFields(relTarget, nodeResolveTree);
        const sortInputFields = this.getSortInputFields({ entity: relTarget, relationship, sortArgument });

        return new V6ReadOperation({
            target: relationshipAdapter.target,
            selection,
            fields: {
                edge: edgeFields,
                node: nodeFields,
            },
            sortFields: sortInputFields,
            filters: this.filterFactory.createFilters({
                entity: relationshipAdapter.target.entity,
                relationship,
                where: parsedTree.args.where,
            }),
            pagination,
        });
    }

    private getPagination(
        connectionTreeArgs: GraphQLConnectionArgs | GraphQLConnectionArgsTopLevel,
        entity: ConcreteEntity
    ): Pagination | undefined {
        const firstArgument = connectionTreeArgs.first;
        const afterArgument = connectionTreeArgs.after ? cursorToOffset(connectionTreeArgs.after) : undefined;
        const hasPagination = firstArgument ?? afterArgument;
        const limitAnnotation = entity.annotations.limit;
        if (hasPagination || limitAnnotation) {
            const limit = this.calculatePaginationLimitArgument(firstArgument, limitAnnotation);
            return new Pagination({ limit, skip: afterArgument });
        }
    }

    /**
     * Computes the value passed to the LIMIT clause in the Cypher Query by using the first argument and the limit annotation.
     * - Branch 1: if the first argument is defined, use the first argument value, only if it is less than the limit annotation max value.
     * - Branch 2: if not reached Branch 1, then use the following precedence: first argument, `@limit.default`, `@limit.max`.
     * In case the first argument and `@limit` annotation are not defined, return undefined.
     **/
    private calculatePaginationLimitArgument(
        firstArgument: Integer | undefined,
        limitAnnotation: LimitAnnotation | undefined
    ): number | undefined {
        if (firstArgument && limitAnnotation?.max) {
            return Math.min(firstArgument.toNumber(), limitAnnotation.max);
        }
        return firstArgument?.toNumber() ?? limitAnnotation?.default ?? limitAnnotation?.max;
    }

    private getAttributeFields(target: ConcreteEntity, propertiesTree: GraphQLTreeNode | undefined): Field[];
    private getAttributeFields(target: Relationship, propertiesTree: GraphQLTreeEdgeProperties | undefined): Field[];
    private getAttributeFields(
        target: Relationship | ConcreteEntity,
        propertiesTree: GraphQLTreeEdgeProperties | GraphQLTreeNode | undefined
    ): Field[] {
        if (!propertiesTree) {
            return [];
        }

        return filterTruthy(
            Object.values(propertiesTree.fields).map((rawField) => {
                let attribute: Attribute | undefined;

                const isGlobalId = rawField.name === "id" && target instanceof ConcreteEntity && target.globalIdField;
                if (isGlobalId) {
                    attribute = target.globalIdField;
                } else {
                    attribute = target.findAttribute(rawField.name);
                }

                if (attribute) {
                    const field = rawField as GraphQLTreeLeafField;
                    const attributeAdapter = new AttributeAdapter(attribute);
                    if (attributeAdapter.typeHelper.isDateTime()) {
                        return new DateTimeField({
                            alias: rawField.alias,
                            attribute: attributeAdapter,
                        });
                    }
                    if (attributeAdapter.typeHelper.isSpatial()) {
                        return new SpatialAttributeField({
                            alias: rawField.alias,
                            attribute: attributeAdapter,
                            crs: Boolean(field?.fields?.crs),
                        });
                    }
                    return new AttributeField({
                        alias: rawField.alias,
                        attribute: attributeAdapter,
                    });
                }
                return;
            })
        );
    }

    private getRelationshipFields(entity: ConcreteEntity, nodeResolveTree: GraphQLTreeNode | undefined): Field[] {
        if (!nodeResolveTree) {
            return [];
        }

        return filterTruthy(
            Object.values(nodeResolveTree.fields).map((rawField) => {
                const relationship = entity.findRelationship(rawField.name);
                if (relationship) {
                    // FIX casting here
                    return this.generateRelationshipField(rawField as GraphQLTreeReadOperation, relationship);
                }
            })
        );
    }

    private getNodeFields(entity: ConcreteEntity, nodeResolveTree: GraphQLTreeNode | undefined): Field[] {
        const attributeFields = this.getAttributeFields(entity, nodeResolveTree);
        const relationshipFields = this.getRelationshipFields(entity, nodeResolveTree);
        return [...attributeFields, ...relationshipFields];
    }

    private getSortInputFields({
        entity,
        relationship,
        sortArgument,
    }: {
        entity: ConcreteEntity;
        relationship?: Relationship;
        sortArgument: GraphQLSortArgument[] | undefined;
    }): Array<{ edge: PropertySort[]; node: PropertySort[] }> {
        if (!sortArgument) {
            return [];
        }
        return sortArgument.map(({ edges }): { edge: PropertySort[]; node: PropertySort[] } => {
            return this.getEdgeSortInput({
                entity,
                relationship,
                edges,
            });
        });
    }
    private getTopLevelSortInputFields({
        entity,
        relationship,
        sortArgument,
    }: {
        entity: ConcreteEntity;
        relationship?: Relationship;
        sortArgument: GraphQLSortEdgeArgument[] | undefined;
    }): Array<{ edge: PropertySort[]; node: PropertySort[] }> {
        if (!sortArgument) {
            return [];
        }
        return sortArgument.map((edges): { edge: PropertySort[]; node: PropertySort[] } => {
            return this.getEdgeSortInput({
                entity,
                relationship,
                edges,
            });
        });
    }

    private getEdgeSortInput({
        entity,
        relationship,
        edges,
    }: {
        entity: ConcreteEntity;
        relationship?: Relationship;
        edges: GraphQLSortEdgeArgument;
    }): { edge: PropertySort[]; node: PropertySort[] } {
        const nodeSortFields = edges.node ? this.getPropertiesSort({ target: entity, sortArgument: edges.node }) : [];
        const edgeSortFields =
            edges.properties && relationship
                ? this.getPropertiesSort({ target: relationship, sortArgument: edges.properties })
                : [];
        return {
            edge: edgeSortFields,
            node: nodeSortFields,
        };
    }

    private getPropertiesSort({
        target,
        sortArgument,
    }: {
        target: ConcreteEntity | Relationship;
        sortArgument: GraphQLTreeSortElement;
    }): PropertySort[] {
        return Object.entries(sortArgument).map(([fieldName, direction]) => {
            const attribute = target.findAttribute(fieldName);
            if (!attribute) {
                throw new Error(`Attribute not found: ${fieldName}`);
            }
            return new PropertySort({
                direction,
                attribute: new AttributeAdapter(attribute),
            });
        });
    }

    private generateRelationshipField(
        resolveTree: GraphQLTreeReadOperation,
        relationship: Relationship
    ): OperationField {
        const relationshipOperation = this.generateRelationshipOperation({
            relationship: relationship,
            parsedTree: resolveTree,
        });

        return new OperationField({
            alias: resolveTree.alias,
            operation: relationshipOperation,
        });
    }
}

export class QueryParseError extends Error {}
