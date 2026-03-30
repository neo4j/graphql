/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLInt } from "graphql";
import { listMutation } from "./ListMutation";

export const IntScalarMutations = new GraphQLInputObjectType({
    name: "IntScalarMutations",
    description: "Int mutations",
    fields: {
        set: { type: GraphQLInt },
        add: { type: GraphQLInt },
        subtract: { type: GraphQLInt },
    },
});

export const IntListMutations = listMutation(GraphQLInt);
