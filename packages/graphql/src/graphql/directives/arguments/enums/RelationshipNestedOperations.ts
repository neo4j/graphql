/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLEnumType } from "graphql";
import { RelationshipNestedOperationsOption } from "../../../../constants";

export const RelationshipNestedOperationsEnum = new GraphQLEnumType({
    name: "RelationshipNestedOperations",
    description: "*For use in the @relationship directive only",
    values: {
        [RelationshipNestedOperationsOption.CREATE]: {},
        [RelationshipNestedOperationsOption.UPDATE]: {},
        [RelationshipNestedOperationsOption.DELETE]: {},
        [RelationshipNestedOperationsOption.CONNECT]: {},
        [RelationshipNestedOperationsOption.DISCONNECT]: {},
    },
});
