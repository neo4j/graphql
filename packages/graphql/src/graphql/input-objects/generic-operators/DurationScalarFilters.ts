/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { GraphQLDuration } from "../../scalars";

export const DurationScalarFilters = new GraphQLInputObjectType({
    name: "DurationScalarFilters",
    description: "Duration filters",
    fields: {
        eq: {
            type: GraphQLDuration,
        },
        gt: { type: GraphQLDuration },
        gte: { type: GraphQLDuration },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLDuration)) },
        lt: { type: GraphQLDuration },
        lte: { type: GraphQLDuration },
    },
});

export const DurationListFilters = new GraphQLInputObjectType({
    name: "DurationListFilters",
    description: "Duration list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLDuration)) },
        includes: { type: GraphQLDuration },
    },
});
