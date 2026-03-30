/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLInt, GraphQLList, GraphQLNonNull } from "graphql";

export const IntScalarFilters = new GraphQLInputObjectType({
    name: "IntScalarFilters",
    description: "Int filters",
    fields: {
        eq: { type: GraphQLInt },
        gt: { type: GraphQLInt },
        gte: { type: GraphQLInt },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLInt)) },
        lt: { type: GraphQLInt },
        lte: { type: GraphQLInt },
    },
});

export const IntListFilters = new GraphQLInputObjectType({
    name: "IntListFilters",
    description: "Int list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLInt)) },
        includes: { type: GraphQLInt },
    },
});
