/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLFloat, GraphQLInputObjectType, GraphQLNonNull } from "graphql";

export const CartesianPointInput = new GraphQLInputObjectType({
    name: "CartesianPointInput",
    description: "Input type for a cartesian point",
    fields: {
        x: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        y: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        z: {
            type: GraphQLFloat,
        },
    },
});
