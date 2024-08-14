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
import type { InputTypeComposer, NonNullComposer, ScalarTypeComposer } from "graphql-compose";
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
import type { SchemaBuilder } from "../../SchemaBuilder";
import type { SchemaTypes } from "../SchemaTypes";

export class TopLevelUpdateSchemaTypes {
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

    public get updateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.updateInput, (_itc: InputTypeComposer) => {
            return {
                fields: {
                    node: this.updateNode.NonNull,
                },
            };
        });
    }

    public get updateNode(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(this.entityTypeNames.updateNode, (_itc: InputTypeComposer) => {
            const inputFields = this.getInputFields([...this.entity.attributes.values()]);
            const isEmpty = Object.keys(inputFields).length === 0;
            const fields = isEmpty ? { _emptyInput: this.schemaBuilder.types.boolean } : inputFields;
            return {
                fields,
            };
        });
    }

    private getInputFields(attributes: Attribute[]): Record<string, InputTypeComposer> {
        const inputFields: Array<[string, InputTypeComposer | GraphQLScalarType] | []> = filterTruthy(
            attributes.map((attribute) => {
                const inputField = this.attributeToInputField(attribute.type);
                if (inputField) {
                    return [attribute.name, inputField];
                }
            })
        );
        return Object.fromEntries(inputFields);
    }

    private attributeToInputField(type: AttributeType): any {
        const updateType: AttributeType = type instanceof ListType ? type.ofType : type;

        if (updateType instanceof ScalarType) {
            return this.createBuiltInFieldInput(updateType);
        }
        if (updateType instanceof Neo4jTemporalType) {
            return this.createTemporalFieldInput(updateType);
        }
        if (updateType instanceof Neo4jSpatialType) {
            return this.createSpatialFieldInput(updateType);
        }
    }

    private createBuiltInFieldInput(
        type: ScalarType
    ): InputTypeComposer | ScalarTypeComposer | NonNullComposer<ScalarTypeComposer> {
        let builtInType: ScalarTypeComposer | InputTypeComposer;
        switch (type.name) {
            case GraphQLBuiltInScalarType.Boolean: {
                builtInType = this.booleanUpdateInput;
                break;
            }
            case GraphQLBuiltInScalarType.String: {
                builtInType = this.stringUpdateInput;
                break;
            }
            case GraphQLBuiltInScalarType.ID: {
                builtInType = this.idUpdateInput;
                break;
            }
            case GraphQLBuiltInScalarType.Int: {
                builtInType = this.intUpdateInput;
                break;
            }
            case GraphQLBuiltInScalarType.Float: {
                builtInType = this.floatUpdateInput;
                break;
            }
            case Neo4jGraphQLNumberType.BigInt: {
                builtInType = this.bigIntUpdateInput;
                break;
            }
            default: {
                throw new Error(`Unsupported type: ${type.name}`);
            }
        }

        return builtInType;
    }

    private createTemporalFieldInput(type: Neo4jTemporalType): InputTypeComposer {
        let builtInType: InputTypeComposer;
        switch (type.name) {
            case Neo4jGraphQLTemporalType.Date: {
                builtInType = this.dateUpdateInput;
                break;
            }
            case Neo4jGraphQLTemporalType.DateTime: {
                builtInType = this.dateTimeUpdateInput;
                break;
            }
            case Neo4jGraphQLTemporalType.LocalDateTime: {
                builtInType = this.localDateTimeUpdateInput;
                break;
            }
            case Neo4jGraphQLTemporalType.Time: {
                builtInType = this.timeUpdateInput;
                break;
            }
            case Neo4jGraphQLTemporalType.LocalTime: {
                builtInType = this.localTimeUpdateInput;
                break;
            }
            case Neo4jGraphQLTemporalType.Duration: {
                builtInType = this.durationUpdateInput;
                break;
            }
            default: {
                throw new Error(`Unsupported type: ${type.name}`);
            }
        }
        return builtInType;
    }

    private createSpatialFieldInput(type: Neo4jSpatialType): InputTypeComposer {
        let builtInType: InputTypeComposer;
        switch (type.name) {
            case Neo4jGraphQLSpatialType.CartesianPoint: {
                builtInType = this.cartesianPointUpdateInput;
                break;
            }
            case Neo4jGraphQLSpatialType.Point: {
                builtInType = this.pointUpdateInput;
                break;
            }
            default: {
                throw new Error(`Unsupported type: ${type.name}`);
            }
        }
        return builtInType;
    }

    private get intUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("IntUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.int,
                },
            };
        });
    }

    private get booleanUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("IntUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.boolean,
                },
            };
        });
    }
    private get stringUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("StringUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.string,
                },
            };
        });
    }
    private get idUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("IDUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.id,
                },
            };
        });
    }
    private get floatUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("FloatUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.float,
                },
            };
        });
    }
    private get bigIntUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("BigIntUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.bigInt,
                },
            };
        });
    }

    private get dateUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("DateUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.date,
                },
            };
        });
    }
    private get dateTimeUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("DateTimeUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.dateTime,
                },
            };
        });
    }
    private get localDateTimeUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("LocalDateTimeUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.localDateTime,
                },
            };
        });
    }
    private get timeUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("TimeUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.time,
                },
            };
        });
    }
    private get localTimeUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("LocalTimeUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.localTime,
                },
            };
        });
    }
    private get durationUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("DurationUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.duration,
                },
            };
        });
    }
    private get cartesianPointUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("CartesianPointInputUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.cartesianPointInput,
                },
            };
        });
    }
    private get pointUpdateInput(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType("PointInputUpdate", () => {
            return {
                fields: {
                    set: this.schemaBuilder.types.pointInput,
                },
            };
        });
    }
}
