/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLFloat, GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { CartesianPointInput } from "../CartesianPointInput";

const CartesianDistancePointFilters = new GraphQLInputObjectType({
    name: "CartesianDistancePointFilters",
    description: "Distance filters for cartesian points",
    fields: {
        from: {
            type: new GraphQLNonNull(CartesianPointInput),
        },
        gt: { type: GraphQLFloat },
        gte: { type: GraphQLFloat },
        lt: { type: GraphQLFloat },
        lte: { type: GraphQLFloat },
    },
});

export const CartesianPointFilters = new GraphQLInputObjectType({
    name: "CartesianPointFilters",
    description: "Cartesian Point filters",
    fields: {
        eq: {
            type: CartesianPointInput,
        },
        in: { type: new GraphQLList(new GraphQLNonNull(CartesianPointInput)) },
        distance: { type: CartesianDistancePointFilters },
    },
});

export const CartesianPointListFilters = new GraphQLInputObjectType({
    name: "CartesianPointListFilters",
    description: "CartesianPoint list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(CartesianPointInput)) },
        includes: { type: CartesianPointInput },
    },
});
