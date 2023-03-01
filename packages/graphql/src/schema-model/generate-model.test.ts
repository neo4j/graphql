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

import { gql } from "apollo-server";
import { getDocument } from "../schema/get-document";
import type { AuthorizationAnnotation } from "./annotation/AuthorizationAnnotation";
import { generateModel } from "./generate-model";
import type { Neo4jGraphQLSchemaModel } from "./Neo4jGraphQLSchemaModel";

describe("ConcreteEntity generation", () => {
    let schemaModel: Neo4jGraphQLSchemaModel;

    beforeAll(() => {
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

            extend type User {
                password: String! @authorization(filter: [{ where: { node: { id: { equals: "$jwt.sub" } } } }])
            }
        `;

        const document = getDocument(typeDefs);
        schemaModel = generateModel(document);
    });

    test("creates the concrete entity", () => {
        expect(schemaModel.concreteEntities).toHaveLength(1);
    });

    test("concrete entity has correct attributes", () => {
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        expect(userEntity?.attributes.has("id")).toBeTrue();
        expect(userEntity?.attributes.has("name")).toBeTrue();
        expect(userEntity?.attributes.has("password")).toBeTrue();
    });

    test("creates the authorization annotation on password field", () => {
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        expect(userEntity?.attributes.get("password")?.annotations).toHaveLength(1);
        const authAnnotation = userEntity?.attributes
            .get("password")
            ?.annotations.find((a) => a.name === "AUTHORIZATION");
        expect(authAnnotation).toBeDefined();
    });

    test("creates the authorization annotation on User entity", () => {
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        expect(userEntity?.annotations.get("AUTHORIZATION")).toBeDefined();
    });

    test("authorization annotation is correct on User entity", () => {
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        const authAnnotation = userEntity?.annotations.get("AUTHORIZATION") as AuthorizationAnnotation;
        expect(authAnnotation.filter).toBeUndefined();
        expect(authAnnotation.validatePost).toHaveLength(1);
        expect(authAnnotation.validatePre).toHaveLength(1);
    });
});

describe("@authorization directive validation", () => {
    test("validate pre not array", () => {
        const typeDefs = gql`
            type User @authorization(validate: { pre: { where: { node: { id: { equals: "$jwt.sub" } } } } }) {
                id: ID!
                name: String!
            }
        `;

        const document = getDocument(typeDefs);
        expect(() => generateModel(document)).toThrow();
    });

    test("validate pre and post, pre not array", () => {
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

        const document = getDocument(typeDefs);
        expect(() => generateModel(document)).toThrow();
    });

    test("validate pre and post correct", () => {
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

        const document = getDocument(typeDefs);
        expect(() => generateModel(document)).not.toThrow();
    });

    test("validate should be of type object", () => {
        const typeDefs = gql`
            type User @authorization(validate: [{ where: { node: { id: { equals: "$jwt.sub" } } } }]) {
                id: ID!
                name: String!
            }
        `;

        const document = getDocument(typeDefs);
        expect(() => generateModel(document)).toThrow();
    });

    test("filter should be of type object", () => {
        const typeDefs = gql`
            type User @authorization(filter: { where: { node: { id: { equals: "$jwt.sub" } } } }) {
                id: ID!
                name: String!
            }
        `;

        const document = getDocument(typeDefs);
        expect(() => generateModel(document)).toThrow();
    });

    test("incorrect directive argument", () => {
        const typeDefs = gql`
            type User @authorization(banana: { where: { node: { id: { equals: "$jwt.sub" } } } }) {
                id: ID!
                name: String!
            }
        `;

        const document = getDocument(typeDefs);
        expect(() => generateModel(document)).toThrow();
    });

    test("validate without correct arguments", () => {
        const typeDefs = gql`
            type User @authorization(validate: { banana: [{ where: { node: { id: { equals: "$jwt.sub" } } } }] }) {
                id: ID!
                name: String!
            }
        `;

        const document = getDocument(typeDefs);
        expect(() => generateModel(document)).toThrow();
    });

    test("validate without correct arguments where (2)", () => {
        const typeDefs = gql`
            type User @authorization(validate: { pre: [{ where: { node: { banana: { equals: "$jwt.sub" } } } }] }) {
                id: ID!
                name: String!
            }
        `;

        const document = getDocument(typeDefs);
        expect(() => generateModel(document)).toThrow();
    });

    test("validate without correct arguments where (3)", () => {
        const typeDefs = gql`
            type User @authorization(validate: { pre: [{ where: { node: { id: { thisIsNotRight: "$jwt.sub" } } } }] }) {
                id: ID!
                athh: String
            }
        `;

        const document = getDocument(typeDefs);
        expect(() => generateModel(document)).toThrow();
    });

    test("validate without correct arguments where (4)", () => {
        const typeDefs = gql`
            type User @authorization(validate: { pre: [{ where: { node: { id: { thisIsNotRight: "$jwt.sub" } } } }] }) {
                id: ID!
                name: String!
            }
        `;

        const document = getDocument(typeDefs);
        expect(() => generateModel(document)).toThrow();
    });

    // correct arguments

    test("validate correct arguments", () => {
        const typeDefs = gql`
            type User @authorization(validate: { pre: [{ where: { node: { id: { equals: "valid-string" } } } }] }) {
                id: ID!
                name: String!
            }
        `;

        const document = getDocument(typeDefs);
        expect(() => generateModel(document)).not.toThrow();
    });

    // wrong operations

    describe("validate incorrect operations", () => {
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

            const document = getDocument(typeDefs);
            expect(() => generateModel(document)).toThrow();
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

            const document = getDocument(typeDefs);
            expect(() => generateModel(document)).not.toThrow();
        });
    });

    describe("requireAuthentication", () => {
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

            const document = getDocument(typeDefs);
            expect(() => generateModel(document)).toThrow();
        });

        test("should not throw if undefined", () => {
            const typeDefs = gql`
                type User @authorization(filter: [{ where: { node: { id: { equals: "valid-string" } } } }]) {
                    id: ID!
                    name: String!
                }
            `;

            const document = getDocument(typeDefs);
            expect(() => generateModel(document)).not.toThrow();
        });
    });
});

/// me

describe("simone suite", () => {
    // test("1", () => {
    //     const typeDefs = gql`
    //         type User
    //             @authorization(
    //                 filter: [{ requireAuthentication: true, where: { node: { name: { equals: "1" } } } }]
    //             ) {
    //             name: String!
    //         }

    //     `;

    //     const document = getDocument(typeDefs);
    //     expect(generateModel(document)).toBeDefined();

    // });

    test.only("node.and ok", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { AND: [{ name: { equals: "1" } }, { bananas: { includes: 1 } }] } }
                        }
                    ]
                ) {
                name: String!
                bananas: [Int]
            }
        `;

        const document = getDocument(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.name.and ok", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { name: { AND: [{ equals: "12" }, { "contains": "2" }] } } }
                        }
                    ]
                ) {
                name: String!
                bananas: [Int]
            }
        `;

        const document = getDocument(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.name.and.not ok", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { name: { AND: [{ equals: "12" }, { "contains": "2" }, { NOT: { startsWith: "3" } }] } } }
                        }
                    ]
                ) {
                name: String!
                bananas: [Int]
            }
        `;

        const document = getDocument(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.bananas.and ok", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { bananas: { AND: [{ includes: 1 }, { equals: [2, 3] }] } } }
                        }
                    ]
                ) {
                name: String!
                bananas: [Int]
            }
        `;

        const document = getDocument(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.bananas.and.and ok", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: {
                                node: {
                                    bananas: {
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
                bananas: [Int]
            }
        `;

        const document = getDocument(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.bananas.and cannot be combined", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { bananas: { AND: [{ includes: 1 }, { equals: [2, 3] }], includes: 42 } } }
                        }
                    ]
                ) {
                name: String!
                bananas: [Int]
            }
        `;

        const document = getDocument(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.name.hocuspocus operator does not exist", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { name: { hocuspocus: [{ equals: "12" }, { "contains": "2" }] } } }
                        }
                    ]
                ) {
                name: String!
                bananas: [Int]
            }
        `;

        const document = getDocument(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });

    test("node.bananas.and.includes.and operator cannot be used here", () => {
        const typeDefs = gql`
            type User
                @authorization(
                    filter: [
                        {
                            requireAuthentication: true
                            where: { node: { bananas: { AND: [{ includes: { NOT: { 1 } } }, { equals: [2, 3] }] } } }
                        }
                    ]
                ) {
                name: String!
                bananas: [Int]
            }
        `;

        const document = getDocument(typeDefs);
        expect(generateModel(document)).toBeDefined();
    });
});
