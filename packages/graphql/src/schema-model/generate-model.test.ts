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
import { gql } from "graphql-tag";
import { AnnotationsKey } from "./annotation/Annotation";
import {
    AuthorizationFilterOperationRule,
    AuthorizationValidateOperationRule,
} from "./annotation/AuthorizationAnnotation";
import { generateModel } from "./generate-model";
import type { Neo4jGraphQLSchemaModel } from "./Neo4jGraphQLSchemaModel";
import type { ConcreteEntity } from "./entity/ConcreteEntity";
import type { Attribute } from "./attribute/Attribute";

describe("ConcreteEntity generation", () => {
    let schemaModel: Neo4jGraphQLSchemaModel;

    beforeAll(() => {
        const typeDefs = gql`
            type User
                @authorization(
                    validate: [
                        { when: ["BEFORE"], where: { node: { id: { equals: "$jwt.sub" } } } }
                        { when: ["AFTER"], where: { node: { id: { equals: "$jwt.sub" } } } }
                    ]
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
        expect(userEntity?.attributes.get("password")?.annotations).toHaveProperty(AnnotationsKey.authorization);
        const authAnnotation = userEntity?.attributes.get("password")?.annotations[AnnotationsKey.authorization];

        expect(authAnnotation).toBeDefined();
        expect(authAnnotation?.filter).toHaveLength(1);
        expect(authAnnotation?.filter).toEqual([
            {
                operations: AuthorizationFilterOperationRule,
                requireAuthentication: true,
                where: {
                    jwtPayload: undefined,
                    node: { id: { equals: "$jwt.sub" } },
                },
            },
        ]);
        expect(authAnnotation?.validate).toBeUndefined();
    });

    test("creates the authorization annotation on User entity", () => {
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        expect(userEntity?.annotations[AnnotationsKey.authorization]).toBeDefined();
    });

    test("authorization annotation is correct on User entity", () => {
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        const authAnnotation = userEntity?.annotations[AnnotationsKey.authorization];
        expect(authAnnotation).toBeDefined();
        expect(authAnnotation?.filter).toBeUndefined();
        expect(authAnnotation?.validate).toHaveLength(2);
        expect(authAnnotation?.validate).toEqual(
            expect.arrayContaining([
                {
                    operations: AuthorizationValidateOperationRule,
                    when: ["BEFORE"],
                    requireAuthentication: true,
                    where: {
                        jwtPayload: undefined,
                        node: { id: { equals: "$jwt.sub" } },
                    },
                },
                {
                    operations: AuthorizationValidateOperationRule,
                    when: ["AFTER"],
                    requireAuthentication: true,
                    where: {
                        jwtPayload: undefined,
                        node: { id: { equals: "$jwt.sub" } },
                    },
                },
            ])
        );
    });
});

describe("ComposeEntity generation", () => {
    let schemaModel: Neo4jGraphQLSchemaModel;

    beforeAll(() => {
        const typeDefs = gql`
            union Tool = Screwdriver | Pencil

            type Screwdriver {
                length: Int
            }

            type Pencil {
                colour: String
            }

            interface Human {
                id: ID!
            }

            type User implements Human
                @authorization(
                    validate: [
                        { when: "BEFORE", where: { node: { id: { equals: "$jwt.sub" } } } }
                        { when: "AFTER", where: { node: { id: { equals: "$jwt.sub" } } } }
                    ]
                ) {
                id: ID!
                name: String!
                preferiteTool: Tool
            }

            extend type User {
                password: String! @authorization(filter: [{ where: { node: { id: { equals: "$jwt.sub" } } } }])
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        schemaModel = generateModel(document);
    });

    test("creates the concrete entity", () => {
        expect(schemaModel.concreteEntities).toHaveLength(3); // User, Pencil, Screwdriver
    });

    test("creates the composite entity", () => {
        expect(schemaModel.compositeEntities).toHaveLength(2); // Human, Tool
    });

    test("composite entities has correct concrete entities", () => {
        const toolEntities = schemaModel.compositeEntities.find((e) => e.name === "Tool");
        expect(toolEntities?.concreteEntities).toHaveLength(2); // Pencil, Screwdriver
        const humanEntities = schemaModel.compositeEntities.find((e) => e.name === "Human");
        expect(humanEntities?.concreteEntities).toHaveLength(1); // User
    });
});

describe("Attribute generation", () => {
    let schemaModel: Neo4jGraphQLSchemaModel;
    // entities
    let userEntity: ConcreteEntity;

    // user attributes
    let id: Attribute;
    let name: Attribute;
    let createdAt: Attribute;
    let releaseDate: Attribute;
    let runningTime: Attribute;
    let accountSize: Attribute;
    let favoriteColors: Attribute;
    let password: Attribute;

    // hasAccount relationship attributes
    let createdDateTime: Attribute;
    // account attributes
    let status: Attribute;
    let securityLevel: Attribute;

    beforeAll(() => {
        const typeDefs = gql`
            enum Status {
                ACTIVATED
                DISABLED
            }

            union SecurityLevel = String | Int

            type User {
                id: ID!
                name: String!
                createdAt: DateTime
                releaseDate: Date!
                runningTime: Time
                accountSize: BigInt
                favoriteColors: [String!]!
                accounts: [Account!]! @relationship(type: "HAS_ACCOUNT", properties: "hasAccount", direction: OUT)
            }
     
            interface hasAccount @relationshipProperties {
                createdDateTime: DateTime!
            }
            
            type Account {
                id: ID!
                status: Status
                securityLevel: SecurityLevel
            }

            extend type User {
                password: String!
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        schemaModel = generateModel(document);
        userEntity = schemaModel.entities.get("User") as ConcreteEntity;
        id = userEntity?.attributes.get("id") as Attribute;
        name = userEntity?.attributes.get("name") as Attribute;
        createdAt = userEntity?.attributes.get("createdAt") as Attribute;
        releaseDate = userEntity?.attributes.get("releaseDate") as Attribute;
        runningTime = userEntity?.attributes.get("runningTime") as Attribute;
        accountSize = userEntity?.attributes.get("accountSize") as Attribute;
        favoriteColors = userEntity?.attributes.get("favoriteColors") as Attribute;
        password = userEntity?.attributes.get("password") as Attribute;
    });

    describe("attribute types", () => {
        test("ID", () => {
            expect(id.isID()).toBe(true);
            expect(id.isGraphQLBuiltInScalar()).toBe(true);
        });

        test("String", () => {
            expect(name.isString()).toBe(true);
            expect(id.isGraphQLBuiltInScalar()).toBe(true);
        });

        test("DateTime", () => {
            expect(createdAt.isDateTime()).toBe(true);
            expect(createdAt.isGraphQLBuiltInScalar()).toBe(false);
        });

        test("Date", () => {
            expect(releaseDate.isDate()).toBe(true);
            expect(releaseDate.isGraphQLBuiltInScalar()).toBe(false);
        });

        test("Time", () => {
            expect(runningTime.isTime()).toBe(true);
            expect(runningTime.isGraphQLBuiltInScalar()).toBe(false);
        });

        test("BigInt", () => {
            expect(accountSize.isBigInt()).toBe(true);
            expect(accountSize.isGraphQLBuiltInScalar()).toBe(false);
        });

        test("List", () => {
            expect(favoriteColors.isList()).toBe(true);
            expect(favoriteColors.isString()).toBe(false);
        });

        test("on extended entity", () => {
            expect(password.isString()).toBe(true);
            expect(password.isGraphQLBuiltInScalar()).toBe(true);
        });

        test("isRequired", () => {
            expect(name.isRequired()).toBe(true);
            expect(id.isRequired()).toBe(true);
            expect(createdAt.isRequired()).toBe(false);
            expect(releaseDate.isRequired()).toBe(true);
            expect(runningTime.isRequired()).toBe(false);
            expect(accountSize.isRequired()).toBe(false);
            expect(favoriteColors.isRequired()).toBe(true);
            expect(password.isRequired()).toBe(true);
        });
    });
});
