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
import { SubscriptionsAuthorizationFilterEventRule } from "./annotation/SubscriptionsAuthorizationAnnotation";
import { AuthenticationAnnotation } from "./annotation/AuthenticationAnnotation";
import type { AttributeAdapter } from "./attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntityAdapter } from "./entity/model-adapters/ConcreteEntityAdapter";
import type { RelationshipAdapter } from "./relationship/model-adapters/RelationshipAdapter";
import type { ConcreteEntity } from "./entity/ConcreteEntity";

describe("Schema model generation", () => {
    test("parses @authentication directive with no arguments", () => {
        const typeDefs = gql`
            extend schema @authentication
        `;

        const document = mergeTypeDefs(typeDefs);
        const schemaModel = generateModel(document);

        expect(schemaModel.annotations.authentication).toEqual(
            new AuthenticationAnnotation([
                "READ",
                "AGGREGATE",
                "CREATE",
                "UPDATE",
                "DELETE",
                "CREATE_RELATIONSHIP",
                "DELETE_RELATIONSHIP",
                "SUBSCRIBE",
            ])
        );
    });

    test("parses @authentication directive with operations", () => {
        const typeDefs = gql`
            extend schema @authentication(operations: [CREATE])
        `;

        const document = mergeTypeDefs(typeDefs);
        const schemaModel = generateModel(document);

        expect(schemaModel.annotations.authentication).toEqual(new AuthenticationAnnotation(["CREATE"]));
    });
});

describe("ConcreteEntity generation", () => {
    describe("authorization annotation", () => {
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

        test("creates the authorization annotation on User entity", () => {
            const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
            expect(userEntity?.annotations[AnnotationsKey.authorization]).toBeDefined();
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
                        jwt: undefined,
                        node: { id: { equals: "$jwt.sub" } },
                    },
                },
            ]);
            expect(authAnnotation?.validate).toBeUndefined();
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
                            jwt: undefined,
                            node: { id: { equals: "$jwt.sub" } },
                        },
                    },
                    {
                        operations: AuthorizationValidateOperationRule,
                        when: ["AFTER"],
                        requireAuthentication: true,
                        where: {
                            jwt: undefined,
                            node: { id: { equals: "$jwt.sub" } },
                        },
                    },
                ])
            );
        });
    });

    describe("subscriptionsAuthorization annotation", () => {
        let schemaModel: Neo4jGraphQLSchemaModel;

        beforeAll(() => {
            const typeDefs = gql`
                type User @subscriptionsAuthorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                }

                extend type User {
                    password: String! @subscriptionsAuthorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
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

        test("creates the subscriptionsAuthorization annotation on User entity", () => {
            const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
            expect(userEntity?.annotations[AnnotationsKey.subscriptionsAuthorization]).toBeDefined();
        });

        test("creates the subscriptionsAuthorization annotation on password field", () => {
            const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
            expect(userEntity?.attributes.get("password")?.annotations).toHaveProperty(
                AnnotationsKey.subscriptionsAuthorization
            );
            const authAnnotation =
                userEntity?.attributes.get("password")?.annotations[AnnotationsKey.subscriptionsAuthorization];

            expect(authAnnotation).toBeDefined();
            expect(authAnnotation?.filter).toHaveLength(1);
            expect(authAnnotation?.filter).toEqual([
                {
                    events: SubscriptionsAuthorizationFilterEventRule,
                    requireAuthentication: true,
                    where: {
                        jwt: undefined,
                        node: { id: "$jwt.sub" },
                    },
                },
            ]);
        });

        test("subscriptionsAuthorization annotation is correct on User entity", () => {
            const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
            const authAnnotation = userEntity?.annotations[AnnotationsKey.subscriptionsAuthorization];
            expect(authAnnotation).toBeDefined();
            expect(authAnnotation?.filter).toEqual([
                {
                    events: SubscriptionsAuthorizationFilterEventRule,
                    requireAuthentication: true,
                    where: {
                        jwt: undefined,
                        node: { id: "$jwt.sub" },
                    },
                },
            ]);
        });
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
                favoriteTool: Tool
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

    test("concrete entity has correct attributes", () => {
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        expect(userEntity?.attributes.has("id")).toBeTrue();
        expect(userEntity?.attributes.has("name")).toBeTrue();
        expect(userEntity?.attributes.has("password")).toBeTrue();
        expect(userEntity?.attributes.has("favoriteTool")).toBeTrue();
    });
});

describe("Relationship", () => {
    let schemaModel: Neo4jGraphQLSchemaModel;

    beforeAll(() => {
        const typeDefs = gql`
            type User {
                id: ID!
                name: String!
                accounts: [Account!]! @relationship(type: "HAS_ACCOUNT", properties: "hasAccount", direction: OUT)
                favoriteShow: [Show!]! @relationship(type: "FAVORITE_SHOW", direction: OUT)
            }

            interface hasAccount @relationshipProperties {
                creationTime: DateTime!
            }

            union Show = Movie | TvShow

            type Movie {
                name: String!
            }

            type TvShow {
                name: String!
                episodes: Int
            }

            type Account {
                id: ID!
                username: String!
            }

            extend type User {
                password: String! @authorization(filter: [{ where: { node: { id: { equals: "$jwt.sub" } } } }])
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        schemaModel = generateModel(document);
    });

    test("concrete entity has correct relationship", () => {
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        const accounts = userEntity?.relationships.get("accounts");
        expect(accounts).toBeDefined();
        expect(accounts?.type).toBe("HAS_ACCOUNT");
        expect(accounts?.direction).toBe("OUT");
        expect(accounts?.queryDirection).toBe("DEFAULT_DIRECTED");
        expect(accounts?.nestedOperations).toEqual([
            "CREATE",
            "UPDATE",
            "DELETE",
            "CONNECT",
            "DISCONNECT",
            "CONNECT_OR_CREATE",
        ]);
        expect(accounts?.target.name).toBe("Account");
        expect(accounts?.attributes.has("creationTime")).toBeTrue();
    });
});

describe("Annotations & Attributes", () => {
    let schemaModel: Neo4jGraphQLSchemaModel;
    let userEntity: ConcreteEntity;
    let accountEntity: ConcreteEntity;

    beforeAll(() => {
        const typeDefs = gql`
            type User @query @mutation @subscription {
                id: ID!
                name: String! @selectable(onAggregate: true) @alias(property: "dbName")
                defaultName: String! @default(value: "John")
                age: Int! @populatedBy(callback: "thisCallback", operations: [CREATE])
                accounts: [Account!]! @relationship(type: "HAS_ACCOUNT", direction: OUT)
            }

            type Account @subscription(events: [CREATED]) {
                id: ID!
                accountName: String! @settable(onCreate: false)
            }

            extend type User {
                password: String! @authorization(filter: [{ where: { node: { id: { equals: "$jwt.sub" } } } }])
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        schemaModel = generateModel(document);
        userEntity = schemaModel.concreteEntities.find((e) => e.name === "User") as ConcreteEntity;
        accountEntity = schemaModel.concreteEntities.find((e) => e.name === "Account") as ConcreteEntity;
    });

    test("concrete entities should be generated with the correct annotations", () => {
        const userQuery = userEntity?.annotations[AnnotationsKey.query];
        expect(userQuery).toBeDefined();
        expect(userQuery?.read).toBe(true);
        expect(userQuery?.aggregate).toBe(false);

        const userMutation = userEntity?.annotations[AnnotationsKey.mutation];
        expect(userMutation).toBeDefined();
        expect(userMutation?.operations).toStrictEqual(["CREATE", "UPDATE", "DELETE"]);

        const userSubscription = userEntity?.annotations[AnnotationsKey.subscription];
        expect(userSubscription).toBeDefined();
        expect(userSubscription?.events).toStrictEqual([
            "CREATED",
            "UPDATED",
            "DELETED",
            "RELATIONSHIP_CREATED",
            "RELATIONSHIP_DELETED",
        ]);

        const accountSubscription = accountEntity?.annotations[AnnotationsKey.subscription];
        expect(accountSubscription).toBeDefined();
        expect(accountSubscription?.events).toStrictEqual(["CREATED"]);
    });

    test("attributes should be generated with the correct annotations", () => {
        const userName = userEntity?.attributes.get("name");
        expect(userName?.annotations[AnnotationsKey.selectable]).toBeDefined();
        expect(userName?.annotations[AnnotationsKey.selectable]?.onRead).toBe(true);
        expect(userName?.annotations[AnnotationsKey.selectable]?.onAggregate).toBe(true);

        expect(userName?.databaseName).toBeDefined();
        expect(userName?.databaseName).toBe("dbName");

        const defaultName = userEntity?.attributes.get("defaultName");
        expect(defaultName).toBeDefined();
        expect(defaultName?.annotations[AnnotationsKey.default]).toBeDefined();
        expect(defaultName?.annotations[AnnotationsKey.default]?.value).toBe("John");

        const age = userEntity?.attributes.get("age");
        expect(age).toBeDefined();
        expect(age?.annotations[AnnotationsKey.populatedBy]).toBeDefined();
        expect(age?.annotations[AnnotationsKey.populatedBy]?.callback).toBe("thisCallback");
        expect(age?.annotations[AnnotationsKey.populatedBy]?.operations).toStrictEqual(["CREATE"]);

        const accountName = accountEntity?.attributes.get("accountName");
        expect(accountName?.annotations[AnnotationsKey.settable]).toBeDefined();
        expect(accountName?.annotations[AnnotationsKey.settable]?.onCreate).toBe(false);
        expect(accountName?.annotations[AnnotationsKey.settable]?.onUpdate).toBe(true);

        expect(accountName?.databaseName).toBeDefined();
        expect(accountName?.databaseName).toBe("accountName");
    });
});

describe("GraphQL adapters", () => {
    let schemaModel: Neo4jGraphQLSchemaModel;
    // entities
    let userEntity: ConcreteEntityAdapter;
    let accountEntity: ConcreteEntityAdapter;

    // relationships
    let userAccounts: RelationshipAdapter;

    // user attributes
    let id: AttributeAdapter;
    let name: AttributeAdapter;
    let createdAt: AttributeAdapter;
    let releaseDate: AttributeAdapter;
    let runningTime: AttributeAdapter;
    let accountSize: AttributeAdapter;
    let favoriteColors: AttributeAdapter;
    let password: AttributeAdapter;

    // hasAccount relationship attributes
    let creationTime: AttributeAdapter;

    // account attributes
    let status: AttributeAdapter;
    let aOrB: AttributeAdapter;
    let point: AttributeAdapter;
    let points: AttributeAdapter;
    let cartesianPoint: AttributeAdapter;

    beforeAll(() => {
        const typeDefs = gql`
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
                creationTime: DateTime!
            }

            type A {
                id: ID
            }

            type B {
                age: Int
            }

            union AorB = A | B

            enum Status {
                ACTIVATED
                DISABLED
            }

            type Account {
                status: Status
                point: Point
                points: [Point!]!
                cartesianPoint: CartesianPoint
                aOrB: AorB
            }

            extend type User {
                password: String!
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        schemaModel = generateModel(document);

        // entities
        userEntity = schemaModel.getConcreteEntityAdapter("User") as ConcreteEntityAdapter;
        userAccounts = userEntity.relationships.get("accounts") as RelationshipAdapter;
        accountEntity = userAccounts.target as ConcreteEntityAdapter; // it's possible to obtain accountEntity using schemaModel.getConcreteEntityAdapter("Account") as well

        // user attributes
        id = userEntity?.attributes.get("id") as AttributeAdapter;
        name = userEntity?.attributes.get("name") as AttributeAdapter;
        createdAt = userEntity?.attributes.get("createdAt") as AttributeAdapter;
        releaseDate = userEntity?.attributes.get("releaseDate") as AttributeAdapter;
        runningTime = userEntity?.attributes.get("runningTime") as AttributeAdapter;
        accountSize = userEntity?.attributes.get("accountSize") as AttributeAdapter;
        favoriteColors = userEntity?.attributes.get("favoriteColors") as AttributeAdapter;

        // extended attributes
        password = userEntity?.attributes.get("password") as AttributeAdapter;

        // hasAccount relationship attributes
        creationTime = userAccounts?.attributes.get("creationTime") as AttributeAdapter;

        // account attributes
        status = accountEntity?.attributes.get("status") as AttributeAdapter;
        aOrB = accountEntity?.attributes.get("aOrB") as AttributeAdapter;
        point = accountEntity?.attributes.get("point") as AttributeAdapter;
        points = accountEntity?.attributes.get("points") as AttributeAdapter;
        cartesianPoint = accountEntity?.attributes.get("cartesianPoint") as AttributeAdapter;
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
            expect(createdAt.isTemporal()).toBe(true);
            expect(creationTime.isDateTime()).toBe(true);
            expect(creationTime.isGraphQLBuiltInScalar()).toBe(false);
            expect(creationTime.isTemporal()).toBe(true);
        });

        test("Date", () => {
            expect(releaseDate.isDate()).toBe(true);
            expect(releaseDate.isGraphQLBuiltInScalar()).toBe(false);
            expect(releaseDate.isTemporal()).toBe(true);
        });

        test("Time", () => {
            expect(runningTime.isTime()).toBe(true);
            expect(runningTime.isGraphQLBuiltInScalar()).toBe(false);
            expect(runningTime.isTemporal()).toBe(true);
        });

        test("BigInt", () => {
            expect(accountSize.isBigInt()).toBe(true);
            expect(accountSize.isGraphQLBuiltInScalar()).toBe(false);
        });

        test("Enum", () => {
            expect(status.isEnum()).toBe(true);
            expect(status.isGraphQLBuiltInScalar()).toBe(false);
        });

        test("Union", () => {
            expect(aOrB.isUnion()).toBe(true);
            expect(aOrB.isGraphQLBuiltInScalar()).toBe(false);
            expect(aOrB.isAbstract()).toBe(true);
        });

        test("Point", () => {
            expect(point.isPoint({ includeLists: false })).toBe(true);
            expect(point.isPoint({ includeLists: true })).toBe(true);
            expect(point.isGraphQLBuiltInScalar()).toBe(false);
            expect(points.isPoint({ includeLists: false })).toBeFalse();
            expect(points.isPoint({ includeLists: true })).toBeTrue();
            expect(points.isGraphQLBuiltInScalar()).toBe(false);
        });

        test("CartesianPoint", () => {
            expect(cartesianPoint.isCartesianPoint({ includeLists: false })).toBe(true);
            expect(cartesianPoint.isCartesianPoint({ includeLists: true })).toBe(true);
            expect(cartesianPoint.isGraphQLBuiltInScalar()).toBe(false);
        });

        test("List", () => {
            expect(favoriteColors.isList()).toBe(true);
            expect(favoriteColors.isString()).toBe(true);
            expect(favoriteColors.isString({ includeLists: false })).toBe(false);
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
