/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLEnumType } from "graphql";

export const PopulatedByOperationEnum = new GraphQLEnumType({
    name: "PopulatedByOperation",
    description: "*For use in the @populatedBy directive only*",
    values: {
        CREATE: { value: "CREATE" },
        UPDATE: { value: "UPDATE" },
    },
});
