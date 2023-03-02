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

import { mergeTypeDefs } from "@graphql-tools/merge";
import { gql } from "apollo-server";
import { Neo4jGraphQLSchemaValidationError } from "../classes";
import { generateModel } from "./generate-model";

describe("@authorization directive validation", () => {
    describe("argument type", () => {
        test("validate.pre should be of type array", () => {
            const typeDefs = gql`
                type User @authorization(validate: { pre: { where: { node: { id: { equals: "$jwt.sub" } } } } }) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).toThrowWithMessage(
                Neo4jGraphQLSchemaValidationError,
                "pre should be a List"
            );
        });

        test("validate pre and post, pre should be of type array", () => {
            const typeDefs = gql`
                type User
                    @authorization(
                        validate: {
                            pre: { where: { node: { id: { equals: "$jwt.sub" } } } }
                            post: [{ where: { node: { id: { equals: "$jwt.sub" } } } }]
                        }
                    ) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).toThrowWithMessage(
                Neo4jGraphQLSchemaValidationError,
                "pre should be a List"
            );
        });

        test("validate should be of type object", () => {
            const typeDefs = gql`
                type User @authorization(validate: [{ where: { node: { id: { equals: "$jwt.sub" } } } }]) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).toThrowWithMessage(
                Neo4jGraphQLSchemaValidationError,
                "validate should be of type Object"
            );
        });

        test("filter should be of type object", () => {
            const typeDefs = gql`
                type User @authorization(filter: { where: { node: { id: { equals: "$jwt.sub" } } } }) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).toThrowWithMessage(
                Neo4jGraphQLSchemaValidationError,
                "filter should be a List"
            );
        });
    });

    describe("argument value", () => {
        test("incorrect directive argument", () => {
            const typeDefs = gql`
                type User @authorization(iAmWrong: { where: { node: { id: { equals: "$jwt.sub" } } } }) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).toThrowWithMessage(
                Neo4jGraphQLSchemaValidationError,
                "@authorization requires at least one of filter, validate, filterSubscriptions arguments"
            );
        });

        test("validate with incorrect arguments", () => {
            const typeDefs = gql`
                type User
                    @authorization(validate: { iAmWrong: [{ where: { node: { id: { equals: "$jwt.sub" } } } }] }) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).toThrowWithMessage(
                Neo4jGraphQLSchemaValidationError,
                "validate should contain one of pre, post"
            );
        });

        test("validate node with incorrect arguments", () => {
            const typeDefs = gql`
                type User
                    @authorization(validate: { pre: [{ where: { node: { iAmWrong: { equals: "$jwt.sub" } } } }] }) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).toThrowWithMessage(
                Neo4jGraphQLSchemaValidationError,
                "unknown field iAmWrong in node"
            );
        });

        test("validate node incorrect operation", () => {
            const typeDefs = gql`
                type User @authorization(validate: { pre: [{ where: { node: { id: { iAmWrong: "$jwt.sub" } } } }] }) {
                    id: ID!
                    athh: String
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).toThrowWithMessage(
                Neo4jGraphQLSchemaValidationError,
                "iAmWrong is not supported on ID fields"
            );
        });

        test("validate.pre correct arguments", () => {
            const typeDefs = gql`
                type User @authorization(validate: { pre: [{ where: { node: { id: { equals: "valid-string" } } } }] }) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).not.toThrow();
        });

        test("validate pre and post correct arguments", () => {
            const typeDefs = gql`
                type User
                    @authorization(
                        validate: {
                            pre: [{ where: { node: { id: { equals: "$jwt.sub" } } } }]
                            post: [{ where: { node: { id: { equals: "$jwt.sub" } } } }]
                        }
                    ) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).not.toThrow();
        });
    });

    describe("argument operations", () => {
        test("filter operation cannot be CREATE", () => {
            const typeDefs = gql`
                type User
                    @authorization(
                        filter: [{ operations: [CREATE], where: { node: { id: { equals: "valid-string" } } } }]
                    ) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).toThrowWithMessage(
                Neo4jGraphQLSchemaValidationError,
                "CREATE operation is not allowed"
            );
        });

        test("valid filter operation", () => {
            const typeDefs = gql`
                type User
                    @authorization(
                        filter: [
                            {
                                operations: [READ, CREATE_RELATIONSHIP]
                                where: { node: { id: { equals: "valid-string" } } }
                            }
                        ]
                    ) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).not.toThrow();
        });
    });

    describe("requireAuthentication", () => {
        test("should not throw if undefined", () => {
            const typeDefs = gql`
                type User @authorization(filter: [{ where: { node: { id: { equals: "valid-string" } } } }]) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).not.toThrow();
        });

        test("requireAuthentication should throw if not of type boolean", () => {
            const typeDefs = gql`
                type User
                    @authorization(
                        filter: [{ requireAuthentication: 22, where: { node: { id: { equals: "valid-string" } } } }]
                    ) {
                    id: ID!
                    name: String!
                }
            `;

            const document = mergeTypeDefs(typeDefs);
            expect(() => generateModel(document)).toThrowWithMessage(
                Neo4jGraphQLSchemaValidationError,
                "requireAuthentication should be of type Boolean"
            );
        });
    });
});

describe("filter", () => {
    test("node.and with string value - correct format", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { AND: [{ name: { equals: "1" } }, { scores: { includes: 1 } }] } }
                        }
                    ]
                ) {
                name: String!
                scores: [Int]
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.name+scores with string, [int], implicit and - correct format", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { name: { equals: "1" }, scores: { includes: 2 } } }
                        }
                    ]
                ) {
                name: String!
                scores: [Int]
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.and.name+scores with string, [int], implicit and - correct format", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: {
                                node: {
                                    AND: [
                                        { name: { equals: "1" }, scores: { includes: 2 } }
                                        { scores: { includes: 1 } }
                                    ]
                                }
                            }
                        }
                    ]
                ) {
                name: String!
                scores: [Int]
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.name.and with string value - correct format", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { name: { AND: [{ equals: "12" }, { contains: "2" }] } } }
                        }
                    ]
                ) {
                name: String!
                scores: [Int]
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.name.and.not with string value - correct format", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: {
                                node: {
                                    name: { AND: [{ equals: "12" }, { contains: "2" }, { NOT: { startsWith: "3" } }] }
                                }
                            }
                        }
                    ]
                ) {
                name: String!
                scores: [Int]
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.scores.and with [int] value - correct format", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { scores: { AND: [{ includes: 1 }, { equals: [2, 3] }] } } }
                        }
                    ]
                ) {
                name: String!
                scores: [Int]
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.scores.and.and.not with [int] value - correct format", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: {
                                node: {
                                    scores: {
                                        AND: [
                                            { includes: 1 }
                                            { equals: [2, 3] }
                                            { AND: [{ NOT: { includes: 2 } }, { equals: [5] }] }
                                        ]
                                    }
                                }
                            }
                        }
                    ]
                ) {
                name: String!
                scores: [Int]
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test.skip("node.scores.and cannot be combined with includes", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { scores: { AND: [{ includes: 1 }, { equals: [2, 3] }], includes: 42 } } }
                        }
                    ]
                ) {
                name: String!
                scores: [Int]
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        expect(() => generateModel(document)).toThrow();
    });

    test("node.name.hocuspocus operator does not exist", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { name: { hocuspocus: [{ equals: "12" }, { contains: "2" }] } } }
                        }
                    ]
                ) {
                name: String!
                scores: [Int]
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        expect(() => generateModel(document)).toThrowWithMessage(
            Neo4jGraphQLSchemaValidationError,
            "hocuspocus is not supported on String fields"
        );
    });

    test("node.scores.and.includes.and operator cannot be used here", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: {
                                node: { scores: { AND: [{ includes: { NOT: { equals: 1 } } }, { equals: [2, 3] }] } }
                            }
                        }
                    ]
                ) {
                name: String!
                scores: [Int]
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        expect(() => generateModel(document)).toThrowWithMessage(
            Neo4jGraphQLSchemaValidationError,
            "unexpected type for includes"
        );
    });
});
