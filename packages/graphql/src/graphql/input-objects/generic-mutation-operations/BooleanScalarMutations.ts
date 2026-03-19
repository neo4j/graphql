/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLBoolean, GraphQLInputObjectType } from "graphql";
import { listMutation } from "./ListMutation";

export const BooleanScalarMutations = new GraphQLInputObjectType({
    name: "BooleanScalarMutations",
    description: "Boolean mutations",
    fields: {
        set: { type: GraphQLBoolean },
    },
});

export const BooleanListMutations = listMutation(GraphQLBoolean);
