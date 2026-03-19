/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { GraphQLLocalDateTime } from "../../scalars";

export const LocalDateTimeScalarFilters = new GraphQLInputObjectType({
    name: "LocalDateTimeScalarFilters",
    description: "LocalDateTime filters",
    fields: {
        eq: {
            type: GraphQLLocalDateTime,
        },
        gt: { type: GraphQLLocalDateTime },
        gte: { type: GraphQLLocalDateTime },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLLocalDateTime)) },
        lt: { type: GraphQLLocalDateTime },
        lte: { type: GraphQLLocalDateTime },
    },
});

export const LocalDateTimeListFilters = new GraphQLInputObjectType({
    name: "LocalDateTimeListFilters",
    description: "LocalDateTime list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLLocalDateTime)) },
        includes: { type: GraphQLLocalDateTime },
    },
});
