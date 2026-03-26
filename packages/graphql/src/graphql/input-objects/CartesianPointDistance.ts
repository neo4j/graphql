/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLFloat, GraphQLInputObjectType, GraphQLNonNull } from "graphql";
import { CartesianPointInput } from "./CartesianPointInput";

export const CartesianPointDistance = new GraphQLInputObjectType({
    name: "CartesianPointDistance",
    description: "Input type for a cartesian point with a distance",
    fields: {
        point: {
            type: new GraphQLNonNull(CartesianPointInput),
        },
        distance: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
    },
});
