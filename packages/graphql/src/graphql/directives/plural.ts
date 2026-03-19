/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective, GraphQLNonNull, GraphQLString } from "graphql";

export const pluralDirective = new GraphQLDirective({
    name: "plural",
    description: "Instructs @neo4j/graphql to use the given value as the plural of the type name",
    locations: [DirectiveLocation.OBJECT, DirectiveLocation.INTERFACE, DirectiveLocation.UNION],
    args: {
        value: {
            description: "The value to use as the plural of the type name.",
            type: new GraphQLNonNull(GraphQLString),
        },
    },
});
