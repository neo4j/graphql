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

import { MathAdapter } from "./MathAdapter";
import { AggregationAdapter } from "./AggregationAdapter";
import { ListAdapter } from "./ListAdapter";
import type { Attribute } from "../Attribute";
import type { Annotations } from "../../annotation/Annotation";
import type { AttributeType } from "../AttributeType";
import {
    EnumType,
    UserScalarType,
    GraphQLBuiltInScalarType,
    InterfaceType,
    ListType,
    Neo4jCartesianPointType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLSpatialType,
    Neo4jGraphQLTemporalType,
    Neo4jPointType,
    ScalarType,
    UnionType,
    ObjectType,
} from "../AttributeType";

export class AttributeAdapter {
    private _listModel: ListAdapter | undefined;
    private _mathModel: MathAdapter | undefined;
    private _aggregationModel: AggregationAdapter | undefined;
    public name: string;
    public annotations: Partial<Annotations>;
    public type: AttributeType;
    public databaseName: string;

    constructor(attribute: Attribute) {
        this.name = attribute.name;
        this.type = attribute.type;
        this.annotations = attribute.annotations;
        this.databaseName = attribute.databaseName;
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
        if (
            (this.isTemporal() ||
                this.isEnum() ||
                this.isInterface() ||
                this.isUnion() ||
                this.isSpatial() ||
                this.isScalar() ||
                this.isObject()) &&
            !this.isCypher()
        ) {
            return true;
        }
        return false;
    }

    isUnique(): boolean {
        return this.annotations.unique ? true : false;
    }

    isCypher(): boolean {
        return this.annotations.cypher ? true : false;
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
    get listModel(): ListAdapter {
        if (!this._listModel) {
            this._listModel = new ListAdapter(this);
        }
        return this._listModel;
    }

    /**
     * @throws {Error} if the attribute is not a scalar
     */
    get mathModel(): MathAdapter {
        if (!this._mathModel) {
            this._mathModel = new MathAdapter(this);
        }
        return this._mathModel;
    }

    get aggregationModel(): AggregationAdapter {
        if (!this._aggregationModel) {
            this._aggregationModel = new AggregationAdapter(this);
        }
        return this._aggregationModel;
    }
    /**
     * Just an helper to get the wrapped type in case of a list, useful for the assertions
     */
    private getTypeForAssertion(includeLists: boolean) {
        if (includeLists) {
            return this.isList() ? this.type.ofType : this.type;
        }
        return this.type;
    }

    isBoolean(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.Boolean;
    }

    isID(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.ID;
    }

    isInt(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.Int;
    }

    isFloat(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.Float;
    }

    isString(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.String;
    }

    isCartesianPoint(includeLists = true):boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof Neo4jCartesianPointType;
    }

    isPoint(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof Neo4jPointType;
    }

    isBigInt(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLNumberType.BigInt;
    }

    isDate(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.Date;
    }

    isDateTime(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.DateTime;
    }

    isLocalDateTime(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.LocalDateTime;
    }

    isTime(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.Time;
    }

    isLocalTime(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return (type.name as Neo4jGraphQLTemporalType) === Neo4jGraphQLTemporalType.LocalTime;
    }

    isDuration(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return (type.name as Neo4jGraphQLTemporalType) === Neo4jGraphQLTemporalType.Duration;
    }

    isObject(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof ObjectType;
    }

    isEnum(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof EnumType;
    }

    isInterface(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof InterfaceType;
    }

    isUnion(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof UnionType;
    }

    isList(): this is this & { type: ListType } {
        return this.type instanceof ListType;
    }

    isUserScalar(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type instanceof UserScalarType;
    }

    isRequired(): boolean {
        return this.type.isRequired;
    }

    isListElementRequired(): boolean {
        if (!(this.type instanceof ListType)) {
            return false;
        }
        return this.type.ofType.isRequired;
    }

    /**
     *  START of category assertions
     */
    isGraphQLBuiltInScalar(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type.name in GraphQLBuiltInScalarType;
    }

    isSpatial(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type.name in Neo4jGraphQLSpatialType;
    }

    isTemporal(includeLists = true): boolean {
        const type = this.getTypeForAssertion(includeLists);
        return type.name in Neo4jGraphQLTemporalType;
    }

    isAbstract(includeLists = true): boolean {
        return this.isInterface(includeLists) || this.isUnion(includeLists);
    }
    /**
     * Returns true for both built-in and user-defined scalars
     **/
    isScalar(): boolean {
        if (this.isGraphQLBuiltInScalar() || this.isTemporal() || this.isBigInt() || this.isUserScalar()) {
            return true;
        }
        return false;
    }

    isNumeric(): boolean {
        return this.isBigInt() || this.isFloat() || this.isInt();
    }

    /**
     *  END of category assertions
     */
}
