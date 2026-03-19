/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective, GraphQLInt } from "graphql";

export const limitDirective = new GraphQLDirective({
    name: "limit",
    description: "Instructs @neo4j/graphql to inject limit values into a query.",
    args: {
        default: {
            description: "If no limit argument is supplied on query will fallback to this value.",
            type: GraphQLInt,
        },
        max: {
            description: "Maximum limit to be used for queries.",
            type: GraphQLInt,
        },
    },
    locations: [DirectiveLocation.OBJECT, DirectiveLocation.INTERFACE],
});
