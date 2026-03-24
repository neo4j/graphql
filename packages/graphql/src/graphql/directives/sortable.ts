/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLBoolean, GraphQLDirective, GraphQLNonNull } from "graphql";

export const sortableDirective = new GraphQLDirective({
    name: "sortable",
    description: "Instructs @neo4j/graphql to generate sorting inputs for this field.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        byValue: {
            description: "Generates sorting inputs for this field",
            type: new GraphQLNonNull(GraphQLBoolean),
            defaultValue: true,
        },
    },
});
