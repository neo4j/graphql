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

import { MathModel } from "./MathModel";
import { AggregationModel } from "./AggregationModel";
import { ListModel } from "./ListModel";
import type { Attribute } from "../Attribute";
import type { Annotations } from "../../annotation/Annotation";
import {
    EnumType,
    GraphQLBuiltInScalarType,
    InterfaceType,
    ListType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLSpatialType,
    Neo4jGraphQLTemporalType,
    ObjectType,
    ScalarType,
    ScalarTypeCategory,
    UnionType,
    UserScalarType,
} from "../AttributeType";
import type { Neo4jGraphQLScalarType, AttributeType } from "../AttributeType";

export class AttributeModel {
    private _listModel: ListModel | undefined;
    private _mathModel: MathModel | undefined;
    private _aggregationModel: AggregationModel | undefined;
    public name: string;
    public annotations: Partial<Annotations>;
    public type: AttributeType;

    constructor(attribute: Attribute) {
        this.name = attribute.name;
        this.type = attribute.type;
        this.annotations = attribute.annotations;
    }

    /**
     * Previously defined as:
     * [
            ...this.temporalFields,
            ...this.enumFields,
            ...this.objectFields,
            ...this.scalarFields, 
            ...this.primitiveFields, 
            ...this.interfaceFields,
            ...this.objectFields,
            ...this.unionFields,
            ...this.pointFields,
        ];
     */
    isMutable(): boolean {
        return (
            (this.isTemporal() ||
                this.isEnum() ||
                this.isObject() ||
                this.isScalar() ||
                this.isGraphQLBuiltInScalar() ||
                this.isInterface() ||
                this.isUnion() ||
                this.isPoint()) &&
            !this.isCypher()
        );
    }

    isUnique(): boolean {
        return this.annotations.unique ? true : false;
    }

    /**
     *  Previously defined as:
     * [...this.primitiveFields,
       ...this.scalarFields,
       ...this.enumFields,
       ...this.temporalFields,
       ...this.pointFields,]
     */
    isConstrainable(): boolean {
        return this.isGraphQLBuiltInScalar() || this.isScalar() || this.isEnum() || this.isTemporal() || this.isPoint();
    }

    /**
     * @throws {Error} if the attribute is not a list
     */
    get listModel(): ListModel {
        if (!this._listModel) {
            this._listModel = new ListModel(this);
        }
        return this._listModel;
    }

    /**
     * @throws {Error} if the attribute is not a scalar
     */
    get mathModel(): MathModel {
        if (!this._mathModel) {
            this._mathModel = new MathModel(this);
        }
        return this._mathModel;
    }

    get aggregationModel(): AggregationModel {
        if (!this._aggregationModel) {
            this._aggregationModel = new AggregationModel(this);
        }
        return this._aggregationModel;
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

    isListOf(
        elementType: Exclude<AttributeType, ListType> | GraphQLBuiltInScalarType | Neo4jGraphQLScalarType | string
    ): boolean {
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
        return this.type instanceof InterfaceType;
    }

    isUnion(): boolean {
        return this.type instanceof UnionType;
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

    isAbstract(): boolean {
        return this.isInterface() || this.isUnion();
    }

    isScalar(): boolean {
        return this.isGraphQLBuiltInScalar() || this.isUserScalar() || this.isSpatial() || this.isTemporal() || this.isBigInt();
    }

    isNumeric(): boolean {
        return this.isBigInt() || this.isFloat() || this.isInt();
    }

    /**
     *  END of category assertions
     */

    isCypher(): boolean {
        return this.annotations.cypher ? true : false;
    }

}
