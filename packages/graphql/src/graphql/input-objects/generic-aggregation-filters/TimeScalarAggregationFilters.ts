/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { TimeScalarFilters } from "../generic-operators/TimeScalarFilters";

export const TimeScalarAggregationFilters = new GraphQLInputObjectType({
    name: "TimeScalarAggregationFilters",
    description: "Filters for an aggregation of an Time input field",
    fields: {
        max: { type: TimeScalarFilters },
        min: { type: TimeScalarFilters },
    },
});
