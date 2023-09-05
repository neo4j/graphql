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
import { InterfaceEntity } from "./entity/InterfaceEntity";
import { UnionEntity } from "./entity/UnionEntity";
import { GraphQLBuiltInScalarType, ListType, ObjectType } from "./attribute/AttributeType";

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

    test("composite entities has correct type", () => {
        const toolEntities = schemaModel.compositeEntities.find((e) => e.name === "Tool");
        expect(toolEntities).toBeInstanceOf(UnionEntity);
        const humanEntities = schemaModel.compositeEntities.find((e) => e.name === "Human");
        expect(humanEntities).toBeInstanceOf(InterfaceEntity);
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

            interface Person {
                favoriteActors: [Actor!]! @relationship(type: "FAVORITE_ACTOR", direction: OUT)
            }

            interface Human implements Person {
                favoriteActors: [Actor!]! @relationship(type: "LIKES", direction: OUT)
            }

            interface Worker implements Person {
                favoriteActors: [Actor!]!
            }

            interface hasAccount @relationshipProperties {
                creationTime: DateTime!
            }

            union Show = Movie | TvShow

            type Actor {
                name: String
            }

            interface Production {
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie implements Production {
                name: String!
                actors: [Actor!]!
            }

            type TvShow implements Production {
                name: String!
                episodes: Int
                actors: [Actor!]! @relationship(type: "STARED_IN", direction: OUT)
            }

            type Account {
                id: ID!
                username: String!
            }

            extend type User implements Worker & Human & Person {
                password: String! @authorization(filter: [{ where: { node: { id: { equals: "$jwt.sub" } } } }])
                favoriteActors: [Actor!]!
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

    test("composite interface entity has correct relationship", () => {
        const productionEntity = schemaModel.compositeEntities.find((e) => e.name === "Production") as InterfaceEntity;
        const actors = productionEntity?.relationships.get("actors");
        expect(actors).toBeDefined();
        expect(actors?.type).toBe("ACTED_IN");
        expect(actors?.direction).toBe("OUT");
        expect(actors?.queryDirection).toBe("DEFAULT_DIRECTED");
        expect(actors?.nestedOperations).toEqual([
            "CREATE",
            "UPDATE",
            "DELETE",
            "CONNECT",
            "DISCONNECT",
            "CONNECT_OR_CREATE",
        ]);
        expect(actors?.target.name).toBe("Actor");
    });

    test("concrete entity has inherited relationship", () => {
        const movieEntity = schemaModel.concreteEntities.find((e) => e.name === "Movie");
        const actors = movieEntity?.relationships.get("actors");
        expect(actors).toBeDefined();
        expect(actors?.type).toBe("ACTED_IN");
        expect(actors?.direction).toBe("OUT");
        expect(actors?.queryDirection).toBe("DEFAULT_DIRECTED");
        expect(actors?.nestedOperations).toEqual([
            "CREATE",
            "UPDATE",
            "DELETE",
            "CONNECT",
            "DISCONNECT",
            "CONNECT_OR_CREATE",
        ]);
        expect(actors?.target.name).toBe("Actor");
    });

    test("concrete entity has overwritten the inherited relationship", () => {
        const showEntity = schemaModel.concreteEntities.find((e) => e.name === "TvShow");
        const actors = showEntity?.relationships.get("actors");
        expect(actors).toBeDefined();
        expect(actors?.type).toBe("STARED_IN");
        expect(actors?.direction).toBe("OUT");
        expect(actors?.queryDirection).toBe("DEFAULT_DIRECTED");
        expect(actors?.nestedOperations).toEqual([
            "CREATE",
            "UPDATE",
            "DELETE",
            "CONNECT",
            "DISCONNECT",
            "CONNECT_OR_CREATE",
        ]);
        expect(actors?.target.name).toBe("Actor");
    });

    test("composite entity has overwritten the inherited relationship", () => {
        const humanEntity = schemaModel.compositeEntities.find((e) => e.name === "Human") as InterfaceEntity;
        const actors = humanEntity?.relationships.get("favoriteActors");
        expect(actors).toBeDefined();
        expect(actors?.type).toBe("LIKES");
        expect(actors?.direction).toBe("OUT");
        expect(actors?.queryDirection).toBe("DEFAULT_DIRECTED");
        expect(actors?.nestedOperations).toEqual([
            "CREATE",
            "UPDATE",
            "DELETE",
            "CONNECT",
            "DISCONNECT",
            "CONNECT_OR_CREATE",
        ]);
        expect(actors?.target.name).toBe("Actor");
    });

    test("composite entity has inherited relationship", () => {
        const workerEntity = schemaModel.compositeEntities.find((e) => e.name === "Worker") as InterfaceEntity;
        const actors = workerEntity?.relationships.get("favoriteActors");
        expect(actors).toBeDefined();
        expect(actors?.type).toBe("FAVORITE_ACTOR");
        expect(actors?.direction).toBe("OUT");
        expect(actors?.queryDirection).toBe("DEFAULT_DIRECTED");
        expect(actors?.nestedOperations).toEqual([
            "CREATE",
            "UPDATE",
            "DELETE",
            "CONNECT",
            "DISCONNECT",
            "CONNECT_OR_CREATE",
        ]);
        expect(actors?.target.name).toBe("Actor");
    });

    test("concrete entity has inherited relationship of first implemented interface with defined relationship", () => {
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        const actors = userEntity?.relationships.get("favoriteActors");
        expect(actors).toBeDefined();
        expect(actors?.type).toBe("LIKES");
        expect(actors?.direction).toBe("OUT");
        expect(actors?.queryDirection).toBe("DEFAULT_DIRECTED");
        expect(actors?.nestedOperations).toEqual([
            "CREATE",
            "UPDATE",
            "DELETE",
            "CONNECT",
            "DISCONNECT",
            "CONNECT_OR_CREATE",
        ]);
        expect(actors?.target.name).toBe("Actor");
    });
});

describe("ConcreteEntity Annotations & Attributes", () => {
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

describe("ComposeEntity Annotations & Attributes and Inheritance", () => {
    test("concrete entity inherits from composite entity", () => {
        const typeDefs = gql`
            interface Production {
                year: Int @populatedBy(callback: "thisCallback", operations: [CREATE])
                defaultName: String! @default(value: "AwesomeProduction")
                aliasedProp: String! @alias(property: "dbName")
            }

            type Movie implements Production {
                name: String!
                year: Int
                defaultName: String!
                aliasedProp: String! @alias(property: "movieDbName")
            }

            type TvShow implements Production {
                name: String!
                episodes: Int
                year: Int @populatedBy(callback: "thisOtherCallback", operations: [CREATE])
                aliasedProp: String!
            }

            extend type TvShow {
                defaultName: String! @default(value: "AwesomeShow")
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        const schemaModel = generateModel(document);
        const movieEntity = schemaModel.concreteEntities.find((e) => e.name === "Movie") as ConcreteEntity;
        const showEntity = schemaModel.concreteEntities.find((e) => e.name === "TvShow") as ConcreteEntity;
        const productionEntity = schemaModel.compositeEntities.find((e) => e.name === "Production") as InterfaceEntity;

        const productionYear = productionEntity?.attributes.get("year");
        expect(productionYear?.annotations[AnnotationsKey.populatedBy]).toBeDefined();
        expect(productionYear?.annotations[AnnotationsKey.populatedBy]?.callback).toBe("thisCallback");
        expect(productionYear?.annotations[AnnotationsKey.populatedBy]?.operations).toStrictEqual(["CREATE"]);

        const movieYear = movieEntity?.attributes.get("year");
        expect(movieYear?.annotations[AnnotationsKey.populatedBy]).toBeDefined();
        expect(movieYear?.annotations[AnnotationsKey.populatedBy]?.callback).toBe("thisCallback");
        expect(movieYear?.annotations[AnnotationsKey.populatedBy]?.operations).toStrictEqual(["CREATE"]);

        const showYear = showEntity?.attributes.get("year");
        expect(showYear?.annotations[AnnotationsKey.populatedBy]).toBeDefined();
        expect(showYear?.annotations[AnnotationsKey.populatedBy]?.callback).toBe("thisOtherCallback");
        expect(showYear?.annotations[AnnotationsKey.populatedBy]?.operations).toStrictEqual(["CREATE"]);

        const productionDefaultName = productionEntity?.attributes.get("defaultName");
        expect(productionDefaultName).toBeDefined();
        expect(productionDefaultName?.annotations[AnnotationsKey.default]).toBeDefined();
        expect(productionDefaultName?.annotations[AnnotationsKey.default]?.value).toBe("AwesomeProduction");

        const movieDefaultName = movieEntity?.attributes.get("defaultName");
        expect(movieDefaultName).toBeDefined();
        expect(movieDefaultName?.annotations[AnnotationsKey.default]).toBeDefined();
        expect(movieDefaultName?.annotations[AnnotationsKey.default]?.value).toBe("AwesomeProduction");

        const showDefaultName = showEntity?.attributes.get("defaultName");
        expect(showDefaultName).toBeDefined();
        expect(showDefaultName?.annotations[AnnotationsKey.default]).toBeDefined();
        expect(showDefaultName?.annotations[AnnotationsKey.default]?.value).toBe("AwesomeShow");

        const productionAliasedProp = productionEntity?.attributes.get("aliasedProp");
        const movieAliasedProp = movieEntity?.attributes.get("aliasedProp");
        const showAliasedProp = showEntity?.attributes.get("aliasedProp");
        expect(productionAliasedProp?.databaseName).toBeDefined();
        expect(productionAliasedProp?.databaseName).toBe("dbName");
        expect(movieAliasedProp?.databaseName).toBeDefined();
        expect(movieAliasedProp?.databaseName).toBe("movieDbName");
        expect(showAliasedProp?.databaseName).toBeDefined();
        expect(showAliasedProp?.databaseName).toBe("dbName");
    });

    test("composite entity inherits from composite entity", () => {
        const typeDefs = gql`
            interface Production {
                year: Int @populatedBy(callback: "thisCallback", operations: [CREATE])
                defaultName: String! @default(value: "AwesomeProduction")
                aliasedProp: String! @alias(property: "dbName")
            }

            interface TvProduction implements Production {
                name: String!
                year: Int
                defaultName: String!
                aliasedProp: String! @alias(property: "movieDbName")
            }

            type TvShow implements TvProduction & Production {
                name: String!
                episodes: Int
                year: Int @populatedBy(callback: "thisOtherCallback", operations: [CREATE])
                aliasedProp: String!
            }

            extend type TvShow {
                defaultName: String! @default(value: "AwesomeShow")
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        const schemaModel = generateModel(document);
        const tvProductionEntity = schemaModel.compositeEntities.find(
            (e) => e.name === "TvProduction"
        ) as InterfaceEntity;
        const showEntity = schemaModel.concreteEntities.find((e) => e.name === "TvShow") as ConcreteEntity;
        const productionEntity = schemaModel.compositeEntities.find((e) => e.name === "Production") as InterfaceEntity;

        const productionYear = productionEntity?.attributes.get("year");
        expect(productionYear?.annotations[AnnotationsKey.populatedBy]).toBeDefined();
        expect(productionYear?.annotations[AnnotationsKey.populatedBy]?.callback).toBe("thisCallback");
        expect(productionYear?.annotations[AnnotationsKey.populatedBy]?.operations).toStrictEqual(["CREATE"]);

        const tvProductionYear = tvProductionEntity?.attributes.get("year");
        expect(tvProductionYear?.annotations[AnnotationsKey.populatedBy]).toBeDefined();
        expect(tvProductionYear?.annotations[AnnotationsKey.populatedBy]?.callback).toBe("thisCallback");
        expect(tvProductionYear?.annotations[AnnotationsKey.populatedBy]?.operations).toStrictEqual(["CREATE"]);

        const showYear = showEntity?.attributes.get("year");
        expect(showYear?.annotations[AnnotationsKey.populatedBy]).toBeDefined();
        expect(showYear?.annotations[AnnotationsKey.populatedBy]?.callback).toBe("thisOtherCallback");
        expect(showYear?.annotations[AnnotationsKey.populatedBy]?.operations).toStrictEqual(["CREATE"]);

        const productionDefaultName = productionEntity?.attributes.get("defaultName");
        expect(productionDefaultName).toBeDefined();
        expect(productionDefaultName?.annotations[AnnotationsKey.default]).toBeDefined();
        expect(productionDefaultName?.annotations[AnnotationsKey.default]?.value).toBe("AwesomeProduction");

        const tvProductionDefaultName = tvProductionEntity?.attributes.get("defaultName");
        expect(tvProductionDefaultName).toBeDefined();
        expect(tvProductionDefaultName?.annotations[AnnotationsKey.default]).toBeDefined();
        expect(tvProductionDefaultName?.annotations[AnnotationsKey.default]?.value).toBe("AwesomeProduction");

        const showDefaultName = showEntity?.attributes.get("defaultName");
        expect(showDefaultName).toBeDefined();
        expect(showDefaultName?.annotations[AnnotationsKey.default]).toBeDefined();
        expect(showDefaultName?.annotations[AnnotationsKey.default]?.value).toBe("AwesomeShow");

        const productionAliasedProp = productionEntity?.attributes.get("aliasedProp");
        const tvProductionAliasedProp = tvProductionEntity?.attributes.get("aliasedProp");
        const showAliasedProp = showEntity?.attributes.get("aliasedProp");
        expect(productionAliasedProp?.databaseName).toBeDefined();
        expect(productionAliasedProp?.databaseName).toBe("dbName");
        expect(tvProductionAliasedProp?.databaseName).toBeDefined();
        expect(tvProductionAliasedProp?.databaseName).toBe("movieDbName");
        expect(showAliasedProp?.databaseName).toBeDefined();
        expect(showAliasedProp?.databaseName).toBe("movieDbName"); // first one listed in the implements list decides
    });
});

describe("Arguments", () => {
    test("attribute argument scalar", () => {
        const typeDefs = gql`
            type User {
                id: ID!
                name(something: Int): String!
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        const schemaModel = generateModel(document);
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        expect(userEntity?.attributes.has("id")).toBeTrue();
        expect(userEntity?.attributes.has("name")).toBeTrue();
        const idAttribute = userEntity?.findAttribute("id");
        expect(idAttribute?.args).toHaveLength(0);
        const nameAttribute = userEntity?.findAttribute("name");
        expect(nameAttribute?.args).toHaveLength(1);
        expect(nameAttribute?.args[0]?.name).toBe("something");
        expect(nameAttribute?.args[0]?.type.name).toBe(GraphQLBuiltInScalarType.Int);
        expect(nameAttribute?.args[0]?.type.isRequired).toBeFalse();
    });

    test("attribute argument object", () => {
        const typeDefs = gql`
            type User {
                id: ID!
                favoritePet(from: [Animal]!): String!
            }
            type Animal {
                sound: String
            }
        `;

        const document = mergeTypeDefs(typeDefs);
        const schemaModel = generateModel(document);
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        expect(userEntity?.attributes.has("id")).toBeTrue();
        expect(userEntity?.attributes.has("favoritePet")).toBeTrue();
        const idAttribute = userEntity?.findAttribute("id");
        expect(idAttribute?.args).toHaveLength(0);
        const favoritePetAttribute = userEntity?.findAttribute("favoritePet");
        expect(favoritePetAttribute?.args).toHaveLength(1);
        expect(favoritePetAttribute?.args[0]?.name).toBe("from");
        expect(favoritePetAttribute?.args[0]?.type).toEqual(new ListType(new ObjectType("Animal", false), true));
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
