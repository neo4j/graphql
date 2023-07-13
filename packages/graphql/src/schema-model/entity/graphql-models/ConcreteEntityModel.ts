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
import { AbstractEntity } from "../Entity";
import { singular, plural } from "../../utils/string-manipulation";
import type { ConcreteEntity } from "../ConcreteEntity";
import type { Attribute } from "../../attribute/Attribute";

export class ConcreteEntityModel extends AbstractEntity {
    public readonly attributes: Map<string, AttributeModel> = new Map();
    // TODO: change Relationship to RelationshipModel
    public readonly relationships: Map<string, Relationship> = new Map();
   
    // These keys allow to store the keys of the map in memory and avoid keep iterating over the map.
    private mutableFieldsKeys: string[] = [];
    private uniqueFieldsKeys: string[] = [];
    private constrainableFieldsKeys: string[] = [];

    // TODO: remove this just added to help the migration.
    private readonly listAttributes: Attribute[] = [];

    // typesNames
    private _singular: string | undefined;
    private _plural: string | undefined;

    constructor(entity: ConcreteEntity) {
        super({ name: entity.name, labels: [...entity.labels] });
        this.initAttributes();
    }

    private initAttributes() {
        this.listAttributes.forEach((attribute) => {
            const attributeModel = new AttributeModel(attribute);
            if (attributeModel.isMutable()) {
                this.mutableFieldsKeys.push(attribute.name);
            }
            if (attributeModel.isUnique()) {
                this.uniqueFieldsKeys.push(attribute.name);
            }
            if (attributeModel.isConstrainable()) {
                this.constrainableFieldsKeys.push(attribute.name);
            }

            this.attributes.set(attribute.name, attributeModel);
        });
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
        throw new Error("Method not implemented.");
    }

    public get singular(): string {
        if (!this._singular) {
            this._singular = singular(this.name);
        }
        return this._singular;
    }

    public get plural(): string {
        if (!this._plural) {
            this._plural = plural(this.name);
        }
        return this._plural;
    }
}
