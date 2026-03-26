/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLEnumType } from "graphql";

export const TimestampOperationEnum = new GraphQLEnumType({
    name: "TimestampOperation",
    description: "*For use in the @timestamp directive only*",
    values: {
        CREATE: {},
        UPDATE: {},
    },
});
