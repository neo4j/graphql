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
import type { ASTVisitor, FieldDefinitionNode } from "graphql";
import { GraphQLError } from "graphql";
import type { SDLValidationContext } from "graphql/validation/ValidationContext";
import { Subgraph } from "../../classes/Subgraph";
import makeAugmentedSchema from "../make-augmented-schema";
import { validateUserDefinition } from "./schema-validation";

describe("schema-validation", () => {
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
                type User @plural(value: "Users") @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
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
        test("should not returns errors when is correctly used", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).not.toThrow();
        });

        test("should validate directive argument name", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Member @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"Unknown argument \\"wrongFilter\\" on directive \\"@MemberAuthorization\\". Did you mean \\"filter\\"?"`
            );
        });

        test("should not returns errors when is correctly used, with specifiedDirective", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID! @deprecated(reason: "name is deprecated")
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).not.toThrow();
        });

        test("should not returns errors when used correctly in several place", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Media {
                    id: ID!
                }

                type Post implements Media @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                }

                interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).not.toThrow();
        });

        test("should not fails when an interface has no implementations", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Media @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }

                interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).not.toThrow();
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
        test("should not returns errors when is correctly used", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Member {
                    id: ID!
                }
                extend interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).not.toThrow();
        });

        test("should validate directive argument name", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Member {
                    id: ID!
                }
                extend interface Member @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"Unknown argument \\"wrongFilter\\" on directive \\"@MemberAuthorization\\". Did you mean \\"filter\\"?"`
            );
        });

        test("should returns errors when used correctly in both interface and extension", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }
                extend interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"The directive \\"@MemberAuthorization\\" can only be used once at this location."`
            );
        });

        test("should returns errors when used correctly in both a interface field and an extension for the same field", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Member {
                    id: ID! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                }
                extend interface Member {
                    id: ID! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"The directive \\"@MemberAuthorization\\" can only be used once at this location."`
            );
        });

        test("should not returns errors when used correctly in different type and field across several extensions", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Member {
                    id: ID!
                    name: String!
                }

                extend interface Member {
                    name: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                }

                extend interface Member {
                    id: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).not.toThrow();
        });

        test("should not returns errors when used correctly in several place", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Media {
                    id: ID!
                }

                type Post implements Media {
                    id: ID!
                    name: String!
                }

                interface Member {
                    id: ID!
                }
                extend interface Media @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                extend interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).not.toThrow();
        });

        test("should not fails when an interface has no implementations", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }

                interface Media {
                    id: ID!
                }

                interface Member {
                    id: ID!
                }
                extend interface Media @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                extend interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).not.toThrow();
        });

        test("should returns errors when used correctly in more than one extension", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                }
                interface Member {
                    id: ID!
                }
                extend interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                extend interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"The directive \\"@MemberAuthorization\\" can only be used once at this location."`
            );
        });

        test("validation should works when used with other directives", () => {
            const userDocument = gql`
                type User implements Member @plural(value: "Users") {
                    id: ID!
                    name: String!
                }

                interface Member {
                    id: ID!
                }
                extend interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).not.toThrow();
        });

        test("should validate directive argument name, when used with other directives", () => {
            const userDocument = gql`
                interface Member {
                    id: ID!
                }
                type User implements Member @plural(value: "Users") {
                    id: ID!
                    name: String!
                }
                extend interface Member @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition({ userDocument, augmentedDocument });
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"Unknown argument \\"wrongFilter\\" on directive \\"@MemberAuthorization\\". Did you mean \\"filter\\"?"`
            );
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

                extend type Document @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
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

                extend type Document @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
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

                type Post @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
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
                "Field cannot be named keanu
                Field cannot be named keanu"
            `);
        });
    });
});

function noKeanuFields(context: SDLValidationContext): ASTVisitor {
    return {
        FieldDefinition(node: FieldDefinitionNode) {
            if (node.name.value === "keanu") {
                context.reportError(new GraphQLError("Field cannot be named keanu"));
            }
        },
    };
}
