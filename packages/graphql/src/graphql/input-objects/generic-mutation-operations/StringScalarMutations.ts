/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType, GraphQLString } from "graphql";
import { listMutation } from "./ListMutation";

export const StringScalarMutations = new GraphQLInputObjectType({
    name: "StringScalarMutations",
    description: "String mutations",
    fields: {
        set: { type: GraphQLString },
    },
});

export const StringListMutations = listMutation(GraphQLString);
