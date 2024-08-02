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

import type { InputTypeComposer, ScalarTypeComposer } from "graphql-compose";
import type { Attribute } from "../../../../schema-model/attribute/Attribute";
import type { AttributeType } from "../../../../schema-model/attribute/AttributeType";
import {
    GraphQLBuiltInScalarType,
    ListType,
    Neo4jGraphQLNumberType,
    Neo4jGraphQLSpatialType,
    Neo4jGraphQLTemporalType,
    Neo4jSpatialType,
    Neo4jTemporalType,
    ScalarType,
} from "../../../../schema-model/attribute/AttributeType";
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import { filterTruthy } from "../../../../utils/utils";
import type { TopLevelEntityTypeNames } from "../../../schema-model/graphql-type-names/TopLevelEntityTypeNames";
import type { InputFieldDefinition, SchemaBuilder, WrappedComposer } from "../../SchemaBuilder";

export class TopLevelCreateSchemaTypes {
    private entityTypeNames: TopLevelEntityTypeNames;
    private schemaBuilder: SchemaBuilder;
    private entity: ConcreteEntity;

    constructor({ entity, schemaBuilder }: { entity: ConcreteEntity; schemaBuilder: SchemaBuilder }) {
        this.entity = entity;
        this.entityTypeNames = entity.typeNames;
        this.schemaBuilder = schemaBuilder;
    }

    public get createInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.createInput, (_itc: InputTypeComposer) => {
            return {
                fields: {
                    node: this.createNode.NonNull,
                },
            };
        });
    }

    public get createNode(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.createNode, (_itc: InputTypeComposer) => {
            const inputFields = this.getInputFields([...this.entity.attributes.values()]);
            const isEmpty = Object.keys(inputFields).length === 0;
            const fields = isEmpty ? { _emptyInput: this.schemaBuilder.types.boolean } : inputFields;
            return {
                fields,
            };
        });
    }

    private getInputFields(attributes: Attribute[]): Record<string, InputFieldDefinition> {
        const inputFields: Array<[string, InputFieldDefinition] | []> = filterTruthy(
            attributes.map((attribute) => {
                const inputField = this.attributeToInputField(attribute.type, attribute);
                const fieldDefinition: InputFieldDefinition = {
                    type: inputField,
                    defaultValue: attribute.annotations.default?.value,
                };
                if (inputField) {
                    return [attribute.name, fieldDefinition];
                }
            })
        );
        return Object.fromEntries(inputFields);
    }

    private attributeToInputField(type: AttributeType, attribute: Attribute): any {
        if (type instanceof ListType) {
            if (type.isRequired) {
                return this.attributeToInputField(type.ofType, attribute).List.NonNull;
            }
            return this.attributeToInputField(type.ofType, attribute).List;
        }
        if (type instanceof ScalarType) {
            return this.createBuiltInFieldInput(type, attribute);
        }
        if (type instanceof Neo4jTemporalType) {
            return this.createTemporalFieldInput(type, attribute);
        }
        if (type instanceof Neo4jSpatialType) {
            return this.createSpatialFieldInput(type, attribute);
        }
    }

    private createBuiltInFieldInput(type: ScalarType, attribute: Attribute): WrappedComposer<ScalarTypeComposer> {
        let builtInType: ScalarTypeComposer;
        switch (type.name) {
            case GraphQLBuiltInScalarType.Boolean: {
                builtInType = this.schemaBuilder.types.boolean;
                break;
            }
            case GraphQLBuiltInScalarType.String: {
                builtInType = this.schemaBuilder.types.string;
                break;
            }
            case GraphQLBuiltInScalarType.ID: {
                builtInType = this.schemaBuilder.types.id;
                break;
            }
            case GraphQLBuiltInScalarType.Int: {
                builtInType = this.schemaBuilder.types.int;
                break;
            }
            case GraphQLBuiltInScalarType.Float: {
                builtInType = this.schemaBuilder.types.float;
                break;
            }
            case Neo4jGraphQLNumberType.BigInt: {
                builtInType = this.schemaBuilder.types.bigInt;
                break;
            }
            default: {
                throw new Error(`Unsupported type: ${type.name}`);
            }
        }
        if (type.isRequired) {
            return builtInType.NonNull;
        }
        return builtInType;
    }

    private createTemporalFieldInput(
        type: Neo4jTemporalType,
        attribute: Attribute
    ): WrappedComposer<ScalarTypeComposer> {
        let builtInType: ScalarTypeComposer;
        switch (type.name) {
            case Neo4jGraphQLTemporalType.Date: {
                builtInType = this.schemaBuilder.types.date;
                break;
            }
            case Neo4jGraphQLTemporalType.DateTime: {
                builtInType = this.schemaBuilder.types.dateTime;
                break;
            }
            case Neo4jGraphQLTemporalType.LocalDateTime: {
                builtInType = this.schemaBuilder.types.localDateTime;
                break;
            }
            case Neo4jGraphQLTemporalType.Time: {
                builtInType = this.schemaBuilder.types.time;
                break;
            }
            case Neo4jGraphQLTemporalType.LocalTime: {
                builtInType = this.schemaBuilder.types.localTime;
                break;
            }
            case Neo4jGraphQLTemporalType.Duration: {
                builtInType = this.schemaBuilder.types.duration;
                break;
            }
            default: {
                throw new Error(`Unsupported type: ${type.name}`);
            }
        }
        if (type.isRequired) {
            return builtInType.NonNull;
        }
        return builtInType;
    }

    private createSpatialFieldInput(type: Neo4jSpatialType, attribute: Attribute): WrappedComposer<InputTypeComposer> {
        let builtInType: InputTypeComposer;
        switch (type.name) {
            case Neo4jGraphQLSpatialType.CartesianPoint: {
                builtInType = this.schemaBuilder.types.cartesianPointInput;
                break;
            }
            case Neo4jGraphQLSpatialType.Point: {
                builtInType = this.schemaBuilder.types.pointInput;
                break;
            }
            default: {
                throw new Error(`Unsupported type: ${type.name}`);
            }
        }
        if (type.isRequired) {
            return builtInType.NonNull;
        }
        return builtInType;
    }
}
