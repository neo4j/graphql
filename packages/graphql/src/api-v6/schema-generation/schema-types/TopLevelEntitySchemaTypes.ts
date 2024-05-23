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

import type { GraphQLResolveInfo } from "graphql";
import type { InputTypeComposer, ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { Attribute } from "../../../schema-model/attribute/Attribute";
import {
    GraphQLBuiltInScalarType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLTemporalType,
} from "../../../schema-model/attribute/AttributeType";
import { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { attributeAdapterToComposeFields } from "../../../schema/to-compose";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { filterTruthy } from "../../../utils/utils";
import type { TopLevelEntityTypeNames } from "../../schema-model/graphql-type-names/TopLevelEntityTypeNames";
import type { FieldDefinition, SchemaBuilder } from "../SchemaBuilder";
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
                filterTruthy(
                    this.getFields().map((field) => {
                        if (
                            [
                                ...Object.values(GraphQLBuiltInScalarType),
                                ...Object.values(Neo4jGraphQLNumberType),
                                ...Object.values(Neo4jGraphQLTemporalType),
                            ].includes(
                                field.type.name as
                                    | GraphQLBuiltInScalarType
                                    | Neo4jGraphQLNumberType
                                    | Neo4jGraphQLTemporalType
                            )
                        ) {
                            return [field.name, this.schemaTypes.staticTypes.sortDirection];
                        }
                    })
                )
            );

            return {
                fields: sortFields,
            };
        });
    }

    public get nodeWhere(): InputTypeComposer {
        return this.filterSchemaTypes.nodeWhere;
    }

    @Memoize()
    private getFields(): Attribute[] {
        return [...this.entity.attributes.values()];
    }

    private getNodeFieldsDefinitions(): Record<string, FieldDefinition> {
        const entityAttributes = this.getFields().map((attribute) => new AttributeAdapter(attribute));
        return attributeAdapterToComposeFields(entityAttributes, new Map()) as Record<string, any>;
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
