/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { GraphQLDateTime } from "../../scalars";

export const DateTimeScalarFilters = new GraphQLInputObjectType({
    name: "DateTimeScalarFilters",
    description: "DateTime filters",
    fields: {
        eq: {
            type: GraphQLDateTime,
        },
        gt: { type: GraphQLDateTime },
        gte: { type: GraphQLDateTime },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLDateTime)) },
        lt: { type: GraphQLDateTime },
        lte: { type: GraphQLDateTime },
    },
});

export const DateTimeListFilters = new GraphQLInputObjectType({
    name: "DateTimeListFilters",
    description: "DateTime list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLDateTime)) },
        includes: { type: GraphQLDateTime },
    },
});
