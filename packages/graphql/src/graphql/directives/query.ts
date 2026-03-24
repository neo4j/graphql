/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLBoolean, GraphQLDirective, GraphQLNonNull } from "graphql";

export const queryDirective = new GraphQLDirective({
    name: "query",
    description:
        "Instructs @neo4j/graphql to exclude read, connection, or aggregate operations from the query root type.",
    args: {
        read: {
            description: "Disable/Enabled all read operations from query root type (this means connections too).",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: true,
        },
        connection: {
            description:
                "Disable/Enabled connection operations from query root type. Default value matches value of read argument, or true if not provided.",
            type: GraphQLBoolean,
        },
        aggregate: {
            description: "Disable/Enabled aggregate operations from the connection read operations.",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: false,
        },
    },
    locations: [
        DirectiveLocation.OBJECT,
        DirectiveLocation.SCHEMA,
        DirectiveLocation.INTERFACE,
        DirectiveLocation.UNION,
    ],
});
