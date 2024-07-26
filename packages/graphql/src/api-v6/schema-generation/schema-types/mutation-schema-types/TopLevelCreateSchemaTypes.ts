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

import type { GraphQLScalarType } from "graphql";
import type { InputTypeComposer, ScalarTypeComposer } from "graphql-compose";
import type { Attribute } from "../../../../schema-model/attribute/Attribute";
import { GraphQLBuiltInScalarType, ScalarType } from "../../../../schema-model/attribute/AttributeType";
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import { filterTruthy } from "../../../../utils/utils";
import type { TopLevelEntityTypeNames } from "../../../schema-model/graphql-type-names/TopLevelEntityTypeNames";
import type { SchemaBuilder } from "../../SchemaBuilder";
import type { SchemaTypes } from "../SchemaTypes";

export class TopLevelCreateSchemaTypes {
    private entityTypeNames: TopLevelEntityTypeNames;
    private schemaTypes: SchemaTypes;
    private schemaBuilder: SchemaBuilder;
    private entity: ConcreteEntity;

    constructor({
        entity,
        schemaBuilder,
        schemaTypes,
    }: {
        entity: ConcreteEntity;
        schemaBuilder: SchemaBuilder;
        schemaTypes: SchemaTypes;
    }) {
        this.entity = entity;
        this.entityTypeNames = entity.typeNames;
        this.schemaBuilder = schemaBuilder;
        this.schemaTypes = schemaTypes;
    }
    
    public get createInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.createInput, (_itc: InputTypeComposer) => {
            return {
                fields: {
                    node: this.createNode,
                },
            };
        });
    }

    public get createNode(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.createNode, (_itc: InputTypeComposer) => {
            return {
                fields: {
                    ...this.getInputFields([...this.entity.attributes.values()]),
                    _emptyInput: this.schemaBuilder.types.boolean,
                },
            };
        });
    }

    private getInputFields(attributes: Attribute[]): Record<string, InputTypeComposer> {
        const inputFields: Array<[string, InputTypeComposer | GraphQLScalarType] | []> = filterTruthy(
            attributes.map((attribute) => {
                const inputField = this.attributeToInputField(attribute);
                if (inputField) {
                    return [attribute.name, inputField];
                }
            })
        );
        return Object.fromEntries(inputFields);
    }

    private attributeToInputField(attribute: Attribute): any {
        if (attribute.type instanceof ScalarType) {
            return this.createBuiltInFieldInput(attribute.type);
        }
        /*  const isList = attribute.type instanceof ListType;
        const wrappedType = isList ? attribute.type.ofType : attribute.type;
        if (wrappedType instanceof ScalarType) {
            return this.createScalarType(wrappedType, isList);
        } */
    }

    private createBuiltInFieldInput(type: ScalarType): ScalarTypeComposer | undefined {
        // TODO: add required sign and other types.
        switch (type.name) {
            case GraphQLBuiltInScalarType.Boolean: {
                return this.schemaBuilder.types.boolean;
            }
            case GraphQLBuiltInScalarType.String: {
                return this.schemaBuilder.types.string;
            }
            case GraphQLBuiltInScalarType.ID: {
                return this.schemaBuilder.types.id;
            }
            case GraphQLBuiltInScalarType.Int: {
                return this.schemaBuilder.types.int;
            }
            case GraphQLBuiltInScalarType.Float: {
                return this.schemaBuilder.types.float;
            }
        }
    }
}
