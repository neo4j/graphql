/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { GraphQLBigInt } from "../../scalars";
import { listMutation } from "./ListMutation";

export const BigIntScalarMutations = new GraphQLInputObjectType({
    name: "BigIntScalarMutations",
    description: "BigInt mutations",
    fields: {
        set: { type: GraphQLBigInt },
        add: { type: GraphQLBigInt },
        subtract: { type: GraphQLBigInt },
    },
});

export const BigIntListMutations = listMutation(GraphQLBigInt);
