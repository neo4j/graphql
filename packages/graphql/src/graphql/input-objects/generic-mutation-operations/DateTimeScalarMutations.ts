/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { GraphQLDateTime } from "../../scalars";
import { listMutation } from "./ListMutation";

export const DateTimeScalarMutations = new GraphQLInputObjectType({
    name: "DateTimeScalarMutations",
    description: "DateTime mutations",
    fields: {
        set: { type: GraphQLDateTime },
    },
});

export const DateTimeListMutations = listMutation(GraphQLDateTime);
