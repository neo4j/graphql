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

import type { EnumTypeComposer, InputTypeComposer, ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { Attribute } from "../../../schema-model/attribute/Attribute";
import {
    GraphQLBuiltInScalarType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLTemporalType,
} from "../../../schema-model/attribute/AttributeType";
import { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import { attributeAdapterToComposeFields } from "../../../schema/to-compose";
import type { RelatedEntityTypeNames } from "../../schema-model/graphql-type-names/RelatedEntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import { EntitySchemaTypes } from "./EntitySchemaTypes";
import type { SchemaTypes } from "./SchemaTypes";
import type { TopLevelEntitySchemaTypes } from "./TopLevelEntitySchemaTypes";
import { RelatedEntityFilterSchemaTypes } from "./filter-schema-types/RelatedEntityFilterSchemaTypes";

export class RelatedEntitySchemaTypes extends EntitySchemaTypes<RelatedEntityTypeNames> {
    private relationship: Relationship;
    public filterSchemaTypes: RelatedEntityFilterSchemaTypes;

    constructor({
        relationship,
        schemaBuilder,
        entityTypeNames,
        schemaTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        relationship: Relationship;
        schemaTypes: SchemaTypes;
        entityTypeNames: RelatedEntityTypeNames;
    }) {
        super({
            schemaBuilder,
            entityTypeNames,
            schemaTypes,
        });
        this.relationship = relationship;
        this.filterSchemaTypes = new RelatedEntityFilterSchemaTypes({
            schemaBuilder,
            relationship: relationship,
            schemaTypes,
        });
    }

    protected get edge(): ObjectTypeComposer {
        return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.edge, () => {
            const properties = this.getEdgeProperties();
            const fields = {
                node: this.nodeType,
                cursor: this.schemaBuilder.types.string,
            };

            if (properties) {
                fields["properties"] = properties;
            }
            return {
                fields,
            };
        });
    }

    protected get edgeSort(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.edgeSort, () => {
            const edgeSortFields = {};
            const properties = this.getEdgeSortProperties();
            if (properties) {
                edgeSortFields["properties"] = properties;
            }
            if (this.getTargetEntitySchemaTypes().isSortable()) {
                edgeSortFields["node"] = this.nodeSort;
            }

            return { fields: edgeSortFields };
        });
    }

    public get nodeType(): ObjectTypeComposer {
        return this.getTargetEntitySchemaTypes().nodeType;
    }

    public get nodeSort(): InputTypeComposer {
        return this.getTargetEntitySchemaTypes().nodeSort;
    }

    @Memoize()
    private getTargetEntitySchemaTypes(): TopLevelEntitySchemaTypes {
        const target = this.relationship.target;
        if (!(target instanceof ConcreteEntity)) {
            throw new Error("Interfaces not supported yet");
        }
        return this.schemaTypes.getEntitySchemaTypes(target);
    }

    public isSortable(): boolean {
        const isTargetSortable = this.getTargetEntitySchemaTypes().isSortable();
        return this.getRelationshipSortableFields().length > 0 || isTargetSortable;
    }

    @Memoize()
    private getRelationshipFields(): Attribute[] {
        return [...this.relationship.attributes.values()];
    }

    private getEdgeSortProperties(): InputTypeComposer | undefined {
        if (this.entityTypeNames.propertiesSort && this.getRelationshipSortableFields().length > 0) {
            return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.propertiesSort, () => {
                return {
                    fields: this.getRelationshipSortFields(),
                };
            });
        }
    }

    private getRelationshipFieldsDefinition(): Record<string, string> {
        const entityAttributes = this.getRelationshipFields().map((attribute) => new AttributeAdapter(attribute));
        return attributeAdapterToComposeFields(entityAttributes, new Map()) as Record<string, any>;
    }

    private getRelationshipSortFields(): Record<string, EnumTypeComposer> {
        return Object.fromEntries(
            this.getRelationshipSortableFields().map((attribute) => [
                attribute.name,
                this.schemaTypes.staticTypes.sortDirection,
            ])
        );
    }

    @Memoize()
    private getRelationshipSortableFields(): Attribute[] {
        return this.getRelationshipFields().filter(
            (field) =>
                field.type.name === GraphQLBuiltInScalarType[GraphQLBuiltInScalarType[field.type.name]] ||
                field.type.name === Neo4jGraphQLNumberType[Neo4jGraphQLNumberType[field.type.name]] ||
                field.type.name === Neo4jGraphQLTemporalType[Neo4jGraphQLTemporalType[field.type.name]]
        );
    }

    private getEdgeProperties(): ObjectTypeComposer | undefined {
        if (this.entityTypeNames.properties) {
            return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.properties, () => {
                const fields = this.getRelationshipFieldsDefinition();
                return {
                    fields,
                };
            });
        }
    }
}
