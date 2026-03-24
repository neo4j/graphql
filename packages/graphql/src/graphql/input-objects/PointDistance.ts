/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLFloat, GraphQLInputObjectType, GraphQLNonNull } from "graphql";
import { PointInput } from "./PointInput";

export const PointDistance = new GraphQLInputObjectType({
    name: "PointDistance",
    description: "Input type for a point with a distance",
    fields: {
        point: {
            type: new GraphQLNonNull(PointInput),
        },
        distance: {
            type: new GraphQLNonNull(GraphQLFloat),
            description: "The distance in metres to be used when comparing two points",
        },
    },
});
