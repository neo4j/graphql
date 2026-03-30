/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLBoolean, GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";

export const BooleanScalarFilters = new GraphQLInputObjectType({
    name: "BooleanScalarFilters",
    description: "Boolean filters",
    fields: {
        eq: {
            type: GraphQLBoolean,
        },
    },
});

export const BooleanListFilters = new GraphQLInputObjectType({
    name: "BooleanListFilters",
    description: "Boolean list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLBoolean)) },
    },
});
