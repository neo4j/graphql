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

import { gql } from "graphql-tag";
import type { ASTNode, ASTVisitor, FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { parse, GraphQLError } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { Subgraph } from "../../classes/Subgraph";
import makeAugmentedSchema from "../make-augmented-schema";
import { validateUserDefinition } from "./schema-validation";
import { getError, NoErrorThrownError } from "../../../tests/utils/get-error";

describe("schema validation", () => {
    describe("JWT", () => {
        // TODO: authentication
        describe("JWT Payload", () => {
            test("should not returns errors when is correctly used", () => {
                const jwtType = `
                    type MyJWT  @jwt {
                        myClaim: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authorization(filter: [{ where: { jwt: { myClaim: "something" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwt });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when is correctly used together with node", () => {
                const jwtType = `
                    type MyJWT  @jwt {
                        myClaim: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User
                        @authorization(filter: [{ where: { jwt: { myClaim: "something" }, node: { name: "John" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwt });
                expect(executeValidate).not.toThrow();
            });

            test("should return errors when jwt field is not found", () => {
                const jwtType = `
                    type MyJWT  @jwt {
                        myClaim: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authorization(filter: [{ where: { jwt: { thisClaimDoesNotExist: "something" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Invalid argument: filter, error: Field "thisClaimDoesNotExist" is not defined by type.'
                );
                expect(errors[0]).toHaveProperty("path", [
                    "User",
                    "@authorization",
                    "filter",
                    0,
                    "where",
                    "jwtPayload",
                ]);
            });

            test("should not return errors when jwt field is standard", () => {
                const jwtType = `
                    type MyJWT  @jwt {
                        myClaim: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authorization(filter: [{ where: { jwt: { iss: "something" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwt });
                expect(executeValidate).not.toThrow();
            });

            test("should return errors when jwt field is inside node filter", () => {
                const jwtType = `
                    type MyJWT  @jwt {
                        myClaim: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authorization(filter: [{ where: { node: { myClaim: "something" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Invalid argument: filter, error: Field "myClaim" is not defined by type.'
                );
                expect(errors[0]).toHaveProperty("path", ["User", "@authorization", "filter", 0, "where", "node"]);
            });
        });

        test("should not returns errors when is correctly used with claims path", () => {
            const jwtType = `
                type MyJWT  @jwt {
                    myClaim: String 
                    groups: [String!]! @jwtClaim(path: "applications[0].groups")
                }
            `;
            const userDocument = gql`
                ${jwtType}
                type User @authorization(filter: [{ where: { jwt: { groups_INCLUDES: "something" } } }]) {
                    id: ID!
                    name: String!
                }
            `;
            const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwt });
            expect(executeValidate).not.toThrow();
        });

        describe("JWT wildcard", () => {
            test("should not returns errors when is correctly used: Int on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwt {
                        intClaim: Int
                    }
                `;
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { testInt: "$jwt.intClaim" } } }]) {
                        id: ID!
                        name: String!
                        testInt: Int
                    }
                `;

                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwt });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when is correctly used: standard field sub on OBJECT", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { testStr: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                        testStr: String
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when is correctly used: List[Int] on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwt {
                        intClaim: [Int]
                    }
                `;
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { testInt: "$jwt.intClaim" } } }]) {
                        id: ID!
                        name: String!
                        testInt: [Int]
                    }
                `;

                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwt });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when is correctly used: Boolean on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwt {
                        boolClaim: Boolean
                    }
                `;
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { testBool: "$jwt.boolClaim" } } }]) {
                        id: ID!
                        name: String!
                        testBool: Boolean
                    }
                `;

                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwt });
                expect(executeValidate).not.toThrow();
            });

            test("should return error when types do not match: standard field sub on OBJECT", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { testInt: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                        testInt: Int
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    "Invalid argument: filter, error: Int cannot represent non-integer value."
                );
                expect(errors[0]).toHaveProperty("path", [
                    "User",
                    "@authorization",
                    "filter",
                    0,
                    "where",
                    "node",
                    "testInt",
                ]);
            });

            test("should return error when types do not match: Int compared with List[Int] on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwt {
                        intClaim: [Int]
                    }
                `;
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { testInts: "$jwt.intClaim" } } }]) {
                        id: ID!
                        name: String!
                        testInts: Int
                    }
                `;

                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    "Invalid argument: filter, error: Int cannot represent non-integer value."
                );
                expect(errors[0]).toHaveProperty("path", [
                    "User",
                    "@authorization",
                    "filter",
                    0,
                    "where",
                    "node",
                    "testInts",
                ]);
            });

            test("should return error when types do not match: Int compared with String on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwt {
                        stringClaim: String
                    }
                `;
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { testInt: "$jwt.stringClaim" } } }]) {
                        id: ID!
                        name: String!
                        testInt: Int
                    }
                `;

                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    "Invalid argument: filter, error: Int cannot represent non-integer value."
                );
                expect(errors[0]).toHaveProperty("path", [
                    "User",
                    "@authorization",
                    "filter",
                    0,
                    "where",
                    "node",
                    "testInt",
                ]);
            });

            test("should return error when types do not match: Int compared with String on FIELD", () => {
                const jwtType = `
                    type JWTPayload @jwt {
                        sub: String
                    }
                `;
                const userDocument = gql`
                    type User {
                        id: ID! @authorization(filter: [{ where: { node: { testInt: "$jwt.sub" } } }])
                        name: String!
                        testInt: Int
                    }
                `;

                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    "Invalid argument: filter, error: Int cannot represent non-integer value."
                );
                expect(errors[0]).toHaveProperty("path", [
                    "User",
                    "id",
                    "@authorization",
                    "filter",
                    0,
                    "where",
                    "node",
                    "testInt",
                ]);
            });

            test("should return error when types do not match: String compared with Int on FIELD", () => {
                const jwtType = `
                    type JWTPayload @jwt {
                        intClaim: Int
                    }
                `;
                const userDocument = gql`
                    type User {
                        id: ID! @authorization(filter: [{ where: { node: { testStr: "$jwt.intClaim" } } }])
                        name: String!
                        testStr: String
                    }
                `;

                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    "Invalid argument: filter, error: String cannot represent a non string value."
                );
                expect(errors[0]).toHaveProperty("path", [
                    "User",
                    "id",
                    "@authorization",
                    "filter",
                    0,
                    "where",
                    "node",
                    "testStr",
                ]);
            });

            test("should return error when types do not match: String compared with Int on FIELD with claim", () => {
                const jwtType = `
                    type JWTPayload @jwt {
                        intClaim: Int @jwtClaim(path: "this.is.a.path")
                    }
                `;
                const userDocument = gql`
                    type User {
                        id: ID! @authorization(filter: [{ where: { node: { testStr: "$jwt.intClaim" } } }])
                        name: String!
                        testStr: String
                    }
                `;

                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    "Invalid argument: filter, error: String cannot represent a non string value."
                );
                expect(errors[0]).toHaveProperty("path", [
                    "User",
                    "id",
                    "@authorization",
                    "filter",
                    0,
                    "where",
                    "node",
                    "testStr",
                ]);
            });

            test("should return error when types do not match: String compared with Boolean on FIELD", () => {
                const jwtType = `
                    type JWTPayload @jwt {
                        boolClaim: Boolean
                    }
                `;
                const userDocument = gql`
                    type User {
                        id: ID! @authorization(filter: [{ where: { node: { testStr: "$jwt.boolClaim" } } }])
                        name: String!
                        testStr: String
                    }
                `;

                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    "Invalid argument: filter, error: String cannot represent a non string value."
                );
                expect(errors[0]).toHaveProperty("path", [
                    "User",
                    "id",
                    "@authorization",
                    "filter",
                    0,
                    "where",
                    "node",
                    "testStr",
                ]);
            });

            test("should return error when types do not match: Boolean compared with String on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwt {
                        stringClaim: String
                    }
                `;
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { testBool: "$jwt.stringClaim" } } }]) {
                        id: ID!
                        name: String!
                        testBool: Boolean
                    }
                `;

                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    "Invalid argument: filter, error: Boolean cannot represent a non boolean value."
                );
                expect(errors[0]).toHaveProperty("path", [
                    "User",
                    "@authorization",
                    "filter",
                    0,
                    "where",
                    "node",
                    "testBool",
                ]);
            });

            test("should return error when types do not match: Boolean compared with Int on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwt {
                        intClaim: Int
                    }
                `;
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { testBool: "$jwt.intClaim" } } }]) {
                        id: ID!
                        name: String!
                        testBool: Boolean
                    }
                `;

                const jwt = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    "Invalid argument: filter, error: Boolean cannot represent a non boolean value."
                );
                expect(errors[0]).toHaveProperty("path", [
                    "User",
                    "@authorization",
                    "filter",
                    0,
                    "where",
                    "node",
                    "testBool",
                ]);
            });
        });
    });

    describe("@authorization", () => {
        describe("on OBJECT", () => {
            test("should not returns errors when is correctly used", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when is correctly used, with specifiedDirective", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String! @deprecated(reason: "name is deprecated")
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when used correctly in several place", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name", () => {
                const userDocument = gql`
                    type User @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongFilter" on directive "@authorization". Did you mean "filter"?'
                );
            });

            test("should validate operations value", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ operations: [NEVER], where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Invalid argument: filter, error: Value "NEVER" does not exist in enum.'
                );
                expect(errors[0]).toHaveProperty("path", ["User", "@authorization", "filter", 0, "operations", 0]);
            });

            test("validation should works when used with other directives", () => {
                const userDocument = gql`
                    type User
                        @plural(value: "Users")
                        @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name, when used with other directives", () => {
                const userDocument = gql`
                    type User
                        @plural(value: "Users")
                        @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongFilter" on directive "@authorization". Did you mean "filter"?'
                );
            });
        });

        describe("on FIELD", () => {
            test("should not returns errors with a correct usage", () => {
                const userDocument = gql`
                    type User {
                        id: ID! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name", () => {
                const userDocument = gql`
                    type User {
                        id: ID! @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }])
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongFilter" on directive "@authorization". Did you mean "filter"?'
                );
                expect(errors[0]).toHaveProperty("path", ["User", "id", "@authorization", "validate", 0, "when", 0]);
            });

            test("should validate when value", () => {
                const userDocument = gql`
                    type User {
                        id: ID! @authorization(validate: [{ when: [NEVER], where: { node: { id: "$jwt.sub" } } }])
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Invalid argument: validate, error: Value "NEVER" does not exist in enum. Did you mean the enum value "AFTER"?'
                );
                expect(errors[0]).toHaveProperty("path", ["User", "id", "@authorization", "validate", 0, "when", 0]);
            });

            test("validation should works when used with other directives", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                        posts: [Post!]!
                            @relationship(type: "HAS_POSTS", direction: IN)
                            @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    }

                    type Post {
                        id: ID!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name, when used with other directives", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                        posts: [Post!]!
                            @relationship(type: "HAS_POSTS", direction: IN)
                            @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }])
                    }

                    type Post {
                        id: ID!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongFilter" on directive "@authorization". Did you mean "filter"?'
                );
            });
        });

        describe("on INTERFACE", () => {
            test("should error", () => {
                const userDocument = gql`
                    type User implements Member {
                        id: ID!
                        name: String!
                    }

                    interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                    }

                    type Post {
                        author: Member @relationship(type: "HAS_AUTHOR", direction: IN)
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty("message", 'Directive "@authorization" may not be used on INTERFACE.');
            });
        });

        describe("on OBJECT_EXTENSION", () => {
            test("should not returns errors when is correctly used", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                    }
                    extend type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should returns errors when used correctly in both type and extension", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }
                    extend type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'The directive "@authorization" can only be used once at this location.'
                );
            });

            test("should returns errors when used correctly in both a type field and an extension for the same field", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }
                    extend type User {
                        name: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'The directive "@authorization" can only be used once at this location.'
                );
            });

            test("should not returns errors when used correctly in both type and an extension field", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }
                    extend type User {
                        name: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when used correctly in multiple extension fields", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }
                    extend type User {
                        id: ID! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                        name: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when used correctly in different type and field across several extensions", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }

                    extend type User {
                        name: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    }

                    extend type User {
                        id: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should returns errors when used correctly in more than one extension", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }
                    extend type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    extend type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'The directive "@authorization" can only be used once at this location.'
                );
            });

            test("should validate directive argument name", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                    }
                    extend type User @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }])
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongFilter" on directive "@authorization". Did you mean "filter"?'
                );
            });

            test("validation should works when used with other directives", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                    }
                    extend type User
                        @plural(value: "Users")
                        @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name, when used with other directives", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                    }
                    extend type User
                        @plural(value: "Users")
                        @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }])
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongFilter" on directive "@authorization". Did you mean "filter"?'
                );
            });
        });

        describe("on INTERFACE_EXTENSION", () => {
            test("should error", () => {
                const userDocument = gql`
                    type User implements Member {
                        id: ID!
                        name: String!
                    }

                    interface Member {
                        id: ID!
                    }
                    extend interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])

                    type Post {
                        author: Member @relationship(type: "HAS_AUTHOR", direction: IN)
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty("message", 'Directive "@authorization" may not be used on INTERFACE.');
            });
        });

        describe("mixed usage", () => {
            test("should not returns errors when used correctly in several place", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                        author: User!
                            @relationship(type: "HAS_AUTHOR", direction: IN)
                            @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    }

                    type Document implements File {
                        name: String
                        length: Int
                    }

                    interface File {
                        name: String
                    }

                    extend type Document @authorization(filter: [{ where: { node: { name: "$jwt.sub" } } }])
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });
            test("should returns errors when incorrectly used in several place", () => {
                const userDocument = gql`
                    type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String! @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }])
                        author: User!
                            @relationship(type: "HAS_AUTHOR", direction: IN)
                            @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    }

                    type Document implements File {
                        name: String
                        length: Int
                    }

                    interface File {
                        name: String
                    }

                    extend type Document @authorization(filter: [{ where: { node: { name: "$jwt.sub" } } }])
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongFilter" on directive "@authorization". Did you mean "filter"?'
                );
            });
        });

        describe("with federated schema", () => {
            test("should not returns errors when is correctly used", () => {
                const userDocument = gql`
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    type User @shareable @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                    });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when is correctly used, with specifiedDirective", () => {
                const userDocument = gql`
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    type User @shareable @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String! @deprecated(reason: "name is deprecated")
                    }

                    type Post {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                    });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when used correctly in several place", () => {
                const userDocument = gql`
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    type User @shareable @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post @authorization(filter: [{ where: { node: { content: "$jwt.sub" } } }]) {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                    });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name", () => {
                const userDocument = gql`
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    type User @shareable @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                    });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongFilter" on directive "@authorization". Did you mean "filter"?'
                );
            });

            test("validation should works when used with other directives", () => {
                const userDocument = gql`
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    type User
                        @plural(value: "Users")
                        @shareable
                        @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                    });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name, when used with other directives", () => {
                const userDocument = gql`
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    type User
                        @plural(value: "Users")
                        @shareable
                        @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                    });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongFilter" on directive "@authorization". Did you mean "filter"?'
                );
            });
        });
    });

    describe("@authentication", () => {
        describe("on OBJECT", () => {
            test("should not returns errors when is correctly used", () => {
                const userDocument = gql`
                    type User @authentication {
                        id: ID!
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when is correctly used, with arguments", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String! @deprecated(reason: "name is deprecated")
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when used correctly in several place", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name", () => {
                const userDocument = gql`
                    type User @authentication(ops: [CREATE]) {
                        id: ID!
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty("message", 'Unknown argument "ops" on directive "@authentication".');
            });

            // TODO: custom rule
            test("should validate operations value", () => {
                const userDocument = gql`
                    type User @authentication(operations: [NEVER]) {
                        id: ID!
                        name: String!
                    }
                `;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Invalid argument: operations, error: Value "NEVER" does not exist in enum.'
                );
                expect(errors[0]).toHaveProperty("path", ["User", "@authentication", "operations", 0]);
            });

            test("validation should works when used with other directives", () => {
                const jwtType = `
                    type MyJWT  @jwtPayload {
                        sub: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User
                        @plural(value: "Users")
                        @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name, when used with other directives", () => {
                const jwtType = `
                    type MyJWT  @jwtPayload {
                        sub: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User @plural(value: "Users") @authentication(jwtWrongField: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "jwtWrongField" on directive "@authentication".'
                );
            });
        });

        describe("on FIELD", () => {
            test("should not returns errors with a correct usage", () => {
                const userDocument = gql`
                    type User {
                        id: ID! @authentication
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name", () => {
                const userDocument = gql`
                    type User {
                        id: ID! @authentication(ops: [CREATE])
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty("message", 'Unknown argument "ops" on directive "@authentication".');
            });

            test("should validate enum field value", () => {
                const userDocument = gql`
                    type User @authentication(operations: [NEVER]) {
                        id: ID!
                        name: String!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Invalid argument: operations, error: Value "NEVER" does not exist in enum.'
                );
                expect(errors[0]).toHaveProperty("path", ["User", "@authentication", "operations", 0]);
            });

            test("validation should works when used with other directives", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                        posts: [Post!]!
                            @relationship(type: "HAS_POSTS", direction: IN)
                            @authentication(operations: [CREATE])
                    }

                    type Post {
                        id: ID!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name, when used with other directives", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                        posts: [Post!]!
                            @relationship(type: "HAS_POSTS", direction: IN)
                            @authentication(wrongFieldName: { sub: "test" })
                    }

                    type Post {
                        id: ID!
                    }
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongFieldName" on directive "@authentication".'
                );
            });
        });

        describe("on INTERFACE", () => {
            test("should error", () => {
                const jwtType = `
                    type MyJWT  @jwtPayload {
                        myClaim: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User implements Member {
                        id: ID!
                        name: String!
                    }

                    interface Member @authentication(operations: [CREATE], jwtPayload: { myClaim: "test" }) {
                        id: ID!
                    }

                    type Post {
                        author: Member @relationship(type: "HAS_AUTHOR", direction: IN)
                    }
                `;

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Directive "@authentication" may not be used on INTERFACE.'
                );
            });
        });

        describe("on OBJECT_EXTENSION", () => {
            test("should not returns errors when is correctly used", () => {
                const jwtType = `
                    type MyJWT  @jwtPayload {
                        sub: String
                    }
                `;

                const userDocument = gql`
                    ${jwtType}
                    type User {
                        id: ID!
                        name: String!
                    }
                    extend type User @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should returns errors when used correctly in both type and extension", () => {
                const jwtType = `
                    type MyJWT  @jwtPayload {
                        sub: String
                    }
                `;

                const userDocument = gql`
                    ${jwtType}
                    type User @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }
                    extend type User @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                `;

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'The directive "@authentication" can only be used once at this location.'
                );
            });

            test("should returns errors when used correctly in both a type field and an extension for the same field", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    type User {
                        id: ID!
                        name: String! @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }
                    extend type User {
                        name: String! @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                    }
                `;

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'The directive "@authentication" can only be used once at this location.'
                );
            });

            test("should not returns errors when used correctly in both type and an extension field", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }
                    extend type User {
                        name: String! @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                    }
                `;

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when used correctly in multiple extension fields", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }
                    extend type User {
                        id: ID! @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                        name: String! @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                    }
                `;

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when used correctly in different type and field across several extensions", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }

                    extend type User {
                        name: String! @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                    }

                    extend type User {
                        id: String! @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                    }
                `;

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should returns errors when used correctly in more than one extension", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                    }

                    type Post {
                        id: ID!
                        name: String!
                    }
                    extend type User @authentication(operations: [CREATE])
                    extend type User @authentication(operations: [CREATE])
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'The directive "@authentication" can only be used once at this location.'
                );
            });

            test("should validate directive argument name", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                    }
                    extend type User @authentication(ops: [CREATE])
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty("message", 'Unknown argument "ops" on directive "@authentication".');
            });

            test("validation should works when used with other directives", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    type User {
                        id: ID!
                        name: String!
                    }
                    extend type User
                        @plural(value: "Users")
                        @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name, when used with other directives", () => {
                const userDocument = gql`
                    type User {
                        id: ID!
                        name: String!
                    }
                    extend type User @plural(value: "Users") @authentication(wrongField: { sub: "test" })
                `;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongField" on directive "@authentication".'
                );
            });
        });

        describe("on INTERFACE_EXTENSION", () => {
            test("should error", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    type User implements Member {
                        id: ID!
                        name: String!
                    }

                    interface Member {
                        id: ID!
                    }
                    extend interface Member @authentication(operations: [CREATE], jwtPayload: { sub: "test" })

                    type Post {
                        author: Member @relationship(type: "HAS_AUTHOR", direction: IN)
                    }
                `;

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Directive "@authentication" may not be used on INTERFACE.'
                );
            });
        });

        describe("mixed usage", () => {
            test("should not returns errors when used correctly in several place", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String! @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                        author: User!
                            @relationship(type: "HAS_AUTHOR", direction: IN)
                            @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                    }

                    type Document implements File {
                        name: String
                        length: Int
                    }

                    interface File {
                        name: String
                    }

                    extend type Document @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                `;

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });
            test("should returns errors when incorrectly used in several place", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String! @authentication(ops: [CREATE], jwtPayload: { sub: "test" })
                        author: User!
                            @relationship(type: "HAS_AUTHOR", direction: IN)
                            @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                    }

                    type Document implements File {
                        name: String
                        length: Int
                    }

                    interface File {
                        name: String
                    }

                    extend type Document @authentication(operations: [CREATE], jwtPayload: { sub: "test" })
                `;

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty("message", 'Unknown argument "ops" on directive "@authentication".');
            });
        });

        describe("with federated schema", () => {
            test("should not returns errors when is correctly used", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    type User @shareable @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                        jwtPayload,
                    });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when is correctly used, with specifiedDirective", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    type User @shareable @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String! @deprecated(reason: "name is deprecated")
                    }

                    type Post {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                        jwtPayload,
                    });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when used correctly in several place", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    type User @shareable @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                        jwtPayload,
                    });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name", () => {
                const userDocument = gql`
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    type User @shareable @authentication(wrongField: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                    });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty(
                    "message",
                    'Unknown argument "wrongField" on directive "@authentication".'
                );
            });

            test("validation should works when used with other directives", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    ${jwtType}
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    type User
                        @plural(value: "Users")
                        @shareable
                        @authentication(operations: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                        jwtPayload,
                    });
                expect(executeValidate).not.toThrow();
            });

            test("should validate directive argument name, when used with other directives", () => {
                const jwtType = `
                type MyJWT  @jwtPayload {
                    sub: String
                }
            `;
                const userDocument = gql`
                    extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                    ${jwtType}
                    type User
                        @plural(value: "Users")
                        @shareable
                        @authentication(ops: [CREATE], jwtPayload: { sub: "test" }) {
                        id: ID!
                        name: String!
                    }

                    type Post {
                        content: String!
                        author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const subgraph = new Subgraph(userDocument);
                const { directives, types } = subgraph.getValidationDefinitions();
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () =>
                    validateUserDefinition({
                        userDocument,
                        augmentedDocument,
                        additionalDirectives: directives,
                        additionalTypes: types,
                        jwtPayload,
                    });

                const errors = getError(executeValidate);
                expect(errors).toHaveLength(1);
                expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                expect(errors[0]).toHaveProperty("message", 'Unknown argument "ops" on directive "@authentication".');
            });
        });
    });

    describe("validate using custom rules", () => {
        test("should not returns errors when is correctly used", () => {
            const userDocument = gql`
                type User {
                    id: ID!
                    name: String!
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () =>
                validateUserDefinition({
                    userDocument,
                    augmentedDocument,
                    additionalDirectives: [],
                    additionalTypes: [],
                    rules: [noKeanuFields],
                });
            expect(executeValidate).not.toThrow();
        });
        test("should returns errors when is not correctly used", () => {
            const userDocument = gql`
                type User {
                    id: ID!
                    keanu: String!
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () =>
                validateUserDefinition({
                    userDocument,
                    augmentedDocument,
                    additionalDirectives: [],
                    additionalTypes: [],
                    rules: [noKeanuFields],
                });
            // 2 errors but returned one by one
            const errors = getError(executeValidate);
            expect(errors).toHaveLength(2);
            expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
            expect(errors[0]).toHaveProperty("message", "Field cannot named keanu");
            expect(errors[1]).not.toBeInstanceOf(NoErrorThrownError);
            expect(errors[1]).toHaveProperty("message", "Field cannot named keanu");
        });
    });

    describe("input validation", () => {
        describe("on OBJECT", () => {
            describe("correct usage", () => {
                test("should not returns errors with a valid @authorization filter argument", () => {
                    const userDocument = gql`
                        type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                            id: ID!
                            name: String!
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    expect(executeValidate).not.toThrow();
                });

                test("should not returns errors with valid @authorization validate argument", () => {
                    const userDocument = gql`
                        type User @authorization(validate: [{ operations: [CREATE] }]) {
                            id: ID!
                            name: String!
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    expect(executeValidate).not.toThrow();
                });

                test("should no returns errors when an @authorization filter has a correct where predicate over a 1 to 1 relationship", () => {
                    const userDocument = gql`
                        type User {
                            id: ID!
                            name: String!
                        }

                        type Post @authorization(filter: [{ where: { node: { author: { name: "Simone" } } } }]) {
                            content: String!
                            author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    expect(executeValidate).not.toThrow();
                });

                test("should no returns errors when an @authorization filter has a correct where predicate over a 1 to N relationship", () => {
                    const userDocument = gql`
                        type User {
                            id: ID!
                            name: String!
                        }

                        type Post @authorization(filter: [{ where: { node: { authors_SOME: { name: "Simone" } } } }]) {
                            content: String!
                            authors: [User!]! @relationship(type: "HAS_AUTHOR", direction: OUT)
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    expect(executeValidate).not.toThrow();
                });
            });

            describe("incorrect usage", () => {
                test("should returns errors when an @authorization filter contains an unknown operation", () => {
                    const userDocument = gql`
                        type User @authorization(filter: [{ seemsNotAWhereToMe: { node: { id: "$jwt.sub" } } }]) {
                            id: ID!
                            name: String!
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    const errors = getError(executeValidate);
                    expect(errors).toHaveLength(1);
                    expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                    expect(errors[0]).toHaveProperty(
                        "message",
                        'Invalid argument: filter, error: Field "seemsNotAWhereToMe" is not defined by type.'
                    );
                    expect(errors[0]).toHaveProperty("path", ["User", "@authorization", "filter", 0]);
                });

                // TODO
                test("should returns errors when an @authorization filter has a wrong where definition", () => {
                    const userDocument = gql`
                        type User @authorization(filter: [{ where: { notANode: { id: "$jwt.sub" } } }]) {
                            id: ID!
                            name: String!
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    const errors = getError(executeValidate);
                    expect(errors).toHaveLength(1);
                    expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                    expect(errors[0]).toHaveProperty(
                        "message",
                        'Invalid argument: filter, error: Field "notANode" is not defined by type. Did you mean "node"?'
                    );
                    expect(errors[0]).toHaveProperty("path", ["User", "@authorization", "filter", 0, "where"]);
                });

                test("should returns errors when an @authorization filter has a wrong where predicate", () => {
                    const userDocument = gql`
                        type User @authorization(filter: [{ where: { node: { notAValidID: "$jwt.sub" } } }]) {
                            id: ID!
                            name: String!
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    const errors = getError(executeValidate);
                    expect(errors).toHaveLength(1);
                    expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                    expect(errors[0]).toHaveProperty(
                        "message",
                        'Invalid argument: filter, error: Field "notAValidID" is not defined by type.'
                    );
                    expect(errors[0]).toHaveProperty("path", ["User", "@authorization", "filter", 0, "where", "node"]);
                });

                test("should returns errors when an @authorization filter has an incorrect where predicate over a 1 to 1 relationship", () => {
                    const userDocument = gql`
                        type User {
                            id: ID!
                            name: String!
                        }

                        type Post @authorization(filter: [{ where: { node: { author: { content: "Simone" } } } }]) {
                            content: String!
                            author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    const errors = getError(executeValidate);
                    expect(errors).toHaveLength(1);
                    expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                    expect(errors[0]).toHaveProperty(
                        "message",
                        'Invalid argument: filter, error: Field "content" is not defined by type.'
                    );
                    expect(errors[0]).toHaveProperty("path", [
                        "Post",
                        "@authorization",
                        "filter",
                        0,
                        "where",
                        "node",
                        "author",
                    ]);
                });

                test("should returns errors when an @authorization filter has an incorrect where predicate over a 1 to N relationship", () => {
                    const userDocument = gql`
                        type User {
                            id: ID!
                            name: String!
                        }

                        type Post
                            @authorization(
                                filter: [{ where: { node: { author_NOT_A_QUANTIFIER: { name: "Simone" } } } }]
                            ) {
                            content: String!
                            authors: [User!]! @relationship(type: "HAS_AUTHOR", direction: OUT)
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    const errors = getError(executeValidate);
                    expect(errors).toHaveLength(1);
                    expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                    expect(errors[0]).toHaveProperty(
                        "message",
                        'Invalid argument: filter, error: Field "author_NOT_A_QUANTIFIER" is not defined by type.'
                    );
                    expect(errors[0]).toHaveProperty("path", ["Post", "@authorization", "filter", 0, "where", "node"]);
                });
            });
        });

        describe("on Field", () => {
            describe("correct usage", () => {
                test("should not returns errors with a valid @authorization filter argument", () => {
                    const userDocument = gql`
                        type User {
                            id: ID! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                            name: String!
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    expect(executeValidate).not.toThrow();
                });

                test("should not returns errors with valid @authorization validate argument", () => {
                    const userDocument = gql`
                        type User {
                            id: ID! @authorization(validate: [{ operations: [CREATE] }])
                            name: String!
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    expect(executeValidate).not.toThrow();
                });

                test("should no returns errors when an @authorization filter has a correct where predicate over a 1 to 1 relationship", () => {
                    const userDocument = gql`
                        type User {
                            id: ID!
                            name: String!
                        }

                        type Post {
                            content: String!
                            author: User!
                                @relationship(type: "HAS_AUTHOR", direction: OUT)
                                @authorization(filter: [{ where: { node: { author: { name: "Simone" } } } }])
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    expect(executeValidate).not.toThrow();
                });

                test("should no returns errors when an @authorization filter has a correct where predicate over a 1 to N relationship", () => {
                    const userDocument = gql`
                        type User {
                            id: ID!
                            name: String!
                        }

                        type Post {
                            content: String!
                            authors: [User!]!
                                @relationship(type: "HAS_AUTHOR", direction: OUT)
                                @authorization(filter: [{ where: { node: { authors_SOME: { name: "Simone" } } } }])
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    expect(executeValidate).not.toThrow();
                });
            });

            describe("incorrect usage", () => {
                test("should returns errors when an @authorization filter contains an unknown operation", () => {
                    const userDocument = gql`
                        type User {
                            id: ID! @authorization(filter: [{ seemsNotAWhereToMe: { node: { id: "$jwt.sub" } } }])
                            name: String!
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    const errors = getError(executeValidate);
                    expect(errors).toHaveLength(1);
                    expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                    expect(errors[0]).toHaveProperty(
                        "message",
                        'Invalid argument: filter, error: Field "seemsNotAWhereToMe" is not defined by type.'
                    );
                    expect(errors[0]).toHaveProperty("path", ["User", "id", "@authorization", "filter", 0]);
                });

                test("should returns errors when an @authorization filter has a wrong where definition", () => {
                    const userDocument = gql`
                        type User {
                            id: ID! @authorization(filter: [{ where: { notANode: { id: "$jwt.sub" } } }])
                            name: String!
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    const errors = getError(executeValidate);
                    expect(errors).toHaveLength(1);
                    expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                    expect(errors[0]).toHaveProperty(
                        "message",
                        'Invalid argument: filter, error: Field "notANode" is not defined by type. Did you mean "node"?'
                    );
                    expect(errors[0]).toHaveProperty("path", ["User", "id", "@authorization", "filter", 0, "where"]);
                });

                test("should returns errors when an @authorization filter has a wrong where predicate", () => {
                    const userDocument = gql`
                        type User {
                            id: ID! @authorization(filter: [{ where: { node: { notAValidID: "$jwt.sub" } } }])
                            name: String!
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    const errors = getError(executeValidate);
                    expect(errors).toHaveLength(1);
                    expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                    expect(errors[0]).toHaveProperty(
                        "message",
                        'Invalid argument: filter, error: Field "notAValidID" is not defined by type.'
                    );
                    expect(errors[0]).toHaveProperty("path", [
                        "User",
                        "id",
                        "@authorization",
                        "filter",
                        0,
                        "where",
                        "node",
                    ]);
                });

                test("should returns errors when an @authorization filter has an incorrect where predicate over a 1 to 1 relationship", () => {
                    const userDocument = gql`
                        type User {
                            id: ID!
                            name: String!
                        }

                        type Post {
                            content: String!
                            author: User!
                                @relationship(type: "HAS_AUTHOR", direction: OUT)
                                @authorization(filter: [{ where: { node: { author: { content: "Simone" } } } }])
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });
                    const errors = getError(executeValidate);
                    expect(errors).toHaveLength(1);
                    expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                    expect(errors[0]).toHaveProperty(
                        "message",
                        'Invalid argument: filter, error: Field "content" is not defined by type.'
                    );
                    expect(errors[0]).toHaveProperty("path", [
                        "Post",
                        "author",
                        "@authorization",
                        "filter",
                        0,
                        "where",
                        "node",
                        "author",
                    ]);
                });

                test("should returns errors when an @authorization filter has an incorrect where predicate over a 1 to N relationship", () => {
                    const userDocument = gql`
                        type User {
                            id: ID!
                            name: String!
                        }

                        type Post {
                            content: String!
                            authors: [User!]!
                                @relationship(type: "HAS_AUTHOR", direction: OUT)
                                @authorization(
                                    filter: [{ where: { node: { author_NOT_A_QUANTIFIER: { name: "Simone" } } } }]
                                )
                        }
                    `;

                    const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                    const executeValidate = () =>
                        validateUserDefinition({
                            userDocument,
                            augmentedDocument,
                            additionalDirectives: [],
                            additionalTypes: [],
                        });

                    const errors = getError(executeValidate);
                    expect(errors).toHaveLength(1);
                    expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
                    expect(errors[0]).toHaveProperty(
                        "message",
                        'Invalid argument: filter, error: Field "author_NOT_A_QUANTIFIER" is not defined by type.'
                    );
                    expect(errors[0]).toHaveProperty("path", [
                        "Post",
                        "authors",
                        "@authorization",
                        "filter",
                        0,
                        "where",
                        "node",
                    ]);
                });
            });
        });
    });
});

function noKeanuFields(context: SDLValidationContext): ASTVisitor {
    return {
        FieldDefinition(node: FieldDefinitionNode) {
            if (node.name.value === "keanu") {
                context.reportError(new GraphQLError("Field cannot named keanu"));
            }
        },
    };
}
