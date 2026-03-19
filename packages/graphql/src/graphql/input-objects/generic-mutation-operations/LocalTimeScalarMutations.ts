/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { GraphQLLocalTime } from "../../scalars";
import { listMutation } from "./ListMutation";

export const LocalTimeScalarMutations = new GraphQLInputObjectType({
    name: "LocalTimeScalarMutations",
    description: "LocalTime mutations",
    fields: {
        set: { type: GraphQLLocalTime },
    },
});

export const LocalTimeListMutations = listMutation(GraphQLLocalTime);
