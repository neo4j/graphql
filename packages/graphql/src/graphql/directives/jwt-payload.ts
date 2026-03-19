/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective } from "graphql";

export const jwt = new GraphQLDirective({
    name: "jwt",
    description: "Instructs @neo4j/graphql that the flagged object represents the relevant JWT payload",
    locations: [DirectiveLocation.OBJECT],
});
