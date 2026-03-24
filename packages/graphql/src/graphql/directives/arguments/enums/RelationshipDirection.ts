/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLEnumType } from "graphql";

export const RelationshipDirectionEnum = new GraphQLEnumType({
    name: "RelationshipDirection",
    description: "*For use in the @relationship directive only",
    values: {
        IN: {},
        OUT: {},
    },
});
