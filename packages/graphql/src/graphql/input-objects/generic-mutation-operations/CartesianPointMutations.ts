/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { CartesianPointInput } from "../CartesianPointInput";
import { listMutation } from "./ListMutation";

export const CartesianPointMutations = new GraphQLInputObjectType({
    name: "CartesianPointMutations",
    description: "CartesianPoint mutations",
    fields: {
        set: { type: CartesianPointInput },
    },
});

export const CartesianPointListMutations = listMutation(CartesianPointInput);
