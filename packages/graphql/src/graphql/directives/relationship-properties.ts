/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective } from "graphql";

export const relationshipPropertiesDirective = new GraphQLDirective({
    name: "relationshipProperties",
    description: "Required to differentiate between interfaces for relationship properties, and otherwise.",
    locations: [DirectiveLocation.OBJECT],
});
