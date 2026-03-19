/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { FloatScalarFilters } from "../generic-operators/FloatScalarFilters";

export const FloatScalarAggregationFilters = new GraphQLInputObjectType({
    name: "FloatScalarAggregationFilters",
    description: "Filters for an aggregation of a float field",
    fields: {
        average: { type: FloatScalarFilters },
        max: { type: FloatScalarFilters },
        min: { type: FloatScalarFilters },
        sum: { type: FloatScalarFilters },
    },
});
