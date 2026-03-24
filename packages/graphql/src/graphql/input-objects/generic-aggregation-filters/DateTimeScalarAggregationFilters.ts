/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { DateTimeScalarFilters } from "../generic-operators/DateTimeScalarFilters";

export const DateTimeScalarAggregationFilters = new GraphQLInputObjectType({
    name: "DateTimeScalarAggregationFilters",
    description: "Filters for an aggregation of an DateTime input field",
    fields: {
        max: { type: DateTimeScalarFilters },
        min: { type: DateTimeScalarFilters },
    },
});
