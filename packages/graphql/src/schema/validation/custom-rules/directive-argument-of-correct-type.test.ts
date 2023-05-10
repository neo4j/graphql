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
import { gql } from "graphql-tag";
import { validateSDL } from "../validate-sdl";
import { DirectiveArgumentOfCorrectType } from "./directive-argument-of-correct-type";

describe("DirectiveArgumentOfCorrectType", () => {
    describe("for Scalar", () => {
        describe("for Int", () => {
            test("should returns no errors for valid Int", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: Int) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: 1) {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(0);
            });

            test("should returns errors for invalid Int (Enum)", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: Int) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: CREATE) {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(1);
                expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                    `"Invalid argument: testValue, error: Int cannot represent non-integer value: \\"CREATE\\""`
                );
            });

            test("should returns errors for invalid Int (Float)", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: Int) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: 1.2) {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(1);
                expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                    `"Invalid argument: testValue, error: Int cannot represent non-integer value: 1.2"`
                );
            });
        });

        describe("for Float", () => {
            test("should returns no errors for valid Float", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: Float) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: 1.2) {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(0);
            });

            test("should returns errors for invalid Float (String)", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: Float) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: "2.2") {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(1);
                expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                    `"Invalid argument: testValue, error: Float cannot represent non numeric value: \\"2.2\\""`
                );
            });

            test("should returns errors for invalid Float (Enum)", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: Float) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: CREATE) {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(1);
                expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                    `"Invalid argument: testValue, error: Float cannot represent non numeric value: \\"CREATE\\""`
                );
            });
        });

        describe("for String", () => {
            test("should returns no errors for valid String", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: String) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: "seems a string to me") {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(0);
            });

            test("should returns errors for invalid String (Int)", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: String) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: 1) {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(1);
                expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                    `"Invalid argument: testValue, error: String cannot represent a non string value: 1"`
                );
            });

            test("should returns errors for invalid String (Float)", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: String) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: 1.2) {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(1);
                expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                    `"Invalid argument: testValue, error: String cannot represent a non string value: 1.2"`
                );
            });
        });

        describe("for Boolean", () => {
            test("should returns no errors for valid Boolean", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: Boolean) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: true) {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(0);
            });

            test("should returns errors for invalid Boolean (Int)", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: Boolean) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: 1) {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(1);
                expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                    `"Invalid argument: testValue, error: Boolean cannot represent a non boolean value: 1"`
                );
            });

            test("should returns errors for invalid Boolean (String)", () => {
                const userDocument = gql`
                    directive @WonderfulAuthorization(testValue: Boolean) on OBJECT | FIELD_DEFINITION | INTERFACE

                    type User @WonderfulAuthorization(testValue: "string") {
                        id: ID!
                        name: String!
                    }
                `;
                const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
                expect(errors).toBeInstanceOf(Array);
                expect(errors).toHaveLength(1);
                expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                    `"Invalid argument: testValue, error: Boolean cannot represent a non boolean value: \\"string\\""`
                );
            });
        });
    });

    describe("for Enum", () => {
        test("should returns no errors for valid Enums", () => {
            const userDocument = gql`
                enum WonderfulKind {
                    WONDERFUL
                    INCREDIBLE
                }

                directive @WonderfulAuthorization(testValue: WonderfulKind) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: WONDERFUL) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(0);
        });

        test("should returns errors for invalid Enums", () => {
            const userDocument = gql`
                enum WonderfulKind {
                    WONDERFUL
                    INCREDIBLE
                }

                directive @WonderfulAuthorization(testValue: WonderfulKind) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: CREATE) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(1);
            expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                `"Invalid argument: testValue, error: Value \\"CREATE\\" does not exist in \\"WonderfulKind\\" enum."`
            );
        });
    });

    describe("for List", () => {
        test("should returns no errors for valid Enum List", () => {
            const userDocument = gql`
                enum WonderfulKind {
                    WONDERFUL
                    INCREDIBLE
                }

                directive @WonderfulAuthorization(testValue: [WonderfulKind]) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: WONDERFUL) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(0);
        });

        test("should returns no errors for valid Int List", () => {
            const userDocument = gql`
                enum WonderfulKind {
                    WONDERFUL
                    INCREDIBLE
                }

                directive @WonderfulAuthorization(testValue: [Int]) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: [1, 2, 3]) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(0);
        });

        test("should returns errors for invalid Enum List", () => {
            const userDocument = gql`
                enum WonderfulKind {
                    WONDERFUL
                    INCREDIBLE
                }

                directive @WonderfulAuthorization(testValue: [WonderfulKind]) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: [CREATE]) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(1);
            expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                `"Invalid argument: testValue, error: Value \\"CREATE\\" does not exist in \\"WonderfulKind\\" enum."`
            );
        });

        test("should returns errors for invalid Int List", () => {
            const userDocument = gql`
                directive @WonderfulAuthorization(testValue: [Int]) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: [1.2, 1.3]) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(1);
            expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                `"Invalid argument: testValue, error: Int cannot represent non-integer value: 1.3"`
            );
        });
    });

    describe("for Input", () => {
        test("should returns no errors for valid Input", () => {
            const userDocument = gql`
                input NestedWonderfulInput {
                    count: Int
                }

                input WonderfulInput {
                    name: String
                    nested: NestedWonderfulInput
                }

                directive @WonderfulAuthorization(testValue: WonderfulInput) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: { name: "Simone" }) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(0);
        });

        test("should returns no errors for valid Input, nested value", () => {
            const userDocument = gql`
                input NestedWonderfulInput {
                    count: Int
                }

                input WonderfulInput {
                    name: String
                    nested: NestedWonderfulInput
                }

                directive @WonderfulAuthorization(testValue: WonderfulInput) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: { name: "Simone", nested: { count: 1 } }) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(0);
        });

        test("should returns errors for invalid Input", () => {
            const userDocument = gql`
                input NestedWonderfulInput {
                    count: Int
                }

                input WonderfulInput {
                    name: String
                    nested: NestedWonderfulInput
                }

                directive @WonderfulAuthorization(testValue: WonderfulInput) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: { name: 1 }) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(1);
            expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                `"Invalid argument: testValue, error: String cannot represent a non string value: 1"`
            );
        });

        test("should returns errors for invalid Input, nested value (Float)->(Int)", () => {
            const userDocument = gql`
                input NestedWonderfulInput {
                    count: Int
                }

                input WonderfulInput {
                    name: String
                    nested: NestedWonderfulInput
                }

                directive @WonderfulAuthorization(testValue: WonderfulInput) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: { name: "Simone", nested: { count: 1.3 } }) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(1);
            expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                `"Invalid argument: testValue, error: Int cannot represent non-integer value: 1.3"`
            );
        });

        test("should returns errors for invalid Input, nested value (Input)->(Int)", () => {
            const userDocument = gql`
                input NestedWonderfulInput {
                    count: Int
                }

                input WonderfulInput {
                    name: String
                    nested: NestedWonderfulInput
                }

                directive @WonderfulAuthorization(testValue: WonderfulInput) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: { name: "Simone", nested: 1 }) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(1);
            expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                `"Invalid argument: testValue, error: Expected type \\"NestedWonderfulInput\\" to be an object."`
            );
        });

        test("should returns errors for invalid Input, no required fields", () => {
            const userDocument = gql`
                input NestedWonderfulInput {
                    count: Int
                }

                input WonderfulInput {
                    name: String
                    nested: NestedWonderfulInput!
                }

                directive @WonderfulAuthorization(testValue: WonderfulInput) on OBJECT | FIELD_DEFINITION | INTERFACE

                type User @WonderfulAuthorization(testValue: { name: "Simone" }) {
                    id: ID!
                    name: String!
                }
            `;
            const errors = validateSDL(userDocument, [DirectiveArgumentOfCorrectType]);
            expect(errors).toBeInstanceOf(Array);
            expect(errors).toHaveLength(1);
            expect((errors[0] as GraphQLError).message).toMatchInlineSnapshot(
                `"Invalid argument: testValue, error: Field \\"nested\\" of required type \\"NestedWonderfulInput!\\" was not provided."`
            );
        });
    });
});
