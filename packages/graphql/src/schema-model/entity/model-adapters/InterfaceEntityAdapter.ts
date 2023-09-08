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
import type { ConcreteEntity } from "../ConcreteEntity";
import type { InterfaceEntity } from "../InterfaceEntity";
import { ConcreteEntityAdapter } from "./ConcreteEntityAdapter";

export class InterfaceEntityAdapter {
    public readonly name: string;
    public concreteEntities: ConcreteEntityAdapter[];
    public readonly attributes: Map<string, AttributeAdapter> = new Map();
    public readonly relationships: Map<string, RelationshipAdapter> = new Map();
    public readonly annotations: Partial<Annotations>;
    private uniqueFieldsKeys: string[] = [];

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

    public get uniqueFields(): AttributeAdapter[] {
        return this.uniqueFieldsKeys.map((key) => getFromMap(this.attributes, key));
    }
}
