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

import { TopLevelEntityTypeNames } from "../../api-v6/graphQLTypeNames/TopLevelEntityTypeNames";
import { Neo4jGraphQLSchemaValidationError } from "../../classes";
import { setsAreEqual } from "../../utils/sets-are-equal";
import type { Annotations } from "../annotation/Annotation";
import type { Attribute } from "../attribute/Attribute";
import type { Relationship } from "../relationship/Relationship";
import type { CompositeEntity } from "./CompositeEntity";
import type { Entity } from "./Entity";

export class ConcreteEntity implements Entity {
    public readonly name: string;
    public readonly description?: string;
    public readonly labels: Set<string>;
    public readonly attributes: Map<string, Attribute> = new Map();
    public readonly relationships: Map<string, Relationship> = new Map();
    public readonly annotations: Partial<Annotations>;
    public readonly compositeEntities: CompositeEntity[] = []; // The composite entities that this entity is a part of

    constructor({
        name,
        description,
        labels,
        attributes = [],
        annotations = {},
        relationships = [],
        compositeEntities = [],
    }: {
        name: string;
        labels: string[];
        attributes?: Attribute[];
        annotations?: Partial<Annotations>;
        relationships?: Relationship[];
        description?: string;
        compositeEntities?: CompositeEntity[];
    }) {
        this.name = name;
        this.description = description;
        this.labels = new Set(labels);
        this.annotations = annotations;
        for (const attribute of attributes) {
            this.addAttribute(attribute);
        }

        for (const relationship of relationships) {
            this.addRelationship(relationship);
        }

        for (const entity of compositeEntities) {
            this.addCompositeEntities(entity);
        }
    }

    /** Note: Types of the new API */
    public get typeNames(): TopLevelEntityTypeNames {
        return new TopLevelEntityTypeNames(this);
    }

    public isConcreteEntity(): this is ConcreteEntity {
        return true;
    }

    public isCompositeEntity(): this is CompositeEntity {
        return false;
    }

    public matchLabels(labels: string[]) {
        return setsAreEqual(new Set(labels), this.labels);
    }

    private addAttribute(attribute: Attribute): void {
        if (this.attributes.has(attribute.name)) {
            throw new Neo4jGraphQLSchemaValidationError(`Attribute ${attribute.name} already exists in ${this.name}`);
        }
        this.attributes.set(attribute.name, attribute);
    }

    public addRelationship(relationship: Relationship): void {
        if (this.relationships.has(relationship.name)) {
            throw new Neo4jGraphQLSchemaValidationError(
                `Attribute ${relationship.name} already exists in ${this.name}`
            );
        }
        this.relationships.set(relationship.name, relationship);
    }

    public addCompositeEntities(entity: CompositeEntity): void {
        this.compositeEntities.push(entity);
    }

    public findAttribute(name: string): Attribute | undefined {
        return this.attributes.get(name);
    }

    public findRelationship(name: string): Relationship | undefined {
        return this.relationships.get(name);
    }

    public hasAttribute(name: string): boolean {
        return this.attributes.has(name);
    }

    public hasRelationship(name: string): boolean {
        return this.relationships.has(name);
    }
}
