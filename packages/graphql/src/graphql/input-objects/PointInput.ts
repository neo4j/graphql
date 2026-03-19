/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLFloat, GraphQLInputObjectType, GraphQLNonNull } from "graphql";

export const PointInput = new GraphQLInputObjectType({
    name: "PointInput",
    description: "Input type for a point",
    fields: {
        longitude: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        latitude: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        height: {
            type: GraphQLFloat,
        },
    },
});
