/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective } from "graphql";

export const groupByDirective = new GraphQLDirective({
    name: "groupBy",
    description: "Enables groupBy operations for this field",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {},
});
