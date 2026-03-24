/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";

export const nodeDirective = new GraphQLDirective({
    name: "node",
    description: "Informs @neo4j/graphql of node metadata",
    locations: [DirectiveLocation.OBJECT],
    args: {
        labels: {
            description: "The labels to map this GraphQL type to in the Neo4j database",
            type: new GraphQLList(new GraphQLNonNull(GraphQLString)),
        },
    },
});
