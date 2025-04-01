/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { GraphQLError } from "graphql";
import { GraphQLSchema } from "graphql";
import { gql } from "graphql-tag";
import { cypherDirective, fulltextDirective, nodeDirective } from "../../../graphql/directives";
import { validateSDL } from "../validate-sdl";
import { ValidateNeo4jDirectiveArgumentsValue } from "./validate-neo4j-directive-arguments-value";

describe("validateNeo4jDirectiveArgumentsValue", () => {
    describe("node", () => {
        test("should returns no errors for valid node arguments", () => {
            const userDocument = gql`
                type User @node(labels: ["Person"]) {
                    id: ID!
                    name: String!
                }
            `;
            const schemaToExtend = new GraphQLSchema({
                directives: [nodeDirective],
            });
            const errors = validateSDL(userDocument, [ValidateNeo4jDirectiveArgumentsValue], schemaToExtend);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(0);
        });

        test("should returns errors for invalid node arguments", () => {
            const userDocument = gql`
                type User @node(labels: 1) {
                    id: ID!
                    name: String!
                }
            `;
            const schemaToExtend = new GraphQLSchema({
                directives: [nodeDirective],
            });
            const errors = validateSDL(userDocument, [ValidateNeo4jDirectiveArgumentsValue], schemaToExtend);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(1);
            expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                `"Invalid argument: labels, error: String cannot represent a non string value: 1"`
            );
        });
    });

    describe("cypher", () => {
        test("should returns no errors for valid cypher arguments", () => {
            const userDocument = gql`
                type User @node {
                    id: ID!
                    name: String!
                        @cypher(
                            statement: """
                            MATCH (n:Movie) RETURN n as movie
                            """
                            columnName: "movie"
                        )
                }
            `;
            const schemaToExtend = new GraphQLSchema({
                directives: [nodeDirective, cypherDirective],
            });
            const errors = validateSDL(userDocument, [ValidateNeo4jDirectiveArgumentsValue], schemaToExtend);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(0);
        });

        test("should returns errors for invalid cypher arguments", () => {
            const userDocument = gql`
                type User @node {
                    id: ID!
                    name: String!
                        @cypher(
                            statement: """
                            MATCH (n:Movie) RETURN n as movie
                            """
                            columnName: 3
                        )
                }
            `;
            const schemaToExtend = new GraphQLSchema({
                directives: [nodeDirective, cypherDirective],
            });
            const errors = validateSDL(userDocument, [ValidateNeo4jDirectiveArgumentsValue], schemaToExtend);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(1);
            expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                `"Invalid argument: columnName, error: String cannot represent a non string value: 3"`
            );
        });
    });

    describe("fulltext", () => {
        test("should returns no errors for valid fulltext arguments", () => {
            const userDocument = gql`
                type User @fulltext(indexes: [{ fields: ["id", "name"], queryName: "userFullText", indexName: "UserIndex" }]) {
                    id: ID!
                    name: String!
                }
            `;
            const schemaToExtend = new GraphQLSchema({
                directives: [nodeDirective, cypherDirective, fulltextDirective],
            });
            const errors = validateSDL(userDocument, [ValidateNeo4jDirectiveArgumentsValue], schemaToExtend);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(0);
        });

        test("should returns errors for invalid fulltext arguments", () => {
            const userDocument = gql`
                type User @fulltext(indexes: [{ fields: ["id", "name"], indexName: ["UserIndex"] }]) {
                    id: ID!
                    name: String!
                }
            `;
            const schemaToExtend = new GraphQLSchema({
                directives: [nodeDirective, cypherDirective, fulltextDirective],
            });
            const errors = validateSDL(userDocument, [ValidateNeo4jDirectiveArgumentsValue], schemaToExtend);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(1);
            expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                `"Invalid argument: indexes, error: String cannot represent a non string value: [\\"UserIndex\\"]"`
            );
        });
    });
});
