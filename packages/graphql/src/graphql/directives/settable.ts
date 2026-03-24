/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLBoolean, GraphQLDirective, GraphQLNonNull } from "graphql";

export const settableDirective = new GraphQLDirective({
    name: "settable",
    description: "Instructs @neo4j/graphql to generate this field for mutation inputs.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        onCreate: {
            description: "Generates this input field for create operations.",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: true,
        },
        onUpdate: {
            description: "Generates this input field for update operations.",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: true,
        },
    },
});
