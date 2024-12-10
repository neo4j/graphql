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

import type { GraphQLInputObjectType } from "graphql";
import { BigIntScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/BigIntScalarAggregationFilters";
import { DateTimeScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/DateTimeScalarAggregationFilters";
import { DurationScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/DurationScalarAggregationFilters";
import { FloatScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/FloatScalarAggregationFilters";
import { IDScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/IDScalarAggregationFilters";
import { IntScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/IntScalarAggregationFilters";
import { LocalDateTimeScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/LocalDateTimeScalarAggregationFilters";
import { LocalTimeScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/LocalTimeScalarAggregationFilters";
import { StringScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/StringScalarAggregationFilters";
import { TimeScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/TimeScalarAggregationFilters";
import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";

export function getAggregationFilterFromAttributeType(attribute: AttributeAdapter): GraphQLInputObjectType | string {
    // // NOTE: static types returned here must be added to schema-validation > validateUserDefinition
    // if (attribute.typeHelper.isBoolean()) {
    //     if (attribute.typeHelper.isList()) {
    //         return BooleanListFilters;
    //     }
    //     return BooleanScalarFilters;
    // }
    if (attribute.typeHelper.isID()) {
        //     if (attribute.typeHelper.isList()) {
        //         return IDListFilters;
        //     }
        return IDScalarAggregationFilters;
    }
    if (attribute.typeHelper.isString()) {
        //     if (attribute.typeHelper.isList()) {
        //         return StringListFilters;
        //     }
        return StringScalarAggregationFilters;
    }
    if (attribute.typeHelper.isInt()) {
        // if (attribute.typeHelper.isList()) {
        //     return IntListFilters;
        // }
        return IntScalarAggregationFilters;
    }
    if (attribute.typeHelper.isFloat()) {
        //     if (attribute.typeHelper.isList()) {
        //         return FloatListFilters;
        //     }
        return FloatScalarAggregationFilters;
    }
    if (attribute.typeHelper.isBigInt()) {
        //     if (attribute.typeHelper.isList()) {
        //         return BigIntListFilters;
        //     }
        return BigIntScalarAggregationFilters;
    }
    if (attribute.typeHelper.isTime()) {
        //     if (attribute.typeHelper.isList()) {
        //         return TimeListFilters;
        //     }
        return TimeScalarAggregationFilters;
    }
    // if (attribute.typeHelper.isPoint()) {
    //     if (attribute.typeHelper.isList()) {
    //         return PointListFilters;
    //     }
    //     return PointFilters;
    // }
    // if (attribute.typeHelper.isCartesianPoint()) {
    //     if (attribute.typeHelper.isList()) {
    //         return CartesianPointListFilters;
    //     }
    //     return CartesianPointFilters;
    // }
    if (attribute.typeHelper.isDateTime()) {
        //     if (attribute.typeHelper.isList()) {
        //         return DateTimeListFilters;
        //     }
        return DateTimeScalarAggregationFilters;
    }
    if (attribute.typeHelper.isLocalTime()) {
        //     if (attribute.typeHelper.isList()) {
        //         return LocalTimeListFilters;
        //     }
        return LocalTimeScalarAggregationFilters;
    }
    if (attribute.typeHelper.isLocalDateTime()) {
        //     if (attribute.typeHelper.isList()) {
        //         return LocalDateTimeListFilters;
        //     }
        return LocalDateTimeScalarAggregationFilters;
    }
    if (attribute.typeHelper.isDuration()) {
        //     if (attribute.typeHelper.isList()) {
        //         return DurationListFilters;
        //     }
        return DurationScalarAggregationFilters;
    }
    // if (attribute.typeHelper.isDate()) {
    //     if (attribute.typeHelper.isList()) {
    //         return DateListFilters;
    //     }
    //     return DateScalarFilters;
    // }

    // if (attribute.typeHelper.isEnum()) {
    //     return `${attribute.getTypeName()}EnumScalarFilters`;
    // }

    // if (attribute.typeHelper.isUserScalar()) {
    //     return `${attribute.getTypeName()}ScalarFilters`;
    // }

    throw new Error(`No scalar filter found for attribute ${attribute.type.name}`);
}
