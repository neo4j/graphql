/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { GraphQLDate } from "../../scalars";
import { listMutation } from "./ListMutation";

export const DateScalarMutations = new GraphQLInputObjectType({
    name: "DateScalarMutations",
    description: "Date mutations",
    fields: {
        set: { type: GraphQLDate },
    },
});

export const DateListMutations = listMutation(GraphQLDate);
