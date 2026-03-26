/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLEnumType } from "graphql";

export const EventType = new GraphQLEnumType({
    name: "EventType",
    values: {
        CREATE: {},
        DELETE: {},
        UPDATE: {},
        CREATE_RELATIONSHIP: {},
        DELETE_RELATIONSHIP: {},
    },
});
