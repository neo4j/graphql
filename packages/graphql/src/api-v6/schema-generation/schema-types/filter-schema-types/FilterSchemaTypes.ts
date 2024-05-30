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
import type { InputTypeComposer } from "graphql-compose";
import type { Attribute } from "../../../../schema-model/attribute/Attribute";
import {
    GraphQLBuiltInScalarType,
    ListType,
    Neo4jGraphQLTemporalType,
    ScalarType,
} from "../../../../schema-model/attribute/AttributeType";
import { filterTruthy } from "../../../../utils/utils";
import type { RelatedEntityTypeNames } from "../../../schema-model/graphql-type-names/RelatedEntityTypeNames";
import type { TopLevelEntityTypeNames } from "../../../schema-model/graphql-type-names/TopLevelEntityTypeNames";
import type { SchemaBuilder } from "../../SchemaBuilder";
import type { SchemaTypes } from "../SchemaTypes";

export abstract class FilterSchemaTypes<T extends TopLevelEntityTypeNames | RelatedEntityTypeNames> {
    protected entityTypeNames: T;
    protected schemaTypes: SchemaTypes;
    protected schemaBuilder: SchemaBuilder;

    constructor({
        entityTypeNames,
        schemaBuilder,
        schemaTypes,
    }: {
        entityTypeNames: T;
        schemaBuilder: SchemaBuilder;
        schemaTypes: SchemaTypes;
    }) {
        this.entityTypeNames = entityTypeNames;
        this.schemaBuilder = schemaBuilder;
        this.schemaTypes = schemaTypes;
    }

    public get operationWhere(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(
            this.entityTypeNames.operationWhere,
            (itc: InputTypeComposer) => {
                return {
                    fields: {
                        AND: itc.NonNull.List,
                        OR: itc.NonNull.List,
                        NOT: itc,
                        edges: this.edgeWhere,
                    },
                };
            }
        );
    }

    protected createPropertyFilters(attributes: Attribute[]): Record<string, InputTypeComposer> {
        const fields: Array<[string, InputTypeComposer | GraphQLScalarType] | []> = filterTruthy(
            attributes.map((attribute) => {
                const propertyFilter = this.attributeToPropertyFilter(attribute);
                if (propertyFilter) {
                    return [attribute.name, propertyFilter];
                }
            })
        );
        return Object.fromEntries(fields);
    }

    private attributeToPropertyFilter(attribute: Attribute): GraphQLScalarType | InputTypeComposer | undefined {
        const isList = attribute.type instanceof ListType;
        const wrappedType = isList ? attribute.type.ofType : attribute.type;
        if (wrappedType instanceof ScalarType) {
            return this.createScalarType(wrappedType, isList);
        }
    }

    private createScalarType(type: ScalarType, isList: boolean): GraphQLScalarType | InputTypeComposer | undefined {
        switch (type.name) {
            case GraphQLBuiltInScalarType.Boolean: {
                if (isList) {
                    const isNullable = !type.isRequired;
                    return this.schemaTypes.staticTypes.filters.getBooleanListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.booleanWhere;
            }

            case GraphQLBuiltInScalarType.String: {
                if (isList) {
                    const isNullable = !type.isRequired;
                    return this.schemaTypes.staticTypes.filters.getStringListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.stringWhere;
            }

            case GraphQLBuiltInScalarType.ID: {
                if (isList) {
                    const isNullable = !type.isRequired;
                    return this.schemaTypes.staticTypes.filters.getIdListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.idWhere;
            }

            case GraphQLBuiltInScalarType.Int: {
                if (isList) {
                    const isNullable = !type.isRequired;

                    return this.schemaTypes.staticTypes.filters.getIntListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.intWhere;
            }

            case GraphQLBuiltInScalarType.Float: {
                if (isList) {
                    const isNullable = !type.isRequired;

                    return this.schemaTypes.staticTypes.filters.getFloatListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.floatWhere;
            }

            case Neo4jGraphQLTemporalType.Date: {
                return this.schemaTypes.staticTypes.filters.dateWhere;
            }

            case Neo4jGraphQLTemporalType.DateTime: {
                return this.schemaTypes.staticTypes.filters.dateTimeWhere;
            }

            case Neo4jGraphQLTemporalType.LocalDateTime: {
                return this.schemaTypes.staticTypes.filters.localDateTimeWhere;
            }

            case Neo4jGraphQLTemporalType.Duration: {
                return this.schemaTypes.staticTypes.filters.durationWhere;
            }

            case Neo4jGraphQLTemporalType.Time: {
                return this.schemaTypes.staticTypes.filters.timeWhere;
            }

            case Neo4jGraphQLTemporalType.LocalTime: {
                return this.schemaTypes.staticTypes.filters.localTimeWhere;
            }

            default: {
                return;
            }
        }
    }

    protected abstract get edgeWhere(): InputTypeComposer;
    protected abstract get nodeWhere(): InputTypeComposer;
}