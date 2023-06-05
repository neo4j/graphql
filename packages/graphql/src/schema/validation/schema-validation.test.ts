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
import type { ASTVisitor, FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { parse, GraphQLError } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { Subgraph } from "../../classes/Subgraph";
import makeAugmentedSchema from "../make-augmented-schema";
import { validateUserDefinition } from "./schema-validation";

describe("schema validation", () => {
    describe("JWT", () => {
        describe("JWT Payload", () => {
            test("should not returns errors when is correctly used", () => {
                const jwtType = `
                    type MyJWT  @jwtPayload {
                        myClaim: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authorization(filter: [{ where: { jwtPayload: { myClaim: "something" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when is correctly used together with node", () => {
                const jwtType = `
                    type MyJWT  @jwtPayload {
                        myClaim: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User
                        @authorization(
                            filter: [{ where: { jwtPayload: { myClaim: "something" }, node: { name: "John" } } }]
                        ) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should return errors when jwtPayload field is not found", () => {
                const jwtType = `
                    type MyJWT  @jwtPayload {
                        myClaim: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User
                        @authorization(filter: [{ where: { jwtPayload: { thisClaimDoesNotExist: "something" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Invalid argument: filter, error: Field \\"thisClaimDoesNotExist\\" is not defined by type \\"JWTPayloadWhere\\"."`
                );
            });

            test("should not return errors when jwtPayload field is standard", () => {
                const jwtType = `
                    type MyJWT  @jwtPayload {
                        myClaim: String
                    }
                `;
                const userDocument = gql`
                    ${jwtType}
                    type User @authorization(filter: [{ where: { jwtPayload: { iss: "something" } } }]) {
                        id: ID!
                        name: String!
                    }
                `;
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should return errors when jwtPayload field is inside node filter", () => {
                const jwtType = `
                    type MyJWT  @jwtPayload {
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
                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Invalid argument: filter, error: Field \\"myClaim\\" is not defined by type \\"UserWhere\\"."`
                );
            });
        });

        test("should not returns errors when is correctly used with claims path", () => {
            const jwtType = `
                type MyJWT  @jwtPayload {
                    myClaim: String 
                    groups: [String!]! @jwtClaim(path: "applications[0].groups")
                }
            `;
            const userDocument = gql`
                ${jwtType}
                type User @authorization(filter: [{ where: { jwtPayload: { groups_INCLUDES: "something" } } }]) {
                    id: ID!
                    name: String!
                }
            `;
            const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
            expect(executeValidate).not.toThrow();
        });

        describe("JWT wildcard", () => {
            test("should not returns errors when is correctly used: Int on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwtPayload {
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

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
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
                    type JWTPayload @jwtPayload {
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

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).not.toThrow();
            });

            test("should not returns errors when is correctly used: Boolean on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwtPayload {
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

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Invalid argument: filter, error: Int cannot represent non-integer value: \\"\\""`
                );
            });

            test("should return error when types do not match: Int compared with List[Int] on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwtPayload {
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

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Invalid argument: filter, error: Int cannot represent non-integer value: []"`
                );
            });

            test("should return error when types do not match: Int compared with String on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwtPayload {
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

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Invalid argument: filter, error: Int cannot represent non-integer value: \\"\\""`
                );
            });

            test("should return error when types do not match: Int compared with String on FIELD", () => {
                const jwtType = `
                    type JWTPayload @jwtPayload {
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

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Invalid argument: filter, error: Int cannot represent non-integer value: \\"\\""`
                );
            });

            test("should return error when types do not match: String compared with Int on FIELD", () => {
                const jwtType = `
                    type JWTPayload @jwtPayload {
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

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Invalid argument: filter, error: String cannot represent a non string value: 0"`
                );
            });

            test("should return error when types do not match: String compared with Int on FIELD with claim", () => {
                const jwtType = `
                    type JWTPayload @jwtPayload {
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

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Invalid argument: filter, error: String cannot represent a non string value: 0"`
                );
            });

            test("should return error when types do not match: String compared with Boolean on FIELD", () => {
                const jwtType = `
                    type JWTPayload @jwtPayload {
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

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Invalid argument: filter, error: String cannot represent a non string value: false"`
                );
            });

            test("should return error when types do not match: Boolean compared with String on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwtPayload {
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

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Invalid argument: filter, error: Boolean cannot represent a non boolean value: \\"\\""`
                );
            });

            test("should return error when types do not match: Boolean compared with Int on OBJECT", () => {
                const jwtType = `
                    type JWTPayload @jwtPayload {
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

                const jwtPayload = parse(jwtType).definitions[0] as ObjectTypeDefinitionNode;
                const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
                const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument, jwtPayload });
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Invalid argument: filter, error: Boolean cannot represent a non boolean value: 0"`
                );
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
                );
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
                );
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
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
                expect(executeValidate).toThrow('Directive "@MemberAuthorization" may not be used on INTERFACE.');
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"The directive \\"@UserAuthorization\\" can only be used once at this location."`
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"The directive \\"@UserAuthorization\\" can only be used once at this location."`
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"The directive \\"@UserAuthorization\\" can only be used once at this location."`
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
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
                expect(executeValidate).toThrow('Directive "@MemberAuthorization" may not be used on INTERFACE.');
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Unknown argument \\"wrongFilter\\" on directive \\"@PostAuthorization\\". Did you mean \\"filter\\"?"`
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

                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
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
                expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                    `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
                );
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
            // It returns two time the error as in the ValidationSchema keanu appears two times.
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(`
                "Field cannot named keanu
                Field cannot named keanu"
            `);
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
                    expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                        `"Invalid argument: filter, error: Field \\"seemsNotAWhereToMe\\" is not defined by type \\"UserAuthorizationFilterRule\\"."`
                    );
                });

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
                    expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                        `"Invalid argument: filter, error: Field \\"notANode\\" is not defined by type \\"UserAuthorizationWhere\\". Did you mean \\"node\\"?"`
                    );
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
                    expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                        `"Invalid argument: filter, error: Field \\"notAValidID\\" is not defined by type \\"UserWhere\\"."`
                    );
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
                    expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                        `"Invalid argument: filter, error: Field \\"content\\" is not defined by type \\"UserWhere\\"."`
                    );
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
                    expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                        `"Invalid argument: filter, error: Field \\"author_NOT_A_QUANTIFIER\\" is not defined by type \\"PostWhere\\"."`
                    );
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
                    expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                        `"Invalid argument: filter, error: Field \\"seemsNotAWhereToMe\\" is not defined by type \\"UserAuthorizationFilterRule\\"."`
                    );
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
                    expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                        `"Invalid argument: filter, error: Field \\"notANode\\" is not defined by type \\"UserAuthorizationWhere\\". Did you mean \\"node\\"?"`
                    );
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
                    expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                        `"Invalid argument: filter, error: Field \\"notAValidID\\" is not defined by type \\"UserWhere\\"."`
                    );
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
                    expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                        `"Invalid argument: filter, error: Field \\"content\\" is not defined by type \\"UserWhere\\"."`
                    );
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
                    expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                        `"Invalid argument: filter, error: Field \\"author_NOT_A_QUANTIFIER\\" is not defined by type \\"PostWhere\\"."`
                    );
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
