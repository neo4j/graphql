/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLFloat, GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { PointInput } from "../PointInput";

const DistancePointFilters = new GraphQLInputObjectType({
    name: "PointDistanceFilters",
    description: "Distance filters",
    fields: {
        from: {
            type: new GraphQLNonNull(PointInput),
        },
        gt: { type: GraphQLFloat },
        gte: { type: GraphQLFloat },
        lt: { type: GraphQLFloat },
        lte: { type: GraphQLFloat },
        eq: { type: GraphQLFloat },
    },
});

export const PointFilters = new GraphQLInputObjectType({
    name: "PointFilters",
    description: "Point filters",
    fields: {
        eq: {
            type: PointInput,
        },
        in: { type: new GraphQLList(new GraphQLNonNull(PointInput)) },
        distance: { type: DistancePointFilters },
    },
});

export const PointListFilters = new GraphQLInputObjectType({
    name: "PointListFilters",
    description: "Point list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(PointInput)) },
        includes: { type: PointInput },
    },
});
