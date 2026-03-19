/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLBoolean, GraphQLDirective, GraphQLNonNull } from "graphql";

export const filterableDirective = new GraphQLDirective({
    name: "filterable",
    description: "Instructs @neo4j/graphql to generate filters for this field.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        byValue: {
            description: "Generates filters for this field",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: true,
        },
        byAggregate: {
            description: "Generates filters for aggregate value based on this field",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: false,
        },
    },
});
