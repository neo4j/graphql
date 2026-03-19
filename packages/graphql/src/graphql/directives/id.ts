/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective } from "graphql";

export const idDirective = new GraphQLDirective({
    name: "id",
    description: "Enables the autogeneration of UUID values for an ID field. The field becomes immutable.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});
