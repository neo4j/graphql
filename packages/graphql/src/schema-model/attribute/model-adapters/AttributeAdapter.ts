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

import type { Annotations } from "../../annotation/Annotation";
import type { Argument } from "../../argument/Argument";
import type { Attribute } from "../Attribute";
import type { AttributeType } from "../AttributeType";
import {
    EnumType,
    GraphQLBuiltInScalarType,
    InputType,
    InterfaceType,
    ListType,
    Neo4jCartesianPointType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLSpatialType,
    Neo4jGraphQLTemporalType,
    Neo4jPointType,
    ObjectType,
    ScalarType,
    UnionType,
    UserScalarType,
} from "../AttributeType";
import { AggregationAdapter } from "./AggregationAdapter";
import { ListAdapter } from "./ListAdapter";
import { MathAdapter } from "./MathAdapter";

export class AttributeAdapter {
    private _listModel: ListAdapter | undefined;
    private _mathModel: MathAdapter | undefined;
    private _aggregationModel: AggregationAdapter | undefined;
    public readonly name: string;
    public readonly annotations: Partial<Annotations>;
    public readonly type: AttributeType;
    public readonly args: Argument[];
    public readonly databaseName: string;
    public readonly description?: string;
    private assertionOptions: {
        includeLists: boolean;
    };
    constructor(attribute: Attribute) {
        this.name = attribute.name;
        this.type = attribute.type;
        this.args = attribute.args;
        this.annotations = attribute.annotations;
        this.databaseName = attribute.databaseName;
        this.description = attribute.description;
        this.assertionOptions = {
            includeLists: true,
        };
    }

    isMutable(): boolean {
        return (
            (this.isEnum() || this.isAbstract() || this.isSpatial() || this.isScalar() || this.isObject()) &&
            !this.isCypher()
        );
    }

    isUnique(): boolean {
        return !!this.annotations.unique || this.isGlobalIDAttribute() === true;
    }

    isCypher(): boolean {
        return !!this.annotations.cypher;
    }

    isConstrainable(): boolean {
        return (
            this.isGraphQLBuiltInScalar() ||
            this.isUserScalar() ||
            this.isEnum() ||
            this.isTemporal() ||
            this.isSpatial()
        );
    }

    isObjectField(): boolean {
        return this.isScalar() || this.isEnum() || this.isAbstract() || this.isObject() || this.isSpatial();
    }

    isRootTypeObjectField(): boolean {
        return (
            this.isGraphQLBuiltInScalar() ||
            this.isEnum() ||
            this.isUserScalar() ||
            this.isInterface() ||
            this.isObject() ||
            this.isUnion() ||
            this.isTemporal() ||
            this.isBigInt()
        );
    }

    isSortableField(): boolean {
        return (
            !this.isList() &&
            !this.isCustomResolvable() &&
            (this.isScalar() || this.isEnum() || this.isSpatial() || this.isCypher())
        );
    }

    isWhereField(): boolean {
        return (
            (this.isEnum() || this.isSpatial() || this.isScalar()) &&
            this.isFilterable() &&
            !this.isCustomResolvable() &&
            !this.isCypher()
        );
    }

    isEventPayloadField(): boolean {
        return this.isEnum() || this.isSpatial() || this.isScalar();
    }

    isSubscriptionWhereField(): boolean {
        return (this.isEnum() || this.isSpatial() || this.isScalar()) && !this.isCypher();
    }

    isSubscriptionConnectedRelationshipField(): boolean {
        return (this.isEnum() || this.isSpatial() || this.isScalar()) && !this.isCypher();
    }

    isOnCreateField(): boolean {
        return (
            this.isNonGeneratedField() && (this.isScalar() || this.isSpatial() || this.isEnum() || this.isAbstract())
        );
    }

    isNumericalOrTemporal(): boolean {
        return this.isFloat() || this.isInt() || this.isBigInt() || this.isTemporal();
    }

    isAggregableField(): boolean {
        return !this.isList() && (this.isScalar() || this.isEnum()) && this.isAggregable();
    }

    isAggregationWhereField(): boolean {
        const isGraphQLBuiltInScalarWithoutBoolean = this.isGraphQLBuiltInScalar() && !this.isBoolean();
        const isTemporalWithoutDate = this.isTemporal() && !this.isDate();
        return (
            !this.isList() &&
            (isGraphQLBuiltInScalarWithoutBoolean || isTemporalWithoutDate || this.isBigInt()) &&
            this.isAggregationFilterable()
        );
    }

    isCreateInputField(): boolean {
        return this.isNonGeneratedField() && this.annotations.settable?.onCreate !== false;
    }

    isNonGeneratedField(): boolean {
        return (
            this.isCypher() === false &&
            this.isCustomResolvable() === false &&
            (this.isEnum() || this.isScalar() || this.isSpatial()) &&
            !this.annotations.id &&
            !this.annotations.populatedBy &&
            !this.annotations.timestamp
        );
    }

    isUpdateInputField(): boolean {
        return this.isNonGeneratedField() && this.annotations.settable?.onUpdate !== false;
    }

    isArrayMethodField(): boolean {
        return this.isList() && !this.isUserScalar() && (this.isScalar() || this.isSpatial());
    }

    get listModel(): ListAdapter | undefined {
        if (!this._listModel) {
            if (!this.isArrayMethodField()) {
                return;
            }
            this._listModel = new ListAdapter(this);
        }
        return this._listModel;
    }

    get mathModel(): MathAdapter | undefined {
        if (!this._mathModel) {
            if (!this.isNumeric() || this.isList()) {
                return;
            }
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
            if (!this.isList()) {
                return this.type;
            }
            if (this.type.ofType instanceof ListType) {
                return this.type.ofType.ofType;
            }
            return this.type.ofType;
            // return this.isList() ? this.type.ofType : this.type;
        }
        return this.type;
    }

    isBoolean(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.Boolean;
    }

    isID(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.ID;
    }

    isInt(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.Int;
    }

    isFloat(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.Float;
    }

    isString(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === GraphQLBuiltInScalarType.String;
    }

    isCartesianPoint(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof Neo4jCartesianPointType;
    }

    isPoint(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof Neo4jPointType;
    }

    isBigInt(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLNumberType.BigInt;
    }

    isDate(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.Date;
    }

    isDateTime(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.DateTime;
    }

    isLocalDateTime(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.LocalDateTime;
    }

    isTime(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ScalarType && type.name === Neo4jGraphQLTemporalType.Time;
    }

    isLocalTime(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return (type.name as Neo4jGraphQLTemporalType) === Neo4jGraphQLTemporalType.LocalTime;
    }

    isDuration(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return (type.name as Neo4jGraphQLTemporalType) === Neo4jGraphQLTemporalType.Duration;
    }

    isObject(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof ObjectType;
    }

    isEnum(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof EnumType;
    }

    isInterface(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof InterfaceType;
    }

    isUnion(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof UnionType;
    }

    isList(): this is this & { type: ListType } {
        return this.type instanceof ListType;
    }

    isInput(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof InputType;
    }

    isUserScalar(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type instanceof UserScalarType;
    }

    isTemporal(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type.name in Neo4jGraphQLTemporalType;
    }

    isListElementRequired(): boolean {
        if (!(this.type instanceof ListType)) {
            return false;
        }
        return this.type.ofType.isRequired;
    }

    isRequired(): boolean {
        return this.type.isRequired;
    }

    /**
     *
     * Schema Generator Stuff
     *
     */
    isGraphQLBuiltInScalar(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type.name in GraphQLBuiltInScalarType;
    }

    isSpatial(options = this.assertionOptions): boolean {
        const type = this.getTypeForAssertion(options.includeLists);
        return type.name in Neo4jGraphQLSpatialType;
    }

    isAbstract(options = this.assertionOptions): boolean {
        return this.isInterface(options) || this.isUnion(options);
    }
    /**
     * Returns true for both built-in and user-defined scalars
     **/
    isScalar(options = this.assertionOptions): boolean {
        return (
            this.isGraphQLBuiltInScalar(options) ||
            this.isTemporal(options) ||
            this.isBigInt(options) ||
            this.isUserScalar(options) ||
            this.isInput(options)
        );
    }

    isNumeric(options = this.assertionOptions): boolean {
        return this.isBigInt(options) || this.isFloat(options) || this.isInt(options);
    }

    /**
     *  END of category assertions
     */

    isGlobalIDAttribute(): boolean {
        return !!this.annotations.relayId;
    }

    /**
     *
     * Schema Generator Stuff
     *
     */

    getTypePrettyName(): string {
        if (!this.isList()) {
            return `${this.getTypeName()}${this.isRequired() ? "!" : ""}`;
        }
        if (this.type.ofType instanceof ListType) {
            // matrix case
            return `[[${this.getTypeName()}${this.isListElementRequired() ? "!" : ""}]]${this.isRequired() ? "!" : ""}`;
        }
        return `[${this.getTypeName()}${this.isListElementRequired() ? "!" : ""}]${this.isRequired() ? "!" : ""}`;
    }

    getTypeName(): string {
        if (!this.isList()) {
            return this.type.name;
        }
        if (this.type.ofType instanceof ListType) {
            // matrix case
            return this.type.ofType.ofType.name;
        }
        return this.type.ofType.name;
        // return this.isList() ? this.type.ofType.name : this.type.name;
    }

    getFieldTypeName(): string {
        if (!this.isList()) {
            return this.getTypeName();
        }
        if (this.type.ofType instanceof ListType) {
            // matrix case
            return `[[${this.getTypeName()}]]`;
        }
        return `[${this.getTypeName()}]`;
    }

    getInputTypeName(): string {
        if (this.isSpatial()) {
            if (this.getTypeName() === "Point") {
                return "PointInput";
            } else {
                return "CartesianPointInput";
            }
        }
        return this.getTypeName();
    }

    // TODO: We should probably have this live in a different, more specific adapter
    getFilterableInputTypeName(): string {
        return `[${this.getInputTypeName()}${this.isRequired() ? "!" : ""}]`;
    }

    getInputTypeNames(): InputTypeNames {
        const pretty = this.isList()
            ? `[${this.getInputTypeName()}${this.isListElementRequired() ? "!" : ""}]`
            : this.getInputTypeName();

        return {
            where: { type: this.getInputTypeName(), pretty },
            create: {
                type: this.getTypeName(),
                pretty: `${pretty}${this.isRequired() ? "!" : ""}`,
            },
            update: {
                type: this.getTypeName(),
                pretty,
            },
        };
    }

    getDefaultValue() {
        return this.annotations.default?.value;
    }

    isReadable(): boolean {
        return this.annotations.selectable?.onRead !== false;
    }

    isAggregable(): boolean {
        return (
            this.annotations.selectable?.onAggregate !== false &&
            this.isCustomResolvable() === false &&
            this.isCypher() === false
        );
    }
    isAggregationFilterable(): boolean {
        return (
            this.annotations.filterable?.byAggregate !== false &&
            this.isCustomResolvable() === false &&
            this.isCypher() === false
        );
    }

    isFilterable(): boolean {
        return this.annotations.filterable?.byValue !== false;
    }

    isCustomResolvable(): boolean {
        return !!this.annotations.customResolver;
    }

    isPartOfUpdateInputType(): boolean {
        if (this.isScalar() || this.isEnum() || this.isSpatial()) {
            return true;
        }
        if (this.isGraphQLBuiltInScalar()) {
            const isAutogenerated = !!this.annotations.id;
            const isCallback = !!this.annotations.populatedBy;
            return !isAutogenerated && !isCallback; // && !readonly
        }
        if (this.isTemporal()) {
            return !this.annotations.timestamp;
        }
        return false;
    }

    isPartOfCreateInputType(): boolean {
        if (this.isScalar() || this.isEnum() || this.isSpatial() || this.isTemporal()) {
            return true;
        }
        if (this.isGraphQLBuiltInScalar()) {
            const isAutogenerated = !!this.annotations.id;
            const isCallback = !!this.annotations.populatedBy;
            return !isAutogenerated && !isCallback;
        }
        return false;
    }

    isPartOfWhereInputType(): boolean {
        return (
            this.isScalar() || this.isEnum() || this.isTemporal() || this.isSpatial() || this.isGraphQLBuiltInScalar()
        );
    }
}

type InputTypeNames = Record<"where" | "create" | "update", { type: string; pretty: string }>;
