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

import { Neo4jGraphQLSchemaValidationError } from "../../classes/Error";
import type { Annotation, Annotations } from "../annotation/Annotation";
import { AnnotationsKey, annotationToKey } from "../annotation/Annotation";

export enum StandardGraphQLScalarType {
    Int = "Int",
    Float = "Float",
    String = "String",
    Boolean = "Boolean",
    ID = "ID",
} 

export enum Neo4jGraphQLPointType {
    CartesianPoint = "CartesianPoint",
    Point = "Point",
}

export enum Neo4jGraphQLNumberType {
    BigInt = "BigInt",
}

export enum Neo4jGraphQLTemporalType {
    DateTime = "DateTime",
    LocalDateTime = "LocalDateTime",
    Time = "Time",
    LocalTime = "LocalTime",
    Date = "Date",
    Duration = "Duration",
}

type Neo4jGraphQLScalarType = Neo4jGraphQLTemporalType | Neo4jGraphQLNumberType | Neo4jGraphQLPointType;

export type AttributeType = ScalarType | UserScalarType | ObjectType | ListType | EnumType;


export type ScalarTypeType = "Neo4jGraphQLTemporalType" | "Neo4jGraphQLNumberType" | "Neo4jGraphQLPointType" | "StandardGraphQLScalarType";
export class ScalarType  {
    name: StandardGraphQLScalarType | Neo4jGraphQLScalarType;
    isRequired: boolean;
    ofType: ScalarTypeType;
    constructor (name: StandardGraphQLScalarType | Neo4jGraphQLScalarType, isRequired: boolean, ofType: ScalarTypeType) {
        this.name = name;
        this.isRequired = isRequired;
        this.ofType = ofType;
    }
}


export class UserScalarType {
    name: string;
    isRequired: boolean;
    constructor(name: string, isRequired: boolean) {
        this.name = name;
        this.isRequired = isRequired;
    }
}

export class ObjectType  {
    name: string;
    isRequired: boolean;
    constructor(name: string, isRequired: boolean) {
        this.name = name;
        this.isRequired = isRequired;
    }
}

export class ListType {
    ofType: AttributeType;
    isRequired: boolean;
    constructor(ofType: AttributeType, isRequired: boolean) {
        this.ofType = ofType;
        this.isRequired = isRequired;
    }
}

export class EnumType {
    name: string;
    constructor(name: string) {
        this.name = name;
    }
}

export class Attribute {
    public readonly name: string;
    public readonly annotations: Partial<Annotations> = {};
    public readonly type: AttributeType;
    public isCypherField = false;

    constructor({
        name,
        annotations,
        type,
    }: {
        name: string;
        annotations: Annotation[];
        type: AttributeType;
    }) {
        this.name = name;
        this.type = type;

        for (const annotation of annotations) {
            this.addAnnotation(annotation);
        }
    }

    public clone(): Attribute {
        return new Attribute({
            name: this.name,
            annotations: Object.values(this.annotations),
            type: this.type,
        });
    }


    private addAnnotation(annotation: Annotation): void {
        const annotationKey = annotationToKey(annotation);
        if (this.annotations[annotationKey]) {
            throw new Neo4jGraphQLSchemaValidationError(`Annotation ${annotationKey} already exists in ${this.name}`);
        }

        if (annotationKey === AnnotationsKey.cypher) {
            this.isCypherField = true;
        }
        // We cast to any because we aren't narrowing the Annotation type here.
        // There's no reason to narrow either, since we care more about performance.
        this.annotations[annotationKey] = annotation as any;
    }
}
