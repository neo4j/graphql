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

import { GraphQLSchema } from "graphql";
import { gql } from "graphql-tag";
import {
    fulltextDirective,
    mutationDirective,
    queryDirective,
    subscriptionDirective,
    vectorDirective,
} from "../../../graphql/directives";
import { authorizationDirectiveScaffold } from "../../../graphql/directives/type-dependant-directives/authorization";
import { subscriptionsAuthorizationDirectiveScaffold } from "../../../graphql/directives/type-dependant-directives/subscriptions-authorization";
import { validateSDL } from "../validate-sdl";
import { validateAuthorizationDirective } from "./directives/authorization";
import { validateCypherDirective } from "./directives/cypher";

describe.skip("node missing validation", () => {
    test.each([
        authorizationDirectiveScaffold.name,
        subscriptionsAuthorizationDirectiveScaffold.name,
        queryDirective.name,
        mutationDirective.name,
        subscriptionDirective.name,
        fulltextDirective.name,
        vectorDirective.name,
    ])("when the %s directive is used on a type annotated with @node no error should be raised", (name) => {
        const userDocument = gql`
            type User @${name} @node {
                id: ID!
                name: String!
            }
        `;
        const errors = validateSDL(
            userDocument,
            [validateAuthorizationDirective, validateCypherDirective],
            new GraphQLSchema({})
        );
        expect(errors).toBeInstanceOf(Array);
        expect(errors).toHaveLength(0);
    });

    test.each([
        authorizationDirectiveScaffold.name,
        subscriptionsAuthorizationDirectiveScaffold.name,
        queryDirective.name,
        mutationDirective.name,
        subscriptionDirective.name,
        fulltextDirective.name,
        vectorDirective.name,
    ])("when the %s directive is used on a type non annotated with @node an error should be raised", (name) => {
        const userDocument = gql`
            type User @${name} {
                id: ID!
                name: String!
            }
        `;
        const errors = validateSDL(
            userDocument,
            [validateAuthorizationDirective, validateCypherDirective],
            new GraphQLSchema({})
        );
        expect(errors).toBeInstanceOf(Array);
        expect(errors).toHaveLength(1);
        expect(errors).toEqual([
            expect.objectContaining({
                message: expect.stringContaining(`requires to be used within the "@node" directive`),
            }),
        ]);
    });

    // test("when a node-related directive is used on a extension type should raise an error when @node is not found", () => {
    //     const userDocument = gql`
    //         type User {
    //             id: ID!
    //             name: String!
    //         }
    //         extend type User @query(read: true) {
    //             extra: String
    //         }
    //     `;
    //     const errors = validateSDL(userDocument, [nodeMissingValidation], new GraphQLSchema({}));
    //     expect(errors).toBeInstanceOf(Array);
    //     expect(errors).toHaveLength(1);
    //     expect(errors).toEqual([
    //         expect.objectContaining({
    //             message: expect.stringContaining(`requires to be used within the "@node" directive`),
    //         }),
    //     ]);
    // });

    // test("when a node-related directive is used on a extension type should not raise an error when @node is found", () => {
    //     const userDocument = gql`
    //         type User {
    //             id: ID!
    //             name: String!
    //         }
    //         extend type User @query(read: true) {
    //             extra: String
    //         }
    //         extend type User @node {
    //             extra2: String
    //         }
    //     `;
    //     const errors = validateSDL(userDocument, [nodeMissingValidation], new GraphQLSchema({}));
    //     expect(errors).toBeInstanceOf(Array);
    //     expect(errors).toHaveLength(0);
    // });

    // test.each([
    //     authorizationDirectiveScaffold.name,
    //     subscriptionsAuthorizationDirectiveScaffold.name,
    //     relationshipDirective.name,
    //     relayIdDirective.name,
    // ])(
    //     "when the %s directive is used on a field on a type non annotated with @node an error should be raised",
    //     (name) => {
    //         const userDocument = gql`
    //         type User @node {
    //             id: ID!
    //             name: String! @${name}
    //         }
    //     `;
    //         const errors = validateSDL(userDocument, [nodeMissingValidation], new GraphQLSchema({}));
    //         expect(errors).toBeInstanceOf(Array);
    //         expect(errors).toHaveLength(0);
    //     }
    // );

    // test.each([
    //     authorizationDirectiveScaffold.name,
    //     subscriptionsAuthorizationDirectiveScaffold.name,
    //     relationshipDirective.name,
    //     relayIdDirective.name,
    // ])(
    //     "when the %s directive is used on a field on a type non annotated with @node an error should be raised",
    //     (name) => {
    //         const userDocument = gql`
    //         type User {
    //             id: ID!
    //             name: String! @${name}
    //         }
    //     `;
    //         const errors = validateSDL(userDocument, [nodeMissingValidation], new GraphQLSchema({}));
    //         expect(errors).toBeInstanceOf(Array);
    //         expect(errors).toHaveLength(1);
    //         expect(errors).toEqual([
    //             expect.objectContaining({
    //                 message: expect.stringContaining(`requires to be used within the "@node" directive`),
    //             }),
    //         ]);
    //     }
    // );

    // test("node-related directives can be used within @node types, with @node defined in type extension", () => {
    //     const userDocument = gql`
    //         type User {
    //             id: ID!
    //             name: String!
    //             posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
    //         }

    //         extend type User @node

    //         type Post @node {
    //             id: ID!
    //             title: String!
    //         }
    //     `;
    //     const errors = validateSDL(userDocument, [nodeMissingValidation], new GraphQLSchema({}));
    //     expect(errors).toBeInstanceOf(Array);
    //     expect(errors).toHaveLength(0);
    // });

    // test("node-related directives can be used within @node types, with directive defined in type extension", () => {
    //     const userDocument = gql`
    //         type User @node {
    //             id: ID!
    //             name: String!
    //         }

    //         extend type User @node {
    //             posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
    //         }

    //         type Post @node {
    //             id: ID!
    //             title: String!
    //         }
    //     `;
    //     const errors = validateSDL(userDocument, [nodeMissingValidation], new GraphQLSchema({}));
    //     expect(errors).toBeInstanceOf(Array);
    //     expect(errors).toHaveLength(0);
    // });
});
