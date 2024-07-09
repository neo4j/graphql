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
    Neo4jGraphQLNumberType,
    Neo4jGraphQLTemporalType,
    ScalarType,
} from "../../../../schema-model/attribute/AttributeType";
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
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

    // TODO: Perhaps we can reduce the duplication in the following methods. The only
    // difference is node: this.nodeWhere vs edges: this.edgeWhere
    public get operationWhereTopLevel(): InputTypeComposer {
        return this.schemaBuilder.getOrCreateInputType(
            this.entityTypeNames.operationWhere,
            (itc: InputTypeComposer) => {
                return {
                    fields: {
                        AND: itc.NonNull.List,
                        OR: itc.NonNull.List,
                        NOT: itc,
                        node: this.nodeWhere,
                    },
                };
            }
        );
    }

    public get operationWhereNested(): InputTypeComposer {
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

    protected createGlobalIdFilters(entity: ConcreteEntity): Record<string, InputTypeComposer> {
        const globalIdField = entity.globalIdField;
        if (globalIdField) {
            return {
                id: this.schemaTypes.staticTypes.filters.globalIdWhere,
            };
        }
        return {};
    }

    private attributeToPropertyFilter(attribute: Attribute): InputTypeComposer | undefined {
        const isList = attribute.type instanceof ListType;
        const wrappedType = isList ? attribute.type.ofType : attribute.type;
        if (wrappedType instanceof ScalarType) {
            return this.createScalarType(wrappedType, isList);
        }
        // if (wrappedType instanceof Neo4jSpatialType) {
        //     return this.createSpatialType(wrappedType, isList);
        // }
    }

    private createScalarType(type: ScalarType, isList: boolean): InputTypeComposer {
        switch (type.name) {
            case GraphQLBuiltInScalarType.Boolean: {
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

            case Neo4jGraphQLNumberType.BigInt: {
                if (isList) {
                    const isNullable = !type.isRequired;

                    return this.schemaTypes.staticTypes.filters.getBigIntListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.bigIntWhere;
            }

            case Neo4jGraphQLTemporalType.Date: {
                if (isList) {
                    const isNullable = !type.isRequired;
                    return this.schemaTypes.staticTypes.filters.getDateListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.dateWhere;
            }

            case Neo4jGraphQLTemporalType.DateTime: {
                if (isList) {
                    const isNullable = !type.isRequired;
                    return this.schemaTypes.staticTypes.filters.getDateTimeListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.dateTimeWhere;
            }

            case Neo4jGraphQLTemporalType.LocalDateTime: {
                if (isList) {
                    const isNullable = !type.isRequired;
                    return this.schemaTypes.staticTypes.filters.getLocalDateTimeListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.localDateTimeWhere;
            }

            case Neo4jGraphQLTemporalType.Duration: {
                if (isList) {
                    const isNullable = !type.isRequired;
                    return this.schemaTypes.staticTypes.filters.getDurationListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.durationWhere;
            }

            case Neo4jGraphQLTemporalType.Time: {
                if (isList) {
                    const isNullable = !type.isRequired;
                    return this.schemaTypes.staticTypes.filters.getTimeListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.timeWhere;
            }

            case Neo4jGraphQLTemporalType.LocalTime: {
                if (isList) {
                    const isNullable = !type.isRequired;
                    return this.schemaTypes.staticTypes.filters.getLocalTimeListWhere(isNullable);
                }
                return this.schemaTypes.staticTypes.filters.localTimeWhere;
            }
        }
    }

    // private createSpatialType(type: Neo4jSpatialType, isList: boolean): InputTypeComposer {
    //     switch (type.name) {
    //         case Neo4jGraphQLSpatialType.CartesianPoint: {
    //             if (isList) {
    //                 const isNullable = !type.isRequired;
    //                 return this.schemaTypes.staticTypes.filters.getCartesianListWhere(isNullable);
    //             }
    //             return this.schemaTypes.staticTypes.filters.cartesianPointWhere;
    //         }
    //         case Neo4jGraphQLSpatialType.Point: {
    //             if (isList) {
    //                 const isNullable = !type.isRequired;
    //                 return this.schemaTypes.staticTypes.filters.getPointListWhere(isNullable);
    //             }
    //             return this.schemaTypes.staticTypes.filters.pointWhere;
    //         }
    //     }
    // }

    protected abstract get edgeWhere(): InputTypeComposer;
    protected abstract get nodeWhere(): InputTypeComposer;
}
