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
import { BigIntScalarFilters } from "../../graphql/input-objects/generic-operators/BigIntScalarFilters";
import { BooleanScalarFilters } from "../../graphql/input-objects/generic-operators/BooleanScalarFilters";
import { DateScalarFilters } from "../../graphql/input-objects/generic-operators/DateScalarFilters";
import { DateTimeScalarFilters } from "../../graphql/input-objects/generic-operators/DateTimeScalarFilters";
import { DurationScalarFilters } from "../../graphql/input-objects/generic-operators/DurationScalarFilters";
import { FloatScalarFilters } from "../../graphql/input-objects/generic-operators/FloatScalarFilters";
import { IDScalarFilters } from "../../graphql/input-objects/generic-operators/IDScalarFilters";
import { IntScalarFilters } from "../../graphql/input-objects/generic-operators/IntScalarFilters";
import { LocalDateTimeScalarFilters } from "../../graphql/input-objects/generic-operators/LocalDateTimeScalarFilters";
import { LocalTimeScalarFilters } from "../../graphql/input-objects/generic-operators/LocalTimeScalarFilters";
import { CartesianPointFilters, PointFilters } from "../../graphql/input-objects/generic-operators/PointFilters";
import { StringScalarFilters } from "../../graphql/input-objects/generic-operators/StringScalarFilters";
import { TimeScalarFilters } from "../../graphql/input-objects/generic-operators/TimeScalarFilters";
import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";

export function getInputTypeFromAttributeType(attribute: AttributeAdapter): GraphQLInputType {
    if (attribute.typeHelper.isBoolean()) {
        return BooleanScalarFilters;
    }
    if (attribute.typeHelper.isID()) {
        return IDScalarFilters;
    }
    if (attribute.typeHelper.isString()) {
        return StringScalarFilters;
    }
    if (attribute.typeHelper.isInt()) {
        return IntScalarFilters;
    }
    if (attribute.typeHelper.isFloat()) {
        return FloatScalarFilters;
    }
    if (attribute.typeHelper.isBigInt()) {
        return BigIntScalarFilters;
    }
    if (attribute.typeHelper.isTime()) {
        return TimeScalarFilters;
    }
    if (attribute.typeHelper.isPoint()) {
        return PointFilters;
    }
    if (attribute.typeHelper.isCartesianPoint()) {
        return CartesianPointFilters;
    }
    if (attribute.typeHelper.isDateTime()) {
        return DateTimeScalarFilters;
    }
    if (attribute.typeHelper.isLocalTime()) {
        return LocalTimeScalarFilters;
    }
    if (attribute.typeHelper.isLocalDateTime()) {
        return LocalDateTimeScalarFilters;
    }
    if (attribute.typeHelper.isDuration()) {
        return DurationScalarFilters;
    }
    if (attribute.typeHelper.isDate()) {
        return DateScalarFilters;
    }
    throw new Error(`No scalar filter found for attribute ${attribute.type.name}`);
}
