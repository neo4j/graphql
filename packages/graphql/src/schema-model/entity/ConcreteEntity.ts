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
import { annotationToKey } from "../annotation/Annotation";
import type { Annotation, Annotations } from "../annotation/Annotation";
import type { Attribute } from "../attribute/Attribute";
import type { Entity } from "./Entity";
import { Relationship } from "../relationship/Relationship";
import { setsAreEqual } from "../../utils/sets-are-equal";

export class ConcreteEntity implements Entity {
    public readonly name: string;
    public readonly labels: Set<string>;
    public readonly attributes: Map<string, Attribute> = new Map();
    public readonly relationships: Map<string, Relationship> = new Map();
    public readonly annotations: Partial<Annotations> = {};

    constructor({
        name,
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
    }) {
        this.name = name;
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
        if (this.annotations[annotationKey]) {
            throw new Neo4jGraphQLSchemaValidationError(`Annotation ${annotationKey} already exists in ${this.name}`);
        }
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
