/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { GraphQLLocalTime } from "../../scalars";

export const LocalTimeScalarFilters = new GraphQLInputObjectType({
    name: "LocalTimeScalarFilters",
    description: "LocalTime filters",
    fields: {
        eq: {
            type: GraphQLLocalTime,
        },
        gt: { type: GraphQLLocalTime },
        gte: { type: GraphQLLocalTime },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLLocalTime)) },
        lt: { type: GraphQLLocalTime },
        lte: { type: GraphQLLocalTime },
    },
});

export const LocalTimeListFilters = new GraphQLInputObjectType({
    name: "LocalTimeListFilters",
    description: "LocalTime list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLLocalTime)) },
        includes: { type: GraphQLLocalTime },
    },
});
