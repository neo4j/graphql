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
import { ListType } from "../AttributeType";
import { AttributeTypeHelper } from "../AttributeTypeHelper";
import { AggregationAdapter } from "./AggregationAdapter";
import { ListAdapter } from "./ListAdapter";
import { MathAdapter } from "./MathAdapter";

export class AttributeAdapter {
    private _listModel: ListAdapter | undefined;
    private _mathModel: MathAdapter | undefined;
    private _aggregationModel: AggregationAdapter | undefined;

    public typeHelper: AttributeTypeHelper;
    public readonly name: string;
    public readonly annotations: Partial<Annotations>;
    public readonly type: AttributeType;
    public readonly args: Argument[];
    public readonly databaseName: string;
    public readonly description?: string;

    constructor(attribute: Attribute) {
        this.name = attribute.name;
        this.type = attribute.type;
        this.args = attribute.args;
        this.annotations = attribute.annotations;
        this.databaseName = attribute.databaseName;
        this.description = attribute.description;
        this.typeHelper = new AttributeTypeHelper(attribute.type);
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
            if (!this.typeHelper.isNumeric() || this.typeHelper.isList()) {
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
     * Categories Filters
     * each Attribute has the knowledge of whether it is part of a category
     *
     */

    isMutable(): boolean {
        return (
            (this.typeHelper.isEnum() ||
                this.typeHelper.isAbstract() ||
                this.typeHelper.isSpatial() ||
                this.typeHelper.isScalar() ||
                this.typeHelper.isObject()) &&
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
            this.typeHelper.isGraphQLBuiltInScalar() ||
            this.typeHelper.isUserScalar() ||
            this.typeHelper.isEnum() ||
            this.typeHelper.isTemporal() ||
            this.typeHelper.isSpatial() ||
            this.typeHelper.isBigInt()
        );
    }

    isObjectField(): boolean {
        return (
            this.typeHelper.isScalar() ||
            this.typeHelper.isEnum() ||
            this.typeHelper.isAbstract() ||
            this.typeHelper.isObject() ||
            this.typeHelper.isSpatial()
        );
    }

    isSortableField(): boolean {
        return (
            !this.typeHelper.isList() &&
            !this.isCustomResolvable() &&
            (this.typeHelper.isScalar() || this.typeHelper.isEnum() || this.typeHelper.isSpatial() || this.isCypher())
        );
    }

    isWhereField(): boolean {
        return (
            (this.typeHelper.isEnum() || this.typeHelper.isSpatial() || this.typeHelper.isScalar()) &&
            this.isFilterable() &&
            !this.isCustomResolvable() &&
            !this.isCypher()
        );
    }

    isEventPayloadField(): boolean {
        return (
            (this.typeHelper.isEnum() || this.typeHelper.isSpatial() || this.typeHelper.isScalar()) &&
            !this.isCustomResolvable()
        );
    }

    isSubscriptionConnectedRelationshipField(): boolean {
        return (
            (this.typeHelper.isEnum() || this.typeHelper.isSpatial() || this.typeHelper.isScalar()) && !this.isCypher()
        );
    }

    isOnCreateField(): boolean {
        if (!this.isNonGeneratedField()) {
            return false;
        }

        if (this.annotations.settable?.onCreate === false) {
            return false;
        }

        if (this.timestampCreateIsGenerated() || this.populatedByCreateIsGenerated()) {
            return false;
        }

        return (
            this.typeHelper.isScalar() ||
            this.typeHelper.isSpatial() ||
            this.typeHelper.isEnum() ||
            this.typeHelper.isAbstract()
        );
    }

    isNumericalOrTemporal(): boolean {
        return (
            this.typeHelper.isFloat() ||
            this.typeHelper.isInt() ||
            this.typeHelper.isBigInt() ||
            this.typeHelper.isTemporal()
        );
    }

    isAggregableField(): boolean {
        return (
            !this.typeHelper.isList() && (this.typeHelper.isScalar() || this.typeHelper.isEnum()) && this.isAggregable()
        );
    }

    isAggregationWhereField(): boolean {
        const isGraphQLBuiltInScalarWithoutBoolean =
            this.typeHelper.isGraphQLBuiltInScalar() && !this.typeHelper.isBoolean();
        const isTemporalWithoutDate = this.typeHelper.isTemporal() && !this.typeHelper.isDate();
        return (
            !this.typeHelper.isList() &&
            (isGraphQLBuiltInScalarWithoutBoolean || isTemporalWithoutDate || this.typeHelper.isBigInt()) &&
            this.isAggregationFilterable()
        );
    }

    isCreateInputField(): boolean {
        return (
            this.isNonGeneratedField() &&
            this.annotations.settable?.onCreate !== false &&
            !this.timestampCreateIsGenerated() &&
            !this.populatedByCreateIsGenerated()
        );
    }

    isUpdateInputField(): boolean {
        return (
            this.isNonGeneratedField() &&
            this.annotations.settable?.onUpdate !== false &&
            !this.timestampUpdateIsGenerated() &&
            !this.populatedByUpdateIsGenerated()
        );
    }

    timestampCreateIsGenerated(): boolean {
        if (!this.annotations.timestamp) {
            // The timestamp directive is not set on the field
            return false;
        }

        if (this.annotations.timestamp.operations.includes("CREATE")) {
            // The timestamp directive is set to generate on create
            return true;
        }

        // The timestamp directive is not set to generate on create
        return false;
    }

    populatedByCreateIsGenerated(): boolean {
        if (!this.annotations.populatedBy) {
            // The populatedBy directive is not set on the field
            return false;
        }

        if (this.annotations.populatedBy.operations.includes("CREATE")) {
            // The populatedBy directive is set to generate on create
            return true;
        }

        // The populatedBy directive is not set to generate on create
        return false;
    }

    isNonGeneratedField(): boolean {
        if (this.isCypher() || this.isCustomResolvable()) {
            return false;
        }

        if (this.annotations.id) {
            return false;
        }

        if (this.typeHelper.isEnum() || this.typeHelper.isScalar() || this.typeHelper.isSpatial()) {
            return true;
        }

        return false;
    }

    timestampUpdateIsGenerated(): boolean {
        if (!this.annotations.timestamp) {
            // The timestamp directive is not set on the field
            return false;
        }

        if (this.annotations.timestamp.operations.includes("UPDATE")) {
            // The timestamp directive is set to generate on update
            return true;
        }

        // The timestamp directive is not set to generate on update
        return false;
    }

    populatedByUpdateIsGenerated(): boolean {
        if (!this.annotations.populatedBy) {
            // The populatedBy directive is not set on the field
            return false;
        }

        if (this.annotations.populatedBy.operations.includes("UPDATE")) {
            // The populatedBy directive is set to generate on update
            return true;
        }

        // The populatedBy directive is not set to generate on update
        return false;
    }

    isArrayMethodField(): boolean {
        return (
            this.typeHelper.isList() &&
            !this.typeHelper.isUserScalar() &&
            (this.typeHelper.isScalar() || this.typeHelper.isSpatial())
        );
    }

    /**
     * Category Helpers
     *
     */
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

    isGlobalIDAttribute(): boolean {
        return !!this.annotations.relayId;
    }

    /**
     * Type names
     * used to create different types for the Attribute or Entity that contains the Attributes
     */

    getTypePrettyName(): string {
        if (!this.typeHelper.isList()) {
            return `${this.getTypeName()}${this.typeHelper.isRequired() ? "!" : ""}`;
        }
        const listType = this.type as ListType;
        if (listType.ofType instanceof ListType) {
            // matrix case
            return `[[${this.getTypeName()}${this.typeHelper.isListElementRequired() ? "!" : ""}]]${
                this.typeHelper.isRequired() ? "!" : ""
            }`;
        }
        return `[${this.getTypeName()}${this.typeHelper.isListElementRequired() ? "!" : ""}]${
            this.typeHelper.isRequired() ? "!" : ""
        }`;
    }

    getTypeName(): string {
        if (!this.typeHelper.isList()) {
            return this.type.name;
        }
        const listType = this.type as ListType;
        if (listType.ofType instanceof ListType) {
            // matrix case
            return listType.ofType.ofType.name;
        }
        return listType.ofType.name;
        // return this.isList() ? this.type.ofType.name : this.type.name;
    }

    getFieldTypeName(): string {
        if (!this.typeHelper.isList()) {
            return this.getTypeName();
        }
        const listType = this.type as ListType;
        if (listType.ofType instanceof ListType) {
            // matrix case
            return `[[${this.getTypeName()}]]`;
        }
        return `[${this.getTypeName()}]`;
    }

    getInputTypeName(): string {
        if (this.typeHelper.isSpatial()) {
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
        return `[${this.getInputTypeName()}${this.typeHelper.isRequired() ? "!" : ""}]`;
    }

    getInputTypeNames(): InputTypeNames {
        const pretty = this.typeHelper.isList()
            ? `[${this.getInputTypeName()}${this.typeHelper.isListElementRequired() ? "!" : ""}]`
            : this.getInputTypeName();

        return {
            where: { type: this.getInputTypeName(), pretty },
            create: {
                type: this.getTypeName(),
                pretty: `${pretty}${this.typeHelper.isRequired() ? "!" : ""}`,
            },
            update: {
                type: this.getTypeName(),
                pretty,
            },
        };
    }

    public getAggregateSelectionTypeName(): string {
        return `${this.getFieldTypeName()}AggregateSelection`;
    }
}

type InputTypeNames = Record<"where" | "create" | "update", { type: string; pretty: string }>;
