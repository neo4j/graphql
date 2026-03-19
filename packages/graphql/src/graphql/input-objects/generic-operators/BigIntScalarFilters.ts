/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { GraphQLBigInt } from "../../scalars";

export const BigIntScalarFilters = new GraphQLInputObjectType({
    name: "BigIntScalarFilters",
    description: "BigInt filters",
    fields: {
        eq: {
            type: GraphQLBigInt,
        },
        gt: { type: GraphQLBigInt },
        gte: { type: GraphQLBigInt },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLBigInt)) },
        lt: { type: GraphQLBigInt },
        lte: { type: GraphQLBigInt },
    },
});

export const BigIntListFilters = new GraphQLInputObjectType({
    name: "BigIntListFilters",
    description: "BigInt list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLBigInt)) },
        includes: { type: GraphQLBigInt },
    },
});
