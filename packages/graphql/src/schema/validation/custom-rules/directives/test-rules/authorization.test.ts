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
import { authorizationDirectiveScaffold } from "../../../../../graphql/directives/type-dependant-directives/authorization";
import { validateSDL } from "../../../validate-sdl";
import { validateAuthorizationDirective } from "./authorization";

describe.skip("authorization validation", () => {
    test("@authorization can be used in a object type that is a node", () => {
        const userDocument = gql`
            type User @node @authorization(validate: [{ where: { id: "1" } }]) {
                id: ID!
                name: String!
            }
        `;
        const errors = validateSDL(userDocument, [validateAuthorizationDirective], new GraphQLSchema({}));
        expect(errors).toBeInstanceOf(Array);
        expect(errors).toHaveLength(0);
    });

    test("@authorization cannot be used in a object type that is not a node", () => {
        const userDocument = gql`
            type User @authorization(validate: [{ where: { id: "1" } }]) {
                id: ID!
                name: String!
            }
        `;
        const errors = validateSDL(userDocument, [validateAuthorizationDirective], new GraphQLSchema({}));
        expect(errors).toBeInstanceOf(Array);
        expect(errors).toHaveLength(1);
        expect(errors).toEqual([
            expect.objectContaining({
                message: 'Directive "authorization" requires to be used within the "@node" directive',
            }),
        ]);
    });

    test("@authorization cannot be used in a field in a object type that is not a node", () => {
        const userDocument = gql`
            type User {
                id: ID!
                name: String! @authorization(validate: [{ where: { id: "1" } }])
            }
        `;
        const errors = validateSDL(userDocument, [validateAuthorizationDirective], new GraphQLSchema({}));
        expect(errors).toBeInstanceOf(Array);
        expect(errors).toHaveLength(1);
        expect(errors).toEqual([
            expect.objectContaining({
                message: 'Directive "authorization" requires to be used within the "@node" directive',
            }),
        ]);
    });

    test("should throw error when there is an invalid argument", () => {
        const userDocument = gql`
            type User @node {
                id: ID!
                name: String!
                title: String @authorization
            }
        `;

        const errors = validateSDL(userDocument, [validateAuthorizationDirective], new GraphQLSchema({}));
        expect(errors).toBeInstanceOf(Array);
        expect(errors).toHaveLength(1);
        expect(errors).toEqual([
            expect.objectContaining({
                message: `@authorization requires at least one of ${authorizationDirectiveScaffold.args.map(arg => arg.name).join(
                    ", "
                )} arguments`,
            }),
        ]);
    });
});
