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
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should not returns errors when is correctly used, with specifiedDirective", () => {
            const userDocument = gql`
                type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String! @deprecated(reason: "name is deprecated")
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should not returns errors when used correctly in several place", () => {
            const userDocument = gql`
                type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                type Post @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should validate directive argument name", () => {
            const userDocument = gql`
                type User @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
            );
        });

        test("validation should works when used with other directives", () => {
            const userDocument = gql`
                type User @plural(value: "Users") @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should validate directive argument name, when used with other directives", () => {
            const userDocument = gql`
                type User
                    @plural(value: "Users")
                    @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
            );
        });

        test.skip("should validate argument type", () => {
            const userDocument = gql`
                type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }], validate: {}) {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const errors = validateUserDefinition(userDocument, augmentedDocument);
            expect(errors).toHaveLength(1);
        });

        test.skip("semantic validation", () => {
            const userDocument = gql`
                type User @authorization(filter: [{ where: { node: { idsdf: "$jwt.sub" } } }], validate: {}) {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const errors = validateUserDefinition(userDocument, augmentedDocument);
            expect(errors).toHaveLength(1);
        });
    });

    describe("on FIELD", () => {
        test("should not returns errors with a correct usage", () => {
            const userDocument = gql`
                type User {
                    id: ID! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should validate directive argument name", () => {
            const userDocument = gql`
                type User {
                    id: ID! @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }])
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
            );
        });

        test("validation should works when used with other directives", () => {
            const userDocument = gql`
                type User {
                    id: ID!
                    name: String!
                    author: User!
                        @relationship(type: "HAS_AUTHOR", direction: IN)
                        @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should validate directive argument name, when used with other directives", () => {
            const userDocument = gql`
                type User {
                    id: ID!
                    name: String!
                    author: User!
                        @relationship(type: "HAS_AUTHOR", direction: IN)
                        @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
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
                    author: Member! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should validate directive argument name", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                    author: Member! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                interface Member @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"Unknown argument \\"wrongFilter\\" on directive \\"@MemberAuthorization\\". Did you mean \\"filter\\"?"`
            );
        });

        test("should not returns errors when is correctly used, with specifiedDirective", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                    author: Member! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID! @deprecated(reason: "name is deprecated")
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should not returns errors when used correctly in several place", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                    author: Member! @relationship(type: "HAS_AUTHOR", direction: IN)
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
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should not fails when an interface has no implementations", () => {
            const userDocument = gql`
                type User implements Member {
                    id: ID!
                    name: String!
                    author: Member! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                interface Media @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }

                type Post implements Media {
                    id: ID!
                    name: String!
                }

                interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("validation should works when used with other directives", () => {
            const userDocument = gql`
                type User implements Member @plural(value: "Users") {
                    id: ID!
                    name: String!
                    author: Member! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                interface Member @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should validate directive argument name, when used with other directives", () => {
            const userDocument = gql`
                interface Member @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                }
                type User implements Member @plural(value: "Users") {
                    id: ID!
                    name: String!
                    author: Member! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"Unknown argument \\"wrongFilter\\" on directive \\"@MemberAuthorization\\". Did you mean \\"filter\\"?"`
            );
        });
    });

    describe("on EXTENSION", () => {
        test("should not returns errors when is correctly used", () => {
            const userDocument = gql`
                type User {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
                extend type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should not returns errors when is correctly used, with specifiedDirective", () => {
            const userDocument = gql`
                type User {
                    id: ID!
                    name: String! @deprecated(reason: "name is deprecated")
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
                extend type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should returns errors when used correctly in both type and extension", () => {
            const userDocument = gql`
                type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                type Post {
                    id: ID!
                    name: String!
                }
                extend type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"@authorization directive used in ambiguous way, Type User has already @authorization applied"`
            );
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
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"@authorization directive used in ambiguous way, Type User has already @authorization applied"`
            );
        });

        test("should validate directive argument name", () => {
            const userDocument = gql`
                type User {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
                extend type User @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
            );
        });

        test("validation should works when used with other directives", () => {
            const userDocument = gql`
                type User {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
                extend type User
                    @plural(value: "Users")
                    @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });

        test("should validate directive argument name, when used with other directives", () => {
            const userDocument = gql`
                type User {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }
                extend type User
                    @plural(value: "Users")
                    @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }])
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
            );
        });
    });

    describe("mixed usage", () => {
        test("should not returns errors when used correctly in several place", () => {
            const userDocument = gql`
                type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    author: User!
                        @relationship(type: "HAS_AUTHOR", direction: IN)
                        @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                }

                type Post @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);
            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument);
            expect(executeValidate).not.toThrow();
        });
    });

    describe("with federation schema", () => {
        test("should not returns errors when is correctly used", () => {
            const userDocument = gql`
                extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                type User @shareable @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                type Post {
                    content: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                }
            `;
            const subgraph = new Subgraph(userDocument);
            const { directives, types } = subgraph.getValidationDefinitions();
            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument, directives, types);
            expect(executeValidate).not.toThrow();
        });

        test("should not returns errors when is correctly used, with specifiedDirective", () => {
            const userDocument = gql`
                extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                type User @shareable @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String! @deprecated(reason: "name is deprecated")
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                type Post {
                    content: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                }
            `;
            const subgraph = new Subgraph(userDocument);
            const { directives, types } = subgraph.getValidationDefinitions();
            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument, directives, types);
            expect(executeValidate).not.toThrow();
        });

        test("should not returns errors when used correctly in several place", () => {
            const userDocument = gql`
                extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                type User @shareable @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                type Post @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    content: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                }
            `;
            const subgraph = new Subgraph(userDocument);
            const { directives, types } = subgraph.getValidationDefinitions();
            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument, directives, types);
            expect(executeValidate).not.toThrow();
        });

        test("should validate directive argument name", () => {
            const userDocument = gql`
                extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@shareable"])

                type User @shareable @authorization(wrongFilter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                type Post {
                    content: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                }
            `;
            const subgraph = new Subgraph(userDocument);
            const { directives, types } = subgraph.getValidationDefinitions();
            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument, directives, types);

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
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                type Post {
                    content: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                }
            `;
            const subgraph = new Subgraph(userDocument);
            const { directives, types } = subgraph.getValidationDefinitions();
            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument, directives, types);
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
                    author: User! @relationship(type: "HAS_AUTHOR", direction: IN)
                }

                type Post {
                    content: String!
                    author: User! @relationship(type: "HAS_AUTHOR", direction: OUT)
                }
            `;
            const subgraph = new Subgraph(userDocument);
            const { directives, types } = subgraph.getValidationDefinitions();
            const { typeDefs: augmentedDocument } = makeAugmentedSchema(userDocument);

            const executeValidate = () => validateUserDefinition(userDocument, augmentedDocument, directives, types);
            expect(executeValidate).toThrowErrorMatchingInlineSnapshot(
                `"Unknown argument \\"wrongFilter\\" on directive \\"@UserAuthorization\\". Did you mean \\"filter\\"?"`
            );
        });
    });
});
