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

import type { ConcreteEntity } from "./ConcreteEntity";
import type { CompositeEntity } from "./CompositeEntity";
import type { Annotation, Annotations } from "../annotation/Annotation";
import { annotationToKey } from "../annotation/Annotation";
import { Neo4jGraphQLSchemaValidationError } from "../../classes";

export class UnionEntity implements CompositeEntity {
    public readonly name: string;
    public concreteEntities: ConcreteEntity[];

    public readonly annotations: Partial<Annotations> = {};

    constructor({
        name,
        concreteEntities,
        annotations = [],
    }: {
        name: string;
        concreteEntities: ConcreteEntity[];
        annotations?: Annotation[];
    }) {
        this.name = name;
        this.concreteEntities = concreteEntities;

        for (const annotation of annotations) {
            this.addAnnotation(annotation);
        }
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

    isConcreteEntity(): this is ConcreteEntity {
        return false;
    }
    isCompositeEntity(): this is CompositeEntity {
        return true;
    }
}
