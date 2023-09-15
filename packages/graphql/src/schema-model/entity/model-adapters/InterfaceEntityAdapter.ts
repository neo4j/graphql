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

import type { Annotations } from "../../annotation/Annotation";
import type { Attribute } from "../../attribute/Attribute";
import { AttributeAdapter } from "../../attribute/model-adapters/AttributeAdapter";
import { RelationshipAdapter } from "../../relationship/model-adapters/RelationshipAdapter";
import type { Relationship } from "../../relationship/Relationship";
import { getFromMap } from "../../utils/get-from-map";
import { plural, singular } from "../../utils/string-manipulation";
import type { ConcreteEntity } from "../ConcreteEntity";
import type { InterfaceEntity } from "../InterfaceEntity";
import { ConcreteEntityAdapter } from "./ConcreteEntityAdapter";
import { InterfaceEntityOperations } from "./InterfaceEntityOperations";

export class InterfaceEntityAdapter {
    public readonly name: string;
    public concreteEntities: ConcreteEntityAdapter[];
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    public readonly relationships: Map<string, RelationshipAdapter> = new Map();
    public readonly annotations: Partial<Annotations>;
    private uniqueFieldsKeys: string[] = [];

    private _singular: string | undefined;
    private _plural: string | undefined;

    // specialize models
    private _operations: InterfaceEntityOperations | undefined;

    constructor(entity: InterfaceEntity) {
        this.name = entity.name;
        this.concreteEntities = [];
        this.annotations = entity.annotations;
        this.initAttributes(entity.attributes);
        this.initRelationships(entity.relationships);
        this.initConcreteEntities(entity.concreteEntities);
    }

    private initConcreteEntities(entities: ConcreteEntity[]) {
        for (const entity of entities) {
            const entityAdapter = new ConcreteEntityAdapter(entity);
            this.concreteEntities.push(entityAdapter);
        }
    }

    private initAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeAdapter = new AttributeAdapter(attribute);
            this.attributes.set(attributeName, attributeAdapter);
            if (attributeAdapter.isConstrainable() && attributeAdapter.isUnique()) {
                this.uniqueFieldsKeys.push(attribute.name);
            }
        }
    }

    private initRelationships(relationships: Map<string, Relationship>) {
        for (const [relationshipName, relationship] of relationships.entries()) {
            this.relationships.set(relationshipName, new RelationshipAdapter(relationship, this));
        }
    }

    public get singular(): string {
        if (!this._singular) {
            this._singular = singular(this.name);
        }
        return this._singular;
    }

    public get plural(): string {
        if (!this._plural) {
            if (this.annotations.plural) {
                this._plural = plural(this.annotations.plural.value);
            } else {
                this._plural = plural(this.name);
            }
        }
        return this._plural;
    }

    get operations(): InterfaceEntityOperations {
        if (!this._operations) {
            return new InterfaceEntityOperations(this);
        }
        return this._operations;
    }

    public get uniqueFields(): AttributeAdapter[] {
        return this.uniqueFieldsKeys.map((key) => getFromMap(this.attributes, key));
    }

    public get sortableFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isSortableField());
    }

    public get updateInputFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isUpdateInputField());
    }
    public get subscriptionEventPayloadFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isEventPayloadField());
    }
    public get subscriptionWhereFields(): AttributeAdapter[] {
        return Array.from(this.attributes.values()).filter((attribute) => attribute.isSubscriptionWhereField());
    }
}
