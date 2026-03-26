/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { GraphQLTime } from "../../scalars";
import { listMutation } from "./ListMutation";

export const TimeScalarMutations = new GraphQLInputObjectType({
    name: "TimeScalarMutations",
    description: "Time mutations",
    fields: {
        set: { type: GraphQLTime },
    },
});

export const TimeListMutations = listMutation(GraphQLTime);
