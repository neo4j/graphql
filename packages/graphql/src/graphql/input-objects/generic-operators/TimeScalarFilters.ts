/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { GraphQLTime } from "../../scalars";

export const TimeScalarFilters = new GraphQLInputObjectType({
    name: "TimeScalarFilters",
    description: "Time filters",
    fields: {
        eq: {
            type: GraphQLTime,
        },
        gt: { type: GraphQLTime },
        gte: { type: GraphQLTime },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLTime)) },
        lt: { type: GraphQLTime },
        lte: { type: GraphQLTime },
    },
});

export const TimeListFilters = new GraphQLInputObjectType({
    name: "TimeListFilters",
    description: "Time list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLTime)) },
        includes: { type: GraphQLTime },
    },
});
