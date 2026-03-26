/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { LocalDateTimeScalarFilters } from "../generic-operators/LocalDateTimeScalarFilters";

export const LocalDateTimeScalarAggregationFilters = new GraphQLInputObjectType({
    name: "LocalDateTimeScalarAggregationFilters",
    description: "Filters for an aggregation of an LocalDateTime input field",
    fields: {
        max: { type: LocalDateTimeScalarFilters },
        min: { type: LocalDateTimeScalarFilters },
    },
});
