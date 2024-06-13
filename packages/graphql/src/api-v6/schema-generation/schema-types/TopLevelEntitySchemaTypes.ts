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
import type { InputTypeComposer, ObjectTypeComposer } from "graphql-compose";
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
import type { TopLevelEntityTypeNames } from "../../schema-model/graphql-type-names/TopLevelEntityTypeNames";
import type { FieldDefinition, GraphQLResolver, SchemaBuilder } from "../SchemaBuilder";
import { EntitySchemaTypes } from "./EntitySchemaTypes";
import { RelatedEntitySchemaTypes } from "./RelatedEntitySchemaTypes";
import type { SchemaTypes } from "./SchemaTypes";
import { TopLevelFilterSchemaTypes } from "./filter-schema-types/TopLevelFilterSchemaTypes";

export class TopLevelEntitySchemaTypes extends EntitySchemaTypes<TopLevelEntityTypeNames> {
    private entity: ConcreteEntity;
    private filterSchemaTypes: TopLevelFilterSchemaTypes;

    constructor({
        entity,
        schemaBuilder,
        schemaTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        entity: ConcreteEntity;
        schemaTypes: SchemaTypes;
    }) {
        super({
            schemaBuilder,
            entityTypeNames: entity.typeNames,
            schemaTypes,
        });
        this.entity = entity;
        this.filterSchemaTypes = new TopLevelFilterSchemaTypes({ schemaBuilder, entity, schemaTypes });
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
                where: this.filterSchemaTypes.operationWhere,
            },
            resolver,
        });
    }

    protected get edge(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.edge, () => {
            return {
                fields: {
                    node: this.nodeType,
                    cursor: "String",
                },
            };
        });
    }

    protected get edgeSort(): InputTypeComposer {
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

            return {
                fields: { ...fields, ...relationships },
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
                field.type.name === GraphQLBuiltInScalarType[GraphQLBuiltInScalarType[field.type.name]] ||
                field.type.name === Neo4jGraphQLNumberType[Neo4jGraphQLNumberType[field.type.name]] ||
                field.type.name === Neo4jGraphQLTemporalType[Neo4jGraphQLTemporalType[field.type.name]]
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
        return Object.fromEntries(entries);
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
                const operationWhere = relationshipTypes.filterSchemaTypes.operationWhere;
                return [relationship.name, { type: relationshipType, args: { where: operationWhere } }];
            })
        );
    }
}

function typeToResolver(type: GraphQLBuiltInScalarType | Neo4jGraphQLScalarType): GraphQLResolver | undefined {
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
