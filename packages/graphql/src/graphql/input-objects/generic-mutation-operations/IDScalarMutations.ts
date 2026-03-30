/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLID, GraphQLInputObjectType } from "graphql";
import { listMutation } from "./ListMutation";

export const IDScalarMutations = new GraphQLInputObjectType({
    name: "IDScalarMutations",
    description: "ID mutations",
    fields: {
        set: { type: GraphQLID },
    },
});

export const IDListMutations = listMutation(GraphQLID);
