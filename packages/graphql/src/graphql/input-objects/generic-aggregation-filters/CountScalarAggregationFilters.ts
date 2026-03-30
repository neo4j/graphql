/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { IntScalarFilters } from "../generic-operators/IntScalarFilters";

export const ConnectionAggregationCountFilterInput = new GraphQLInputObjectType({
    name: "ConnectionAggregationCountFilterInput",
    fields: {
        nodes: { type: IntScalarFilters },
        edges: { type: IntScalarFilters },
    },
});
