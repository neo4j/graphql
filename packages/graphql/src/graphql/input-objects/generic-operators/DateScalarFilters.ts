/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { GraphQLDate } from "../../scalars";

export const DateScalarFilters = new GraphQLInputObjectType({
    name: "DateScalarFilters",
    description: "Date filters",
    fields: {
        eq: {
            type: GraphQLDate,
        },
        gt: { type: GraphQLDate },
        gte: { type: GraphQLDate },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLDate)) },
        lt: { type: GraphQLDate },
        lte: { type: GraphQLDate },
    },
});

export const DateListFilters = new GraphQLInputObjectType({
    name: "DateListFilters",
    description: "Date list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLDate)) },
        includes: { type: GraphQLDate },
    },
});
