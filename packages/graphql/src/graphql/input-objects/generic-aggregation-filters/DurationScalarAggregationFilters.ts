/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { DurationScalarFilters } from "../generic-operators/DurationScalarFilters";

export const DurationScalarAggregationFilters = new GraphQLInputObjectType({
    name: "DurationScalarAggregationFilters",
    description: "Filters for an aggregation of a Dutation input field",
    fields: {
        max: { type: DurationScalarFilters },
        min: { type: DurationScalarFilters },
        average: { type: DurationScalarFilters },
    },
});
