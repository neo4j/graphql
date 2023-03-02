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

        const document = mergeTypeDefs(typeDefs);
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
