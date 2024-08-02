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

import { type GraphQLResolveInfo } from "graphql";
import type {
    InputTypeComposer,
    InterfaceTypeComposer,
    ListComposer,
    NonNullComposer,
    ObjectTypeComposer,
    ScalarTypeComposer,
} from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { Attribute } from "../../../schema-model/attribute/Attribute";
import type { AttributeType, Neo4jGraphQLScalarType } from "../../../schema-model/attribute/AttributeType";
import {
    GraphQLBuiltInScalarType,
    ListType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLTemporalType,
    ScalarType,
} from "../../../schema-model/attribute/AttributeType";
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { idResolver } from "../../../schema/resolvers/field/id";
import { numericalResolver } from "../../../schema/resolvers/field/numerical";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { connectionOperationResolver } from "../../resolvers/connection-operation-resolver";
import { generateGlobalIdFieldResolver } from "../../resolvers/global-id-field-resolver";
import type { TopLevelEntityTypeNames } from "../../schema-model/graphql-type-names/TopLevelEntityTypeNames";
import type { FieldDefinition, GraphQLResolver, SchemaBuilder } from "../SchemaBuilder";
import { RelatedEntitySchemaTypes } from "./RelatedEntitySchemaTypes";
import type { SchemaTypes } from "./SchemaTypes";
import { TopLevelFilterSchemaTypes } from "./filter-schema-types/TopLevelFilterSchemaTypes";
import { TopLevelCreateSchemaTypes } from "./mutation-schema-types/TopLevelCreateSchemaTypes";

export class TopLevelEntitySchemaTypes {
    private entity: ConcreteEntity;
    private filterSchemaTypes: TopLevelFilterSchemaTypes;
    private schemaBuilder: SchemaBuilder;
    private entityTypeNames: TopLevelEntityTypeNames;
    private schemaTypes: SchemaTypes;
    private createSchemaTypes: TopLevelCreateSchemaTypes;

    constructor({
        entity,
        schemaBuilder,
        schemaTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        entity: ConcreteEntity;
        schemaTypes: SchemaTypes;
    }) {
        this.entity = entity;
        this.filterSchemaTypes = new TopLevelFilterSchemaTypes({ schemaBuilder, entity, schemaTypes });
        this.schemaBuilder = schemaBuilder;
        this.entityTypeNames = entity.typeNames;
        this.schemaTypes = schemaTypes;
        this.createSchemaTypes = new TopLevelCreateSchemaTypes({ schemaBuilder, entity });
    }

    public addTopLevelQueryField(
        resolver: (
            _root: any,
            args: any,
            context: Neo4jGraphQLTranslationContext,
            info: GraphQLResolveInfo
        ) => Promise<any>
    ): void {
        this.schemaBuilder.addQueryField({
            name: this.entity.typeNames.queryField,
            type: this.connectionOperation,
            args: {
                where: this.filterSchemaTypes.operationWhereTopLevel,
            },
            resolver,
        });
    }

    public get connectionOperation(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.connectionOperation, () => {
            const args: {
                first: ScalarTypeComposer;
                after: ScalarTypeComposer;
                sort?: ListComposer<NonNullComposer<InputTypeComposer>>;
            } = {
                first: this.schemaBuilder.types.int,
                after: this.schemaBuilder.types.string,
            };
            if (this.isSortable()) {
                args.sort = this.connectionSort.NonNull.List;
            }
            return {
                fields: {
                    connection: {
                        type: this.connection,
                        args: args,
                        resolve: connectionOperationResolver,
                    },
                },
            };
        });
    }

    private get connection(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.connection, () => {
            return {
                fields: {
                    pageInfo: this.schemaTypes.staticTypes.pageInfo,
                    edges: this.edge.List,
                },
            };
        });
    }

    public addTopLevelCreateField(
        resolver: (
            _root: any,
            args: any,
            context: Neo4jGraphQLTranslationContext,
            info: GraphQLResolveInfo
        ) => Promise<any>
    ) {
        this.schemaBuilder.addMutationField({
            name: this.entity.typeNames.createField,
            type: this.createType,
            args: {
                input: this.createSchemaTypes.createInput.NonNull.List.NonNull,
            },
            resolver,
        });
    }

    protected get connectionSort(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.connectionSort, () => {
            return {
                fields: {
                    node: this.nodeSort,
                },
            };
        });
    }

    private get edge(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.edge, () => {
            return {
                fields: {
                    node: this.nodeType,
                    cursor: this.schemaBuilder.types.string,
                },
            };
        });
    }

    private get edgeSort(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.edgeSort, () => {
            return {
                fields: {
                    node: this.nodeSort,
                },
            };
        });
    }

    public get nodeType(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.node, () => {
            const fields = this.getNodeFieldsDefinitions();
            const relationships = this.getRelationshipFields();

            let iface: InterfaceTypeComposer | undefined;
            if (this.entity.isConcreteEntity() && this.entity.globalIdField) {
                iface = this.schemaTypes.staticTypes.globalNodeInterface;
            }

            return {
                fields: { ...fields, ...relationships },
                iface,
            };
        });
    }

    public get nodeSort(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.nodeSort, () => {
            const sortFields = Object.fromEntries(
                this.getSortableFields().map((field) => {
                    return [field.name, this.schemaTypes.staticTypes.sortDirection];
                })
            );

            return {
                fields: sortFields,
            };
        });
    }

    public get nodeWhere(): InputTypeComposer {
        return this.filterSchemaTypes.nodeWhere;
    }
    /**
     * Used to avoid creating empty sort input which make the generated schema invalid
     **/
    public isSortable(): boolean {
        return this.getSortableFields().length > 0;
    }

    @Memoize()
    private getFields(): Attribute[] {
        return [...this.entity.attributes.values()];
    }

    @Memoize()
    private getSortableFields(): Attribute[] {
        return this.getFields().filter(
            (field) =>
                field.type.name in GraphQLBuiltInScalarType ||
                field.type.name in Neo4jGraphQLNumberType ||
                field.type.name in Neo4jGraphQLTemporalType
        );
    }

    private getNodeFieldsDefinitions(): Record<string, FieldDefinition> {
        const entries: [string, FieldDefinition][] = this.getFields().map((attribute) => {
            if (attribute.type instanceof ScalarType) {
                return [
                    attribute.name,
                    {
                        type: attributeTypeToString(attribute.type),
                        args: {},
                        description: attribute.description,
                        resolve: typeToResolver(attribute.type.name),
                    },
                ];
            }
            if (attribute.type instanceof ListType && attribute.type.ofType instanceof ScalarType) {
                return [
                    attribute.name,
                    {
                        type: attributeTypeToString(attribute.type),
                        args: {},
                        description: attribute.description,
                        resolve: typeToResolver(attribute.type.ofType.name),
                    },
                ];
            }
            return [
                attribute.name,
                {
                    type: attributeTypeToString(attribute.type),
                    args: {},
                    description: attribute.description,
                },
            ];
        });

        const fields = Object.fromEntries(entries);
        this.addGlobalIdField(fields);
        return fields;
    }

    private addGlobalIdField(fields: Record<string, FieldDefinition>): void {
        const globalIdField = this.entity.globalIdField;
        if (globalIdField) {
            fields["id"] = {
                type: this.schemaBuilder.types.id.NonNull,
                args: {},
                description: "",
                resolve: generateGlobalIdFieldResolver({ entity: this.entity }),
            };
        }
    }

    private getRelationshipFields(): Record<string, { type: ObjectTypeComposer; args: Record<string, any> }> {
        return Object.fromEntries(
            [...this.entity.relationships.values()].map((relationship) => {
                const relationshipTypes = new RelatedEntitySchemaTypes({
                    schemaBuilder: this.schemaBuilder,
                    relationship,
                    entityTypeNames: relationship.typeNames,
                    schemaTypes: this.schemaTypes,
                });
                const relationshipType = relationshipTypes.connectionOperation;
                const operationWhere = relationshipTypes.filterSchemaTypes.operationWhereNested;
                return [relationship.name, { type: relationshipType, args: { where: operationWhere } }];
            })
        );
    }

    public get createType(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.createResponse, () => {
            const nodeType = this.nodeType;
            const info = this.createInfo;

            return {
                fields: {
                    [this.entityTypeNames.queryField]: nodeType.NonNull.List.NonNull,
                    info,
                },
            };
        });
    }

    public get createInfo(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.createInfo, () => {
            return {
                fields: {
                    nodesCreated: this.schemaBuilder.types.int.NonNull,
                    relationshipsCreated: this.schemaBuilder.types.int.NonNull,
                },
            };
        });
    }
}

function typeToResolver(type: Neo4jGraphQLScalarType): GraphQLResolver | undefined {
    switch (type) {
        case GraphQLBuiltInScalarType.Int:
        case GraphQLBuiltInScalarType.Float:
        case Neo4jGraphQLNumberType.BigInt: {
            return numericalResolver;
        }
        case GraphQLBuiltInScalarType.ID: {
            return idResolver;
        }
    }
}

function attributeTypeToString(type: AttributeType): string {
    if (type instanceof ListType) {
        if (type.isRequired) {
            return `[${attributeTypeToString(type.ofType)}]!`;
        }
        return `[${attributeTypeToString(type.ofType)}]`;
    }
    if (type.isRequired) {
        return `${type.name}!`;
    }
    return type.name;
}
