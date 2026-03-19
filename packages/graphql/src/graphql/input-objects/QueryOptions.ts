/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLInt } from "graphql";

export const QueryOptions = new GraphQLInputObjectType({
    name: "QueryOptions",
    description: "Input type for options that can be specified on a query operation.",
    fields: {
        offset: {
            type: GraphQLInt,
        },
        limit: {
            type: GraphQLInt,
        },
    },
});
