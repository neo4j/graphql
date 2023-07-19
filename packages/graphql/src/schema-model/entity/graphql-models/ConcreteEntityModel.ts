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

import { AttributeModel } from "../../attribute/graphql-models/AttributeModel";
import type { Relationship } from "../../relationship/Relationship";
import { getFromMap } from "../../utils/get-from-map";
import type { Entity } from "../Entity";
import { singular, plural } from "../../utils/string-manipulation";
import type { ConcreteEntity } from "../ConcreteEntity";
import type { Attribute } from "../../attribute/Attribute";
import { RelationshipModel } from "../../relationship/graphql-model/RelationshipModel";

export class ConcreteEntityModel {
    public readonly name: string;
    public readonly labels: Set<string>;
    public readonly attributes: Map<string, AttributeModel> = new Map();
    public readonly relationships: Map<string, RelationshipModel> = new Map();

    // These keys allow to store the keys of the map in memory and avoid keep iterating over the map.
    private mutableFieldsKeys: string[] = [];
    private uniqueFieldsKeys: string[] = [];
    private constrainableFieldsKeys: string[] = [];

    // typesNames
    private _singular: string | undefined;
    private _plural: string | undefined;

    constructor(entity: ConcreteEntity) {
        this.name = entity.name;
        this.labels = entity.labels;
        this.initAttributes(entity.attributes);
        this.initRelationships(entity.relationships);
    }

    private initAttributes(attributes: Map<string, Attribute>) {
        for (const [attributeName, attribute] of attributes.entries()) {
            const attributeModel = new AttributeModel(attribute);
            this.attributes.set(attributeName, attributeModel);
            if (attributeModel.isMutable()) {
                this.mutableFieldsKeys.push(attribute.name);
            }
            if (attributeModel.isUnique()) {
                this.uniqueFieldsKeys.push(attribute.name);
            }
            if (attributeModel.isConstrainable()) {
                this.constrainableFieldsKeys.push(attribute.name);
            }
        }
    }

    private initRelationships(relationships: Map<string, Relationship>) {
        for (const [relationshipName, relationship] of relationships.entries()) {
            const {name, type, direction, target, attributes } = relationship;
            this.relationships.set(relationshipName, new RelationshipModel({name, type, direction, source: this, target, attributes }));
        }
    }

    public get mutableFields(): AttributeModel[] {
        return this.mutableFieldsKeys.map((key) => getFromMap(this.attributes, key));
    }

    public get uniqueFields(): AttributeModel[] {
        return this.uniqueFieldsKeys.map((key) => getFromMap(this.attributes, key));
    }

    public get constrainableFields(): AttributeModel[] {
        return this.constrainableFieldsKeys.map((key) => getFromMap(this.attributes, key));
    }

    public get relationshipAttributesName(): string[] {
        return [...this.relationships.keys()];
    }

    public getRelatedEntities(): Entity[] {
        return [...this.relationships.values()].map((relationship) => relationship.target);
    }

    public getAllLabels(): string[] {
        return this.labels ? [...this.labels] : [this.name];
    }


    public get singular(): string {
        if (!this._singular) {
            this._singular = singular(this.name);
        }
        return this._singular;
    }

    public get plural(): string {
        if (!this._plural) {
            // TODO: consider case when the plural is defined with the plural annotation
            this._plural = plural(this.name);

        }
        return this._plural;
    }
}
