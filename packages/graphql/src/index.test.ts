/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLDirective, GraphQLScalarType } from "graphql";
import { directives, scalars } from ".";

describe("Library exports", () => {
    test("directives", () => {
        expect(directives.aliasDirective).toBeInstanceOf(GraphQLDirective);
    });

    test("scalars", () => {
        expect(scalars.GraphQLBigInt).toBeInstanceOf(GraphQLScalarType);
    });
});
