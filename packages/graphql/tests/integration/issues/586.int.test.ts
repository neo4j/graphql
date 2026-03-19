/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/586", () => {
    test("should not throw when using values in BigInt", () => {
        const typeDefs = gql`
            input TestInput {
                id: BigInt = "0"
            }
        `;
        expect(() => {
            new Neo4jGraphQL({ typeDefs });
        }).not.toThrow();
    });
});
