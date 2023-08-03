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

import type { DateTime, Duration, Integer, LocalDateTime, LocalTime, Time } from "neo4j-driver";
import { Neo4jGraphQLSchemaValidationError } from "../../classes/Error";
import { annotationToKey, type Annotation, type Annotations } from "../annotation/Annotation";
import type { AttributeType } from "./AttributeType";

export type PopulatedBy = {
    callback: string;
    when: ("CREATE" | "UPDATE")[];
};

export type GraphQLDefaultValueType = {
    value?:
        | string
        | number
        | boolean
        | Time<number>
        | LocalTime<number>
        | LocalDateTime<number>
        | Duration
        | DateTime<number>
        | Date
        | Integer;
    populatedBy?: PopulatedBy;
};

export class Attribute {
    public readonly name: string;
    public readonly annotations: Partial<Annotations> = {};
    public readonly type: AttributeType;
    public readonly databaseName: string;
    public readonly defaultValue?: GraphQLDefaultValueType;

    constructor({
        name,
        annotations = [],
        type,
        databaseName,
        defaultValue,
    }: {
        name: string;
        annotations: Annotation[];
        type: AttributeType;
        databaseName?: string;
        defaultValue?: GraphQLDefaultValueType;
    }) {
        this.name = name;
        this.type = type;
        this.databaseName = databaseName ?? name;
        this.defaultValue = defaultValue;

        for (const annotation of annotations) {
            this.addAnnotation(annotation);
        }
    }

    public clone(): Attribute {
        return new Attribute({
            name: this.name,
            annotations: Object.values(this.annotations),
            type: this.type,
            databaseName: this.databaseName,
            defaultValue: this.defaultValue,
        });
    }

    private addAnnotation(annotation: Annotation): void {
        const annotationKey = annotationToKey(annotation);
        if (this.annotations[annotationKey]) {
            throw new Neo4jGraphQLSchemaValidationError(`Annotation ${annotationKey} already exists in ${this.name}`);
        }

        // We cast to any because we aren't narrowing the Annotation type here.
        // There's no reason to narrow either, since we care more about performance.
        this.annotations[annotationKey] = annotation as any;
    }
}
