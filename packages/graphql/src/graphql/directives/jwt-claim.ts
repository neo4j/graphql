/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { DirectiveLocation, GraphQLDirective, GraphQLNonNull, GraphQLString } from "graphql";

export const jwtClaim = new GraphQLDirective({
    name: "jwtClaim",
    description: "Instructs @neo4j/graphql that the flagged field has a mapped path within the JWT Payload.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        path: {
            description: "The path of the field in the real JWT as mapped within the JWT Payload.",
            type: new GraphQLNonNull(GraphQLString),
        },
    },
});
