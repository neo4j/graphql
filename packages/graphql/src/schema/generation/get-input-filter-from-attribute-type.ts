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

import type { GraphQLInputType } from "graphql";
import {
    BigIntListFilters,
    BigIntScalarFilters,
} from "../../graphql/input-objects/generic-operators/BigIntScalarFilters";
import {
    BooleanListFilters,
    BooleanScalarFilters,
} from "../../graphql/input-objects/generic-operators/BooleanScalarFilters";
import {
    CartesianPointFilters,
    CartesianPointListFilters,
} from "../../graphql/input-objects/generic-operators/CartesianPointFilters";
import { DateListFilters, DateScalarFilters } from "../../graphql/input-objects/generic-operators/DateScalarFilters";
import {
    DateTimeListFilters,
    DateTimeScalarFilters,
} from "../../graphql/input-objects/generic-operators/DateTimeScalarFilters";
import {
    DurationListFilters,
    DurationScalarFilters,
} from "../../graphql/input-objects/generic-operators/DurationScalarFilters";
import { FloatListFilters, FloatScalarFilters } from "../../graphql/input-objects/generic-operators/FloatScalarFilters";
import { getIDScalarFilters, IDListFilters } from "../../graphql/input-objects/generic-operators/IDScalarFilters";
import { IntListFilters, IntScalarFilters } from "../../graphql/input-objects/generic-operators/IntScalarFilters";
import {
    LocalDateTimeListFilters,
    LocalDateTimeScalarFilters,
} from "../../graphql/input-objects/generic-operators/LocalDateTimeScalarFilters";
import {
    LocalTimeListFilters,
    LocalTimeScalarFilters,
} from "../../graphql/input-objects/generic-operators/LocalTimeScalarFilters";
import { PointFilters, PointListFilters } from "../../graphql/input-objects/generic-operators/PointFilters";
import {
    getStringScalarFilters,
    StringListFilters,
} from "../../graphql/input-objects/generic-operators/StringScalarFilters";
import { TimeListFilters, TimeScalarFilters } from "../../graphql/input-objects/generic-operators/TimeScalarFilters";
import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { Neo4jFeaturesSettings } from "../../types";

export function getInputFilterFromAttributeType(
    attribute: AttributeAdapter,
    features?: Neo4jFeaturesSettings
): GraphQLInputType | string {
    // NOTE: static types returned here must be added to schema-validation > validateUserDefinition
    if (attribute.typeHelper.isBoolean()) {
        if (attribute.typeHelper.isList()) {
            return BooleanListFilters;
        }
        return BooleanScalarFilters;
    }
    if (attribute.typeHelper.isID()) {
        if (attribute.typeHelper.isList()) {
            return IDListFilters;
        }
        return getIDScalarFilters(features);
    }
    if (attribute.typeHelper.isString()) {
        if (attribute.typeHelper.isList()) {
            return StringListFilters;
        }
        return getStringScalarFilters(features);
    }
    if (attribute.typeHelper.isInt()) {
        if (attribute.typeHelper.isList()) {
            return IntListFilters;
        }
        return IntScalarFilters;
    }
    if (attribute.typeHelper.isFloat()) {
        if (attribute.typeHelper.isList()) {
            return FloatListFilters;
        }
        return FloatScalarFilters;
    }
    if (attribute.typeHelper.isBigInt()) {
        if (attribute.typeHelper.isList()) {
            return BigIntListFilters;
        }
        return BigIntScalarFilters;
    }
    if (attribute.typeHelper.isTime()) {
        if (attribute.typeHelper.isList()) {
            return TimeListFilters;
        }
        return TimeScalarFilters;
    }
    if (attribute.typeHelper.isPoint()) {
        if (attribute.typeHelper.isList()) {
            return PointListFilters;
        }
        return PointFilters;
    }
    if (attribute.typeHelper.isCartesianPoint()) {
        if (attribute.typeHelper.isList()) {
            return CartesianPointListFilters;
        }
        return CartesianPointFilters;
    }
    if (attribute.typeHelper.isDateTime()) {
        if (attribute.typeHelper.isList()) {
            return DateTimeListFilters;
        }
        return DateTimeScalarFilters;
    }
    if (attribute.typeHelper.isLocalTime()) {
        if (attribute.typeHelper.isList()) {
            return LocalTimeListFilters;
        }
        return LocalTimeScalarFilters;
    }
    if (attribute.typeHelper.isLocalDateTime()) {
        if (attribute.typeHelper.isList()) {
            return LocalDateTimeListFilters;
        }
        return LocalDateTimeScalarFilters;
    }
    if (attribute.typeHelper.isDuration()) {
        if (attribute.typeHelper.isList()) {
            return DurationListFilters;
        }
        return DurationScalarFilters;
    }
    if (attribute.typeHelper.isDate()) {
        if (attribute.typeHelper.isList()) {
            return DateListFilters;
        }
        return DateScalarFilters;
    }

    if (attribute.typeHelper.isEnum()) {
        const filtersName = attribute.typeHelper.isList() ? "ListEnumScalarFilters" : "EnumScalarFilters";
        return `${attribute.getTypeName()}${filtersName}`;
    }

    if (attribute.typeHelper.isUserScalar()) {
        const filtersName = attribute.typeHelper.isList() ? "ListScalarFilters" : "ScalarFilters";
        return `${attribute.getTypeName()}${filtersName}`;
    }

    throw new Error(`No scalar filter found for attribute ${attribute.type.name}`);
}
