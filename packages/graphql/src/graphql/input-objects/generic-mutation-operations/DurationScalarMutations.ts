/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { GraphQLDuration } from "../../scalars";
import { listMutation } from "./ListMutation";

export const DurationScalarMutations = new GraphQLInputObjectType({
    name: "DurationScalarMutations",
    description: "Duration mutations",
    fields: {
        set: { type: GraphQLDuration },
    },
});

export const DurationListMutations = listMutation(GraphQLDuration);
