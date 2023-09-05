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

import { AttributeAdapter } from "../../attribute/model-adapters/AttributeAdapter";
import type { Relationship } from "../../relationship/Relationship";
import { getFromMap } from "../../utils/get-from-map";
import { singular, plural } from "../../utils/string-manipulation";
import type { ConcreteEntity } from "../ConcreteEntity";
import type { Attribute } from "../../attribute/Attribute";
import { RelationshipAdapter } from "../../relationship/model-adapters/RelationshipAdapter";
import type { Annotations } from "../../annotation/Annotation";
import { ConcreteEntityOperations } from "./ConcreteEntityOperations";
import type { InterfaceEntityAdapter } from "./InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "./UnionEntityAdapter";

export class ConcreteEntityAdapter {
    public readonly name: string;
    public readonly description: string;
    public readonly labels: Set<string>;
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    public readonly relationships: Map<string, RelationshipAdapter> = new Map();
    public readonly annotations: Partial<Annotations>;

    // These keys allow to store the keys of the map in memory and avoid keep iterating over the map.
    private mutableFieldsKeys: string[] = [];
    private uniqueFieldsKeys: string[] = [];
    private constrainableFieldsKeys: string[] = [];

    private _relatedEntities: (ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter)[] | undefined;

    private _singular: string | undefined;
    private _plural: string | undefined;

    // specialize models
    private _operations: ConcreteEntityOperations | undefined;

    constructor(entity: ConcreteEntity) {
        this.name = entity.name;
        this.description = entity.description;
        this.labels = entity.labels;
        this.annotations = entity.annotations;
        this.initAttributes(entity.attributes);
        this.initRelationships(entity.relationships);
    }

    private initAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeAdapter = new AttributeAdapter(attribute);
            this.attributes.set(attributeName, attributeAdapter);
            if (attributeAdapter.isMutable()) {
                this.mutableFieldsKeys.push(attribute.name);
            }

            if (attributeAdapter.isConstrainable()) {
                this.constrainableFieldsKeys.push(attribute.name);
                if (attributeAdapter.isUnique()) {
                    this.uniqueFieldsKeys.push(attribute.name);
                }
            }
        }
    }

    private initRelationships(relationships: Map<string, Relationship>) {
        for (const [relationshipName, relationship] of relationships.entries()) {
            this.relationships.set(relationshipName, new RelationshipAdapter(relationship, this));
        }
    }

    public get mutableFields(): AttributeAdapter[] {
        return this.mutableFieldsKeys.map((key) => getFromMap(this.attributes, key));
    }

    public get uniqueFields(): AttributeAdapter[] {
        return this.uniqueFieldsKeys.map((key) => getFromMap(this.attributes, key));
    }

    public get constrainableFields(): AttributeAdapter[] {
        return this.constrainableFieldsKeys.map((key) => getFromMap(this.attributes, key));
    }

    public get relatedEntities(): (ConcreteEntityAdapter | InterfaceEntityAdapter | UnionEntityAdapter)[] {
        if (!this._relatedEntities) {
            this._relatedEntities = [...this.relationships.values()].map((relationship) => relationship.target);
        }
        return this._relatedEntities;
    }

    // TODO: identify usage of old Node.[getLabels | getLabelsString] and migrate them if needed
    public getLabels(): string[] {
        return Array.from(this.labels);
    }

    public getMainLabel(): string {
        return this.getLabels()[0] as string;
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

    get operations(): ConcreteEntityOperations {
        if (!this._operations) {
            return new ConcreteEntityOperations(this);
        }
        return this._operations;
    }

    // TODO: Implement the Globals methods toGlobalId and fromGlobalId, getGlobalId etc...
}
