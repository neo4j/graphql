/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { FloatScalarFilters } from "../generic-operators/FloatScalarFilters";
import { IntScalarFilters } from "../generic-operators/IntScalarFilters";

export const IntScalarAggregationFilters = new GraphQLInputObjectType({
    name: "IntScalarAggregationFilters",
    description: "Filters for an aggregation of an int field",
    fields: {
        average: { type: FloatScalarFilters },
        max: { type: IntScalarFilters },
        min: { type: IntScalarFilters },
        sum: { type: IntScalarFilters },
    },
});
