/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLFloat, GraphQLInputObjectType } from "graphql";

export const FloatWhere = new GraphQLInputObjectType({
    name: "FloatWhere",
    description: "The input for filtering a float",
    fields: {
        min: {
            type: GraphQLFloat,
        },
        max: {
            type: GraphQLFloat,
        },
    },
});
