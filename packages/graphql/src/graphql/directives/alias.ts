/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective, GraphQLNonNull, GraphQLString } from "graphql";

export const aliasDirective = new GraphQLDirective({
    name: "alias",
    description: "Instructs @neo4j/graphql to map a GraphQL field to a Neo4j node or relationship property.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        property: {
            description: "The name of the Neo4j property",
            type: new GraphQLNonNull(GraphQLString),
        },
    },
});
