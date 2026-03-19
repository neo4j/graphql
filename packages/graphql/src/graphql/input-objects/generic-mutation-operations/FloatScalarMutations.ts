/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLFloat, GraphQLInputObjectType } from "graphql";
import { listMutation } from "./ListMutation";

export const FloatScalarMutations = new GraphQLInputObjectType({
    name: "FloatScalarMutations",
    description: "Float mutations",
    fields: {
        set: { type: GraphQLFloat },
        add: { type: GraphQLFloat },
        subtract: { type: GraphQLFloat },
        multiply: { type: GraphQLFloat },
        divide: { type: GraphQLFloat },
    },
});

export const FloatListMutations = listMutation(GraphQLFloat);
