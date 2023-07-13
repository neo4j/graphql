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
import { annotationToKey } from "../annotation/Annotation";
import type { Annotation, Annotations } from "../annotation/Annotation";

export enum GraphQLBuiltInScalarType {
    Int = "Int",
    Float = "Float",
    String = "String",
    Boolean = "Boolean",
    ID = "ID",
}

export enum Neo4jGraphQLSpatialType {
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

export enum ScalarTypeCategory {
    Neo4jGraphQLTemporalType = "Neo4jGraphQLTemporalType",
    Neo4jGraphQLNumberType = "Neo4jGraphQLNumberType",
    Neo4jGraphQLSpatialType = "Neo4jGraphQLSpatialType",
    GraphQLBuiltInScalarType = "GraphQLBuiltInScalarType",
}

export type Neo4jGraphQLScalarType = Neo4jGraphQLTemporalType | Neo4jGraphQLNumberType | Neo4jGraphQLSpatialType;

// The ScalarType class is not used to represent user defined scalar types, see UserScalarType for that
export class ScalarType {
    public readonly name: GraphQLBuiltInScalarType | Neo4jGraphQLScalarType;
    public readonly isRequired: boolean;
    public readonly category: ScalarTypeCategory;
    constructor(name: GraphQLBuiltInScalarType | Neo4jGraphQLScalarType, isRequired: boolean) {
        this.name = name;
        this.isRequired = isRequired;
        switch (name) {
            case GraphQLBuiltInScalarType.String:
            case GraphQLBuiltInScalarType.Boolean:
            case GraphQLBuiltInScalarType.ID:
            case GraphQLBuiltInScalarType.Int:
            case GraphQLBuiltInScalarType.Float:
                this.category = ScalarTypeCategory.GraphQLBuiltInScalarType;
                break;
            case Neo4jGraphQLSpatialType.CartesianPoint:
            case Neo4jGraphQLSpatialType.Point:
                this.category = ScalarTypeCategory.Neo4jGraphQLSpatialType;
                break;
            case Neo4jGraphQLTemporalType.DateTime:
            case Neo4jGraphQLTemporalType.LocalDateTime:
            case Neo4jGraphQLTemporalType.Time:
            case Neo4jGraphQLTemporalType.LocalTime:
            case Neo4jGraphQLTemporalType.Date:
            case Neo4jGraphQLTemporalType.Duration:
                this.category = ScalarTypeCategory.Neo4jGraphQLTemporalType;
                break;
            case Neo4jGraphQLNumberType.BigInt:
                this.category = ScalarTypeCategory.Neo4jGraphQLNumberType;
        }
    }
}

export class UserScalarType {
    public readonly name: string;
    public readonly isRequired: boolean;
    constructor(name: string, isRequired: boolean) {
        this.name = name;
        this.isRequired = isRequired;
    }
}

export class ObjectType {
    public readonly name: string;
    public readonly isRequired: boolean;
    constructor(name: string, isRequired: boolean) {
        this.name = name;
        this.isRequired = isRequired;
    }
}

export class ListType {
    public ofType: Exclude<AttributeType, ListType>;
    public isRequired: boolean;
    constructor(ofType: AttributeType, isRequired: boolean) {
        if (ofType instanceof ListType) {
            throw new Neo4jGraphQLSchemaValidationError("Nested lists are not supported yet");
        }
        this.ofType = ofType;
        this.isRequired = isRequired;
    }
}

export class EnumType {
    public name: string;
    public isRequired: boolean;

    constructor(name: string, isRequired: boolean) {
        this.name = name;
        this.isRequired = isRequired;
    }
}

export type AttributeType = ScalarType | UserScalarType | ObjectType | ListType | EnumType;

export abstract class AbstractAttribute {
    public name: string;
    public type: AttributeType;
    public annotations: Partial<Annotations> = {};

    constructor({
        name,
        type,
        annotations,
    }: {
        name: string;
        type: AttributeType;
        annotations: Annotation[] | Partial<Annotations>;
    }) {
        this.name = name;
        this.type = type;
        if (Array.isArray(annotations)) {
            for (const annotation of annotations) {
                this.addAnnotation(annotation);
            }
        } else {
            this.annotations = annotations;
        }
    }

    isBoolean(): boolean {
        return this.type instanceof ScalarType && this.type.name === GraphQLBuiltInScalarType.Boolean;
    }

    isID(): boolean {
        return this.type instanceof ScalarType && this.type.name === GraphQLBuiltInScalarType.ID;
    }

    isInt(): boolean {
        return this.type instanceof ScalarType && this.type.name === GraphQLBuiltInScalarType.Int;
    }

    isFloat(): boolean {
        return this.type instanceof ScalarType && this.type.name === GraphQLBuiltInScalarType.Float;
    }

    isString(): boolean {
        return this.type instanceof ScalarType && this.type.name === GraphQLBuiltInScalarType.String;
    }

    isCartesianPoint(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLSpatialType.CartesianPoint;
    }

    isPoint(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLSpatialType.Point;
    }

    isBigInt(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLNumberType.BigInt;
    }

    isDate(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.Date;
    }

    isDateTime(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.DateTime;
    }

    isLocalDateTime(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.LocalDateTime;
    }

    isTime(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.Time;
    }

    isLocalTime(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.LocalTime;
    }

    isDuration(): boolean {
        return this.type instanceof ScalarType && this.type.name === Neo4jGraphQLTemporalType.Duration;
    }

    isList(): boolean {
        return this.type instanceof ListType;
    }

    // nested list of type are not supported yet, change this method when they are
    isListOf(elementType: Exclude<AttributeType, ListType> | GraphQLBuiltInScalarType | Neo4jGraphQLScalarType | string): boolean {
        if (!(this.type instanceof ListType)) {
            return false;
        }
        if (typeof elementType === "string") {
            return this.type.ofType.name === elementType;
        }
        
        return this.type.ofType.name === elementType.name;
    }

    isListElementRequired(): boolean {
        if (!(this.type instanceof ListType)) {
            return false;
        }
        return this.type.ofType.isRequired;
    }

    isObject(): boolean {
        return this.type instanceof ObjectType;
    }

    isEnum(): boolean {
        return this.type instanceof EnumType;
    }

    isRequired(): boolean {
        return this.type.isRequired;
    }

    isInterface(): boolean {
        throw new Error("Method not implemented.");
    }

    isUnion(): boolean {
        throw new Error("Method not implemented.");
    }

    isUserScalar(): boolean {
        return this.type instanceof UserScalarType;
    }

    /**
     *  START of category assertions
     */
    isGraphQLBuiltInScalar(): boolean {
        return this.type instanceof ScalarType && this.type.category === ScalarTypeCategory.GraphQLBuiltInScalarType;
    }

    isSpatial(): boolean {
        return this.type instanceof ScalarType && this.type.category === ScalarTypeCategory.Neo4jGraphQLSpatialType;
    }

    isTemporal(): boolean {
        return this.type instanceof ScalarType && this.type.category === ScalarTypeCategory.Neo4jGraphQLTemporalType;
    }

    /**
     *  END of category assertions
     */

    /**
     * START of Refactoring methods, these methods are just adapters to the new methods
     * to help the transition from the old Node/Relationship/BaseField classes
     * */

    // TODO: remove this method and use isGraphQLBuiltInScalar instead
    isPrimitive(): boolean {
        return this.isGraphQLBuiltInScalar();
    }

    // TODO: remove this and use isUserScalar instead
    isScalar(): boolean {
        return this.isUserScalar();
    }

    /**
     * END of refactoring methods
     */

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
