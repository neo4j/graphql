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
import { AttributeAdapter } from "../../../schema-model/attribute/model-adapters/AttributeAdapter";
import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import { attributeAdapterToComposeFields } from "../../../schema/to-compose";
import type { RelatedEntityTypeNames } from "../../graphql-type-names/RelatedEntityTypeNames";
import type { SchemaBuilder } from "../SchemaBuilder";
import { EntityTypes } from "./EntityTypes";
import type { StaticTypes } from "./StaticTypes";

export class NestedEntitySchemaTypes extends EntityTypes<RelatedEntityTypeNames> {
    private relationship: Relationship;

    constructor({
        relationship,
        schemaBuilder,
        entityTypeNames,
        staticTypes,
    }: {
        schemaBuilder: SchemaBuilder;
        relationship: Relationship;
        staticTypes: StaticTypes;
        entityTypeNames: RelatedEntityTypeNames;
    }) {
        super({
            schemaBuilder,
            entityTypeNames,
            staticTypes,
        });
        this.relationship = relationship;
    }

    @Memoize()
    public get nodeType(): string {
        const target = this.relationship.target;
        if (!(target instanceof ConcreteEntity)) {
            throw new Error("Interfaces not supported yet");
        }
        return target.typeNames.node;
    }
    @Memoize()
    public get nodeSortType(): string {
        const target = this.relationship.target;
        if (!(target instanceof ConcreteEntity)) {
            throw new Error("Interfaces not supported yet");
        }
        return target.typeNames.nodeSort;
    }

    @Memoize()
    protected getEdgeProperties(): ObjectTypeComposer | undefined {
        if (this.entityTypeNames.properties) {
            const fields = this.getRelationshipFields();
            return this.schemaBuilder.getOrCreateObjectType(this.entityTypeNames.properties, fields);
        }
    }

    @Memoize()
    protected getEdgeSortProperties(): InputTypeComposer | undefined {
        if (this.entityTypeNames.propertiesSort) {
            const fields = this.getRelationshipSortFields();
            return this.schemaBuilder.getOrCreateInputObjectType(this.entityTypeNames.propertiesSort, fields);
        }
    }

    @Memoize()
    protected getFields(): Attribute[] {
        return [...this.relationship.attributes.values()];
    }

    @Memoize()
    private getRelationshipFields(): Record<string, string> {
        const entityAttributes = this.getFields().map((attribute) => new AttributeAdapter(attribute));
        return attributeAdapterToComposeFields(entityAttributes, new Map()) as Record<string, any>;
    }

    @Memoize()
    private getRelationshipSortFields(): Record<string, EnumTypeComposer> {
        return Object.fromEntries(
            this.getFields().map((attribute) => [attribute.name, this.staticTypes.sortDirection])
        );
    }
}
