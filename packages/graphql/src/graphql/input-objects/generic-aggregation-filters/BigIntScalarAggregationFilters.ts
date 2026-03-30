/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { BigIntScalarFilters } from "../generic-operators/BigIntScalarFilters";

export const BigIntScalarAggregationFilters = new GraphQLInputObjectType({
    name: "BigIntScalarAggregationFilters",
    description: "Filters for an aggregation of an BigInt field",
    fields: {
        average: { type: BigIntScalarFilters },
        max: { type: BigIntScalarFilters },
        min: { type: BigIntScalarFilters },
        sum: { type: BigIntScalarFilters },
    },
});
