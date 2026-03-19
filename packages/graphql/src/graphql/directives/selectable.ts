/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLBoolean, GraphQLDirective, GraphQLNonNull } from "graphql";

export const selectableDirective = new GraphQLDirective({
    name: "selectable",
    description: "Instructs @neo4j/graphql to generate this field for selectable types.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        onRead: {
            description: "Generates this field on read and subscribe operations.",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: true,
        },
        onAggregate: {
            description: "Generates this field on aggregation operations.",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: false,
        },
    },
});
