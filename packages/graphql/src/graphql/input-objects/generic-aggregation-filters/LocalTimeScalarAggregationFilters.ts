/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { LocalTimeScalarFilters } from "../generic-operators/LocalTimeScalarFilters";

export const LocalTimeScalarAggregationFilters = new GraphQLInputObjectType({
    name: "LocalTimeScalarAggregationFilters",
    description: "Filters for an aggregation of an LocalTime input field",
    fields: {
        max: { type: LocalTimeScalarFilters },
        min: { type: LocalTimeScalarFilters },
    },
});
