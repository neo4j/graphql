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

import { Neo4jGraphQLSchemaValidationError } from "../../classes";
import { setsAreEqual } from "../../utils/sets-are-equal";
import type { Annotation, Annotations } from "../annotation/Annotation";
import { annotationToKey } from "../annotation/Annotation";
import type { Attribute } from "../attribute/Attribute";
import type { Relationship } from "../relationship/Relationship";
import type { CompositeEntity } from "./CompositeEntity";
import type { Entity } from "./Entity";

export class ConcreteEntity implements Entity {
    public readonly name: string;
    public readonly description: string;
    public readonly labels: Set<string>;
    public readonly attributes: Map<string, Attribute> = new Map();
    public readonly relationships: Map<string, Relationship> = new Map();
    public readonly annotations: Partial<Annotations> = {};

    constructor({
        name,
        description,
        labels,
        attributes = [],
        annotations = [],
        relationships = [],
    }: {
        name: string;
        labels: string[];
        attributes?: Attribute[];
        annotations?: Annotation[];
        relationships?: Relationship[];
        description?: string;
    }) {
        this.name = name;
        this.description = description || "";
        this.labels = new Set(labels);
        for (const attribute of attributes) {
            this.addAttribute(attribute);
        }

        for (const annotation of annotations) {
            this.addAnnotation(annotation);
        }

        for (const relationship of relationships) {
            this.addRelationship(relationship);
        }
    }
    isConcreteEntity(): this is ConcreteEntity {
        return true;
    }
    isCompositeEntity(): this is CompositeEntity {
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

    private addAnnotation(annotation: Annotation): void {
        const annotationKey = annotationToKey(annotation);
        const existingAnnotation = this.annotations[annotationKey];

        if (existingAnnotation) {
            throw new Neo4jGraphQLSchemaValidationError(`Annotation ${annotationKey} already exists in ${this.name}`);
        }

        // We cast to any because we aren't narrowing the Annotation type here.
        // There's no reason to narrow either, since we care more about performance.
        this.annotations[annotationKey] = annotation as any;
    }

    public addRelationship(relationship: Relationship): void {
        if (this.relationships.has(relationship.name)) {
            throw new Neo4jGraphQLSchemaValidationError(
                `Attribute ${relationship.name} already exists in ${this.name}`
            );
        }
        this.relationships.set(relationship.name, relationship);
    }

    public findAttribute(name: string): Attribute | undefined {
        return this.attributes.get(name);
    }

    public findRelationship(name: string): Relationship | undefined {
        return this.relationships.get(name);
    }
}
