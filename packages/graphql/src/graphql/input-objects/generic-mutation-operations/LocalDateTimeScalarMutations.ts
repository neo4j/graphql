/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { GraphQLLocalDateTime } from "../../scalars";
import { listMutation } from "./ListMutation";

export const LocalDateTimeScalarMutations = new GraphQLInputObjectType({
    name: "LocalDateTimeScalarMutations",
    description: "LocalDateTime mutations",
    fields: {
        set: { type: GraphQLLocalDateTime },
    },
});

export const LocalDateTimeListMutations = listMutation(GraphQLLocalDateTime);
