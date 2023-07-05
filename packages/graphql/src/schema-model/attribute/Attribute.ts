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
import { AGGREGATION_COMPARISON_OPERATORS } from "../../constants";
import type {
    PrimitiveField,
    CustomScalarField,
    CustomEnumField,
    UnionField,
    ObjectField,
    TemporalField,
    PointField,
    CypherField,
} from "../../types";
import type { Annotation, Annotations } from "../annotation/Annotation";
import { AnnotationsKey, annotationToKey } from "../annotation/Annotation";

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

type Neo4jGraphQLScalarType = Neo4jGraphQLTemporalType | Neo4jGraphQLNumberType | Neo4jGraphQLSpatialType;

export type AttributeType = ScalarType | UserScalarType | ObjectType | ListType | EnumType;

export type ScalarTypeType =
    | "Neo4jGraphQLTemporalType"
    | "Neo4jGraphQLNumberType"
    | "Neo4jGraphQLPointType"
    | "GraphQLBuiltInScalarType";

export class ScalarType {
    name: GraphQLBuiltInScalarType | Neo4jGraphQLScalarType;
    isRequired: boolean;
    ofType: ScalarTypeType;
    constructor(name: GraphQLBuiltInScalarType | Neo4jGraphQLScalarType, isRequired: boolean, ofType: ScalarTypeType) {
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

export class ObjectType {
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
    private _attributeModel: AttributeModel | undefined;

    constructor({ name, annotations, type }: { name: string; annotations: Annotation[]; type: AttributeType }) {
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

    get attributeModel(): AttributeModel {
        if (!this._attributeModel) {
            this._attributeModel = new AttributeModel(this);
        }
        return this._attributeModel;
    }

    isInt(): boolean {
        return false;
    }

    isBigInt(): boolean {
        return false;
    }

    isFloat(): boolean {
        return false;
    }

    isList(): boolean {
        return false;
    }

    isRequired(): boolean {
        return true;
    }

    isScalar(): boolean {
        return this.type instanceof ScalarType;
    }

    isCustomScalar(): boolean {
        return false;
    }

    isSpatial(): boolean {
        return false;
    }

    isTemporal(): boolean {
        return false;
    }

    isObject(): boolean {
        return false;
    }

    isEnum(): boolean {
        return false;
    }
    // isGraphQLBuiltInScalarType is the same as isPrimitive
    isGraphQLBuiltInScalar(): boolean {
        return this.isScalar() && (this.type as ScalarType).ofType === "GraphQLBuiltInScalarType";
    }
}

type MutableField =
    | PrimitiveField
    | CustomScalarField
    | CustomEnumField
    | UnionField
    | ObjectField
    | TemporalField
    | PointField
    | CypherField;

class AttributeModel {
    readonly attribute: Attribute;
    constructor(attribute: Attribute) {
        this.attribute = attribute;
    }

    isMutable(): boolean {
        // this is based on the assumption that interface fields and union fields are object fields
        return (
            this.isSpatial() || this.isTemporal() || this.isEnum() || this.isObject() || this.isGraphQLBuiltInScalar()
        );
    }

    isUnique(): boolean {
        //return this.attribute.annotations.unique ? true : false;
        return false;
    }
    // TODO: remember to figure out constrainableFields

    /**
     * @throws {Error} if the attribute is not a list
     */
    getListModel(): ListModel {
        return new ListModel(this);
    }

    /**
     * @throws {Error} if the attribute is not a scalar
     */
    getMathModel(): MathModel {
        return new MathModel(this);
    }

    /**
     * The following are just proxy methods to the attribute methods for convenience.
     * the idea is to improve the ergonomic for the client for case when they want to access information about the Attribute model,
     * and they are forced to switch between the attribute and the attribute model.
     *
     **/
    /**
     * START OF PROXY METHODS
     **/
    isCustomScalar(): boolean {
        return this.attribute.isCustomScalar();
    }

    isInt(): boolean {
        return this.attribute.isInt();
    }

    isBigInt(): boolean {
        return this.attribute.isBigInt();
    }

    isFloat(): boolean {
        return this.attribute.isFloat();
    }

    isList(): boolean {
        return this.attribute.isList();
    }

    isRequired(): boolean {
        return this.attribute.isRequired();
    }

    isScalar(): boolean {
        return this.attribute.isScalar();
    }

    isGraphQLBuiltInScalar(): boolean {
        return this.attribute.isGraphQLBuiltInScalar();
    }

    isSpatial(): boolean {
        return this.attribute.isSpatial();
    }

    isTemporal(): boolean {
        return this.attribute.isSpatial();
    }

    isObject(): boolean {
        return this.attribute.isObject();
    }

    isEnum(): boolean {
        return this.attribute.isEnum();
    }
    /**
     * END OF PROXY METHODS
     **/
}

class MathModel {
    readonly attributeModel: AttributeModel;
    constructor(attributeModel: AttributeModel) {
        if (!attributeModel.isScalar()) {
            throw new Error("Attribute is not a scalar");
        }
        this.attributeModel = attributeModel;
    }

    getMathMethods(): string[] {
        return [this.getAdd()];
    }

    getAdd(): string {
        return this.attributeModel.attribute.isInt() || this.attributeModel.attribute.isBigInt()
            ? `${this.attributeModel.attribute.name}_ADD`
            : `${this.attributeModel.attribute.name}_INCREMENT`;
    }
}

class AggregationModel {
    readonly attributeModel: AttributeModel;
    constructor(attributeModel: AttributeModel) {
        if (!attributeModel.isScalar()) {
            throw new Error("Attribute is not a scalar");
        }
        this.attributeModel = attributeModel;
    }

    getAggregationMethods(): string[] {
        return [...this.getAverageMethods()];
    }

    getAverageMethods(): string[] {
        return AGGREGATION_COMPARISON_OPERATORS.map(
            (operator) => `${this.attributeModel.attribute.name}_AVERAGE_${operator}`
        );
    }
    isAggregate(string): boolean {
        
    } 
}

class ListModel {
    readonly attributeModel: AttributeModel;

    constructor(attributeModel: AttributeModel) {
        if (!attributeModel.attribute.isList()) {
            throw new Error("Attribute is not a list");
        }
        this.attributeModel = attributeModel;
    }

    getArrayMethods(): string[] {
        return [this.getPush(), this.getPop()];
    }

    getPush(): string {
        return `${this.attributeModel.attribute.name}_PUSH`;
    }

    getPop(): string {
        return `${this.attributeModel.attribute.name}_POP`;
    }
}
