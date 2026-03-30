/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { FloatScalarFilters } from "../generic-operators/FloatScalarFilters";
import { IntScalarFilters } from "../generic-operators/IntScalarFilters";

export const StringScalarAggregationFilters = new GraphQLInputObjectType({
    name: "StringScalarAggregationFilters",
    description: "Filters for an aggregation of a string field",
    fields: {
        averageLength: { type: FloatScalarFilters },
        shortestLength: { type: IntScalarFilters },
        longestLength: { type: IntScalarFilters },
    },
});
