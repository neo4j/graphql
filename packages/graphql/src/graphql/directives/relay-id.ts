/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective } from "graphql";

export const relayIdDirective = new GraphQLDirective({
    name: "relayId",
    description:
        "Mark the field to be used as the global node identifier for Relay. This field will be backed by a unique node property constraint.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});
