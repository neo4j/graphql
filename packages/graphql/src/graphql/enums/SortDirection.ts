/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLEnumType } from "graphql";

export const SortDirection = new GraphQLEnumType({
    name: "SortDirection",
    description: "An enum for sorting in either ascending or descending order.",
    values: {
        ASC: {
            value: "ASC",
            description: "Sort by field values in ascending order.",
        },
        DESC: {
            value: "DESC",
            description: "Sort by field values in descending order.",
        },
    },
});
