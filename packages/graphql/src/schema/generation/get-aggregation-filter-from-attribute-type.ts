/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLInputObjectType } from "graphql";
import { BigIntScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/BigIntScalarAggregationFilters";
import { DateTimeScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/DateTimeScalarAggregationFilters";
import { DurationScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/DurationScalarAggregationFilters";
import { FloatScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/FloatScalarAggregationFilters";
import { IntScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/IntScalarAggregationFilters";
import { LocalDateTimeScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/LocalDateTimeScalarAggregationFilters";
import { LocalTimeScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/LocalTimeScalarAggregationFilters";
import { StringScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/StringScalarAggregationFilters";
import { TimeScalarAggregationFilters } from "../../graphql/input-objects/generic-aggregation-filters/TimeScalarAggregationFilters";
import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";

export function getAggregationFilterFromAttributeType(attribute: AttributeAdapter): GraphQLInputObjectType | string {
    if (attribute.typeHelper.isList()) {
        throw new Error("List types not available for aggregations");
    }

    if (attribute.typeHelper.isString()) {
        return StringScalarAggregationFilters;
    }
    if (attribute.typeHelper.isInt()) {
        return IntScalarAggregationFilters;
    }
    if (attribute.typeHelper.isFloat()) {
        return FloatScalarAggregationFilters;
    }
    if (attribute.typeHelper.isBigInt()) {
        return BigIntScalarAggregationFilters;
    }
    if (attribute.typeHelper.isTime()) {
        return TimeScalarAggregationFilters;
    }

    if (attribute.typeHelper.isDateTime()) {
        return DateTimeScalarAggregationFilters;
    }
    if (attribute.typeHelper.isLocalTime()) {
        return LocalTimeScalarAggregationFilters;
    }
    if (attribute.typeHelper.isLocalDateTime()) {
        return LocalDateTimeScalarAggregationFilters;
    }
    if (attribute.typeHelper.isDuration()) {
        return DurationScalarAggregationFilters;
    }

    throw new Error(`No scalar filter found for attribute ${attribute.type.name}`);
}
