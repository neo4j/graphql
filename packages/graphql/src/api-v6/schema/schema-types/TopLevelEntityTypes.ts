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

import type { ObjectTypeComposer } from "graphql-compose";
import { Memoize } from "typescript-memoize";
import type { Attribute } from "../../../schema-model/attribute/Attribute";
import { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { attributeAdapterToComposeFields } from "../../../schema/to-compose";
import type { EntityTypeNames } from "../../graphql-type-names/EntityTypeNames";
import type { FieldDefinition, SchemaBuilder } from "../SchemaBuilder";
import { EntityTypes } from "./EntityTypes";
import { NestedEntitySchemaTypes } from "./NestedEntityTypes";
import type { StaticTypes } from "./StaticTypes";

export class TopLevelEntityTypes extends EntityTypes<EntityTypeNames> {
    private entity: ConcreteEntity;

    constructor({
        entity,
        schemaBuilder,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        entity: ConcreteEntity;
        staticTypes: StaticTypes;
    }) {
        super({
            schemaBuilder,
            entityTypeNames: entity.typeNames,
            staticTypes,
        });
        this.entity = entity;
    }

    public get queryFieldName(): string {
        return this.entity.typeNames.queryField;
    }

    @Memoize()
    public get nodeType(): string {
        const fields = this.getNodeFieldsDefinitions();
        const relationships = this.getRelationshipFields();
        this.schemaBuilder.createObjectType(this.entity.typeNames.node, { ...fields, ...relationships });
        return this.entity.typeNames.node;
    }

    protected getEdgeProperties(): undefined {
        return;
    }

    protected getEdgeSortProperties(): undefined {
        return;
    }

    @Memoize()
    protected getFields(): Attribute[] {
        return [...this.entity.attributes.values()];
    }

    @Memoize()
    private getNodeFieldsDefinitions(): Record<string, FieldDefinition> {
        const entityAttributes = this.getFields().map((attribute) => new AttributeAdapter(attribute));
        return attributeAdapterToComposeFields(entityAttributes, new Map()) as Record<string, any>;
    }

    @Memoize()
    public get nodeSortType(): string {
        this.schemaBuilder.createInputObjectType(this.entity.typeNames.nodeSort, this.sortFields);
        return this.entity.typeNames.nodeSort;
    }

    @Memoize()
    private getRelationshipFields(): Record<string, ObjectTypeComposer> {
        return Object.fromEntries(
            [...this.entity.relationships.values()].map((relationship) => {
                const relationshipTypes = new NestedEntitySchemaTypes({
                    schemaBuilder: this.schemaBuilder,
                    relationship,
                    entityTypeNames: relationship.typeNames,
                    staticTypes: this.staticTypes,
                });
                const relationshipType = relationshipTypes.connectionOperation;

                return [relationship.name, relationshipType];
            })
        );
    }
}
