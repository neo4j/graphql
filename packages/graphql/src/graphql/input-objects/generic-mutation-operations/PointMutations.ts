/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLInputObjectType } from "graphql";
import { PointInput } from "../PointInput";
import { listMutation } from "./ListMutation";

export const PointMutations = new GraphQLInputObjectType({
    name: "PointMutations",
    description: "Point mutations",
    fields: {
        set: { type: PointInput },
    },
});

export const PointListMutations = listMutation(PointInput);
