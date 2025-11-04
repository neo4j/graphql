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

import type {
    EnumTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { gql } from "graphql-tag";
import validateDocument from "../../validate-document";

const additionalDefinitions = {
    enums: [] as EnumTypeDefinitionNode[],
    interfaces: [] as InterfaceTypeDefinitionNode[],
    unions: [] as UnionTypeDefinitionNode[],
    objects: [] as ObjectTypeDefinitionNode[],
};

describe("WarnObjectFieldsWithoutResolver", () => {
    let warn: jest.SpyInstance;

    beforeEach(() => {
        warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        warn.mockReset();
    });
    describe("Subscriptions authorization rule", () => {
        test("warns if @authorization is used on type and @subscriptionsAuthorization is missing", () => {
            const doc = gql`
                type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    password: String!
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: { subscriptions: true },
            });
            expect(warn).toHaveBeenCalled();
        });

        test("warns if @authorization is used on field and @subscriptionsAuthorization is missing", () => {
            const doc = gql`
                type User {
                    id: ID!
                    name: String!
                    password: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: { subscriptions: true },
            });
            expect(warn).toHaveBeenCalled();
        });

        test("does not warn if both directives are used on type", () => {
            const doc = gql`
                type User
                    @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    @subscriptionsAuthorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    password: String!
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: { subscriptions: true },
            });
            expect(warn).toHaveBeenCalled();
        });

        test("does not warn if both directives are used on field", () => {
            const doc = gql`
                type User {
                    id: ID!
                    name: String!
                    password: String!
                        @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                        @subscriptionsAuthorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: { subscriptions: true },
            });
            expect(warn).toHaveBeenCalled();
        });

        test("does not warn if subscriptions not enabled", () => {
            const doc = gql`
                type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    password: String!
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
            expect(warn).toHaveBeenCalled();
        });
    });
});
