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
import { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import { attributeAdapterToComposeFields } from "../../../schema/to-compose";
import type { EntityTypeNames } from "../../graphQLTypeNames/EntityTypeNames";
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
            entityTypes: entity.types,
            staticTypes,
        });
        this.entity = entity;
    }

    public get queryFieldName(): string {
        return this.entity.types.queryField;
    }

    @Memoize()
    public get nodeType(): string {
        const fields = this.getNodeFields(this.entity);
        const relationships = this.getRelationshipFields(this.entity);
        this.schemaBuilder.createObjectType(this.entity.types.nodeType, { ...fields, ...relationships });
        return this.entity.types.nodeType;
    }

    protected getEdgeProperties(): ObjectTypeComposer<any, any> | undefined {
        return undefined;
    }

    private getNodeFields(concreteEntity: ConcreteEntity): Record<string, FieldDefinition> {
        const entityAttributes = [...concreteEntity.attributes.values()].map(
            (attribute) => new AttributeAdapter(attribute)
        );

        return attributeAdapterToComposeFields(entityAttributes, new Map()) as Record<string, any>;
    }

    private getRelationshipFields(concreteEntity: ConcreteEntity): Record<string, ObjectTypeComposer> {
        return Object.fromEntries(
            [...concreteEntity.relationships.values()].map((relationship) => {
                const relationshipTypes = new NestedEntitySchemaTypes({
                    schemaBuilder: this.schemaBuilder,
                    relationship,
                    entityTypes: this.entity.types.relationship(relationship),
                    staticTypes: this.staticTypes,
                });
                const relationshipType = relationshipTypes.connectionOperation;

                return [relationship.name, relationshipType];
            })
        );
    }
}
