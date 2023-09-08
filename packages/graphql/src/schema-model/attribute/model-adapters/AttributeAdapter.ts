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
import type { FullTextField } from "../../annotation/FullTextAnnotation";
import type { Argument } from "../../argument/Argument";
import type { Attribute } from "../Attribute";
import type { AttributeType } from "../AttributeType";
import {
    EnumType,
    GraphQLBuiltInScalarType,
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
    public readonly description: string;
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
                this.isInterface() ||
                this.isUnion() ||
                this.isSpatial() ||
                this.isScalar() ||
                this.isObject()) &&
            !this.isCypher()
        );
    }

    isUnique(): boolean {
        return !!this.annotations.unique || this.isGlobalIDAttribute() === true;
    }

    isCypher(): boolean {
        return !!this.annotations.cypher;
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
        return (
            this.isGraphQLBuiltInScalar() ||
            this.isUserScalar() ||
            this.isEnum() ||
            this.isTemporal() ||
            this.isPoint() ||
            this.isCartesianPoint()
        );
    }

    /**
    * Previously defined as:
    * const nodeFields = objectFieldsToComposeFields([
        ...node.primitiveFields,
        ...node.cypherFields,
        ...node.enumFields,
        ...node.scalarFields,
        ...node.interfaceFields,
        ...node.objectFields,
        ...node.unionFields,
        ...node.temporalFields,
        ...node.pointFields,
        ...node.customResolverFields,
    ]);
    */
    isObjectField(): boolean {
        return (
            this.isGraphQLBuiltInScalar() ||
            this.isCypher() ||
            this.isEnum() ||
            this.isUserScalar() ||
            this.isInterface() ||
            this.isObject() ||
            this.isUnion() ||
            this.isTemporal() ||
            this.isPoint() ||
            this.isCartesianPoint() ||
            this.isBigInt()
            // this.isCustomResolver()
        );
    }

    /*
    return [
        ...obj.primitiveFields,
        ...obj.scalarFields,
        ...obj.enumFields,
        ...obj.temporalFields,
        ...obj.pointFields,
        ...obj.cypherFields.filter((field) =>
            [
                "Boolean",
                "ID",
                "Int",
                "BigInt",
                "Float",
                "String",
                "DateTime",
                "LocalDateTime",
                "Time",
                "LocalTime",
                "Date",
                "Duration",
            ].includes(field.typeMeta.name)
        ),
    ].filter((field) => !field.typeMeta.array);
    */
    isSortableField(): boolean {
        return (
            !this.isList() &&
            !this.isCustomResolvable() &&
            (this.isGraphQLBuiltInScalar() ||
                this.isUserScalar() ||
                this.isEnum() ||
                this.isTemporal() ||
                this.isPoint() ||
                this.isCartesianPoint() ||
                this.isBigInt() ||
                this.isCypher())
        );
    }

    /**
    * 
        fields: {
            temporalFields: node.temporalFields,
            enumFields: node.enumFields,
            pointFields: node.pointFields,
            primitiveFields: node.primitiveFields,
            scalarFields: node.scalarFields,
        },
    */
    isWhereField(): boolean {
        return (
            this.isGraphQLBuiltInScalar() ||
            this.isTemporal() ||
            this.isEnum() ||
            this.isPoint() ||
            this.isCartesianPoint() ||
            this.isUserScalar() ||
            this.isBigInt()
        );
    }

    /**
     * [
     * ...node.primitiveFields,
        ...node.scalarFields,
        ...node.enumFields,
        ...node.pointFields,
        ...node.temporalFields
     ]
     */
    isOnCreateField(): boolean {
        return (
            this.isGraphQLBuiltInScalar() ||
            this.isTemporal() ||
            this.isEnum() ||
            this.isPoint() ||
            this.isCartesianPoint() ||
            this.isUserScalar() ||
            this.isBigInt()
        );
    }

    /**
     * 
        if (
            [
                "Float",
                "Int",
                "BigInt",
                "DateTime",
                "Date",
                "LocalDateTime",
                "Time",
                "LocalTime",
                "Duration",
            ].includes(f.typeMeta.name)
        ),
    */
    isNumericalOrTemporal(): boolean {
        return (
            this.isFloat() ||
            this.isInt() ||
            this.isBigInt() ||
            this.isDateTime() ||
            this.isDate() ||
            this.isLocalDateTime() ||
            this.isTime() ||
            this.isLocalTime() ||
            this.isDuration()
        );
    }

    isTemporalField(): boolean {
        // TODO: why is .isTemporal() not enough??
        return (
            this.isTemporal() ||
            this.isDateTime() ||
            this.isDate() ||
            this.isLocalDateTime() ||
            this.isTime() ||
            this.isLocalTime() ||
            this.isDuration()
        );
    }

    isPrimitiveField(): boolean {
        return this.isGraphQLBuiltInScalar() || this.isUserScalar() || this.isEnum() || this.isBigInt();
    }

    isAggregableField(): boolean {
        return !this.isList() && (this.isPrimitiveField() || this.isTemporalField()) && this.isAggregable();
    }

    isAggregationWhereField(): boolean {
        const isGraphQLBuiltInScalarWithoutBoolean = this.isGraphQLBuiltInScalar() && !this.isBoolean();
        const isTemporalWithoutDate = this.isTemporalField() && !this.isDate();
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
            (this.isPrimitiveField() || this.isScalar() || this.isSpatial()) &&
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
            this.isUserScalar(options)
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
        if (this.isList()) {
            return `[${this.getTypeName()}${this.isListElementRequired() ? "!" : ""}]${this.isRequired() ? "!" : ""}`;
        }
        return `${this.getTypeName()}${this.isRequired() ? "!" : ""}`;
    }

    getTypeName(): string {
        return this.isList() ? this.type.ofType.name : this.type.name;
    }

    getFieldTypeName(): string {
        return this.isList() ? `[${this.getTypeName()}]` : this.getTypeName();
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

    // TODO: Check if this is the right place for this
    isFulltext(): boolean {
        return !!this.annotations.fulltext;
    }

    // TODO: Check if this is the right place for this
    getFulltextIndexes(): FullTextField[] | undefined {
        return this.annotations.fulltext?.indexes;
    }

    getPropagatedAnnotations(): Partial<Annotations> {
        // TODO: use constants
        return Object.fromEntries(
            Object.entries(this.annotations).filter(
                ([name]) =>
                    ![
                        "relationship",
                        "cypher",
                        "id",
                        "authorization",
                        "authentication",
                        "readonly",
                        "writeonly",
                        "customResolver",
                        "default",
                        "coalesce",
                        "timestamp",
                        "alias",
                        "unique",
                        "callback",
                        "populatedBy",
                        "jwtClaim",
                        "selectable",
                        "settable",
                        "subscriptionsAuthorization",
                        "filterable",
                    ].includes(name)
            )
        );
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
