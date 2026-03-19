/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLFloat, GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";

export const FloatScalarFilters = new GraphQLInputObjectType({
    name: "FloatScalarFilters",
    description: "Float filters",
    fields: {
        eq: {
            type: GraphQLFloat,
        },
        gt: { type: GraphQLFloat },
        gte: { type: GraphQLFloat },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLFloat)) },
        lt: { type: GraphQLFloat },
        lte: { type: GraphQLFloat },
    },
});

export const FloatListFilters = new GraphQLInputObjectType({
    name: "FloatListFilters",
    description: "Float list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLFloat)) },
        includes: { type: GraphQLFloat },
    },
});
