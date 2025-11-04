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
import type { Neo4jGraphQLSchemaModel } from "./Neo4jGraphQLSchemaModel";
import { AuthenticationAnnotation } from "./annotation/AuthenticationAnnotation";
import {
    AuthorizationFilterOperationRule,
    AuthorizationValidateOperationRule,
} from "./annotation/AuthorizationAnnotation";
import { SubscriptionsAuthorizationFilterEventRule } from "./annotation/SubscriptionsAuthorizationAnnotation";
import { GraphQLBuiltInScalarType, ListType, ObjectType } from "./attribute/AttributeType";
import type { AttributeTypeHelper } from "./attribute/AttributeTypeHelper";
import type { ConcreteEntity } from "./entity/ConcreteEntity";
import { InterfaceEntity } from "./entity/InterfaceEntity";
import { UnionEntity } from "./entity/UnionEntity";
import type { ConcreteEntityAdapter } from "./entity/model-adapters/ConcreteEntityAdapter";
import { generateModel } from "./generate-model";
import type { RelationshipAdapter } from "./relationship/model-adapters/RelationshipAdapter";

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
            expect(userEntity?.annotations.authorization).toBeDefined();
        });

        test("creates the authorization annotation on password field", () => {
            const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
            expect(userEntity?.attributes.get("password")?.annotations).toHaveProperty("authorization");
            const authAnnotation = userEntity?.attributes.get("password")?.annotations.authorization;

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
            expect(authAnnotation?.validate).toEqual([]);
        });

        test("authorization annotation is correct on User entity", () => {
            const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
            const authAnnotation = userEntity?.annotations.authorization;
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
            expect(userEntity?.annotations.subscriptionsAuthorization).toBeDefined();
        });

        test("creates the subscriptionsAuthorization annotation on password field", () => {
            const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
            expect(userEntity?.attributes.get("password")?.annotations).toHaveProperty("subscriptionsAuthorization");
            const authAnnotation = userEntity?.attributes.get("password")?.annotations.subscriptionsAuthorization;

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
            const authAnnotation = userEntity?.annotations.subscriptionsAuthorization;
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

            interface Animal {
                favoriteFood: String
            }

            interface Human {
                id: ID!
            }

            type User implements Human & Animal
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
        expect(schemaModel.compositeEntities).toHaveLength(3); // Human, Animal, Tool
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

    test("concrete entity has correct references of the composite entities that implements", () => {
        const userEntity = schemaModel.concreteEntities.find((e) => e.name === "User");
        expect(userEntity?.compositeEntities).toBeArrayOfSize(2);
        expect(userEntity?.compositeEntities.map((e) => e.name)).toStrictEqual(
            expect.arrayContaining(["Human", "Animal"])
        );
        const pencilEntity = schemaModel.concreteEntities.find((e) => e.name === "Pencil");
        expect(pencilEntity?.compositeEntities).toBeArrayOfSize(1);
        expect(pencilEntity?.compositeEntities.map((e) => e.name)).toStrictEqual(expect.arrayContaining(["Tool"]));
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
                favoriteActors: [Actor!]! @declareRelationship
            }

            interface Human implements Person {
                favoriteActors: [Actor!]! @declareRelationship
            }

            interface Worker implements Person {
                favoriteActors: [Actor!]!
            }

            type hasAccount @relationshipProperties {
                creationTime: DateTime!
            }

            union Show = Movie | TvShow

            type Actor {
                name: String
            }

            interface Production {
                actors: [Actor!]! @declareRelationship
            }

            type Movie implements Production {
                name: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
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
                favoriteActors: [Actor!]! @relationship(type: "LIKES", direction: OUT)
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
        const actors = productionEntity?.relationshipDeclarations.get("actors");
        expect(actors).toBeDefined();
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
        const actors = humanEntity?.relationshipDeclarations.get("favoriteActors");
        expect(actors).toBeDefined();
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
        const userQuery = userEntity?.annotations.query;
        expect(userQuery).toBeDefined();
        expect(userQuery?.read).toBe(true);
        expect(userQuery?.aggregate).toBe(false);

        const userMutation = userEntity?.annotations.mutation;
        expect(userMutation).toBeDefined();
        expect(userMutation?.operations).toStrictEqual(new Set(["CREATE", "UPDATE", "DELETE"]));

        const userSubscription = userEntity?.annotations.subscription;
        expect(userSubscription).toBeDefined();
        expect(userSubscription?.events).toStrictEqual(
            new Set(["CREATED", "UPDATED", "DELETED", "RELATIONSHIP_CREATED", "RELATIONSHIP_DELETED"])
        );

        const accountSubscription = accountEntity?.annotations.subscription;
        expect(accountSubscription).toBeDefined();
        expect(accountSubscription?.events).toStrictEqual(new Set(["CREATED"]));
    });

    test("attributes should be generated with the correct annotations", () => {
        const userName = userEntity?.attributes.get("name");
        expect(userName?.annotations.selectable).toBeDefined();
        expect(userName?.annotations.selectable?.onRead).toBe(true);
        expect(userName?.annotations.selectable?.onAggregate).toBe(true);

        expect(userName?.databaseName).toBeDefined();
        expect(userName?.databaseName).toBe("dbName");

        const defaultName = userEntity?.attributes.get("defaultName");
        expect(defaultName).toBeDefined();
        expect(defaultName?.annotations.default).toBeDefined();
        expect(defaultName?.annotations.default?.value).toBe("John");

        const age = userEntity?.attributes.get("age");
        expect(age).toBeDefined();
        expect(age?.annotations.populatedBy).toBeDefined();
        expect(age?.annotations.populatedBy?.callback).toBe("thisCallback");
        expect(age?.annotations.populatedBy?.operations).toStrictEqual(["CREATE"]);

        const accountName = accountEntity?.attributes.get("accountName");
        expect(accountName?.annotations.settable).toBeDefined();
        expect(accountName?.annotations.settable?.onCreate).toBe(false);
        expect(accountName?.annotations.settable?.onUpdate).toBe(true);

        expect(accountName?.databaseName).toBeDefined();
        expect(accountName?.databaseName).toBe("accountName");
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
        expect(productionYear?.annotations.populatedBy).toBeDefined();
        expect(productionYear?.annotations.populatedBy?.callback).toBe("thisCallback");
        expect(productionYear?.annotations.populatedBy?.operations).toStrictEqual(["CREATE"]);

        const movieYear = movieEntity?.attributes.get("year");
        expect(movieYear?.annotations.populatedBy).toBeUndefined();

        const showYear = showEntity?.attributes.get("year");
        expect(showYear?.annotations.populatedBy).toBeDefined();
        expect(showYear?.annotations.populatedBy?.callback).toBe("thisOtherCallback");
        expect(showYear?.annotations.populatedBy?.operations).toStrictEqual(["CREATE"]);

        const productionDefaultName = productionEntity?.attributes.get("defaultName");
        expect(productionDefaultName).toBeDefined();
        expect(productionDefaultName?.annotations.default).toBeDefined();
        expect(productionDefaultName?.annotations.default?.value).toBe("AwesomeProduction");

        const movieDefaultName = movieEntity?.attributes.get("defaultName");
        expect(movieDefaultName).toBeDefined();
        expect(movieDefaultName?.annotations.default).toBeUndefined();

        const showDefaultName = showEntity?.attributes.get("defaultName");
        expect(showDefaultName).toBeDefined();
        expect(showDefaultName?.annotations.default).toBeDefined();
        expect(showDefaultName?.annotations.default?.value).toBe("AwesomeShow");

        const productionAliasedProp = productionEntity?.attributes.get("aliasedProp");
        const movieAliasedProp = movieEntity?.attributes.get("aliasedProp");
        const showAliasedProp = showEntity?.attributes.get("aliasedProp");
        expect(productionAliasedProp?.databaseName).toBeDefined();
        expect(productionAliasedProp?.databaseName).toBe("dbName");
        expect(movieAliasedProp?.databaseName).toBeDefined();
        expect(movieAliasedProp?.databaseName).toBe("movieDbName");
        expect(showAliasedProp?.databaseName).toBeDefined();
        expect(showAliasedProp?.databaseName).toBe("aliasedProp");
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
        expect(productionYear?.annotations.populatedBy).toBeDefined();
        expect(productionYear?.annotations.populatedBy?.callback).toBe("thisCallback");
        expect(productionYear?.annotations.populatedBy?.operations).toStrictEqual(["CREATE"]);

        const tvProductionYear = tvProductionEntity?.attributes.get("year");
        expect(tvProductionYear?.annotations.populatedBy).toBeUndefined();

        const showYear = showEntity?.attributes.get("year");
        expect(showYear?.annotations.populatedBy).toBeDefined();
        expect(showYear?.annotations.populatedBy?.callback).toBe("thisOtherCallback");
        expect(showYear?.annotations.populatedBy?.operations).toStrictEqual(["CREATE"]);

        const productionDefaultName = productionEntity?.attributes.get("defaultName");
        expect(productionDefaultName).toBeDefined();
        expect(productionDefaultName?.annotations.default).toBeDefined();
        expect(productionDefaultName?.annotations.default?.value).toBe("AwesomeProduction");

        const tvProductionDefaultName = tvProductionEntity?.attributes.get("defaultName");
        expect(tvProductionDefaultName).toBeDefined();
        expect(tvProductionDefaultName?.annotations.default).toBeUndefined();

        const showDefaultName = showEntity?.attributes.get("defaultName");
        expect(showDefaultName).toBeDefined();
        expect(showDefaultName?.annotations.default).toBeDefined();
        expect(showDefaultName?.annotations.default?.value).toBe("AwesomeShow");

        const productionAliasedProp = productionEntity?.attributes.get("aliasedProp");
        const tvProductionAliasedProp = tvProductionEntity?.attributes.get("aliasedProp");
        const showAliasedProp = showEntity?.attributes.get("aliasedProp");
        expect(productionAliasedProp?.databaseName).toBeDefined();
        expect(productionAliasedProp?.databaseName).toBe("dbName");
        expect(tvProductionAliasedProp?.databaseName).toBeDefined();
        expect(tvProductionAliasedProp?.databaseName).toBe("movieDbName");
        expect(showAliasedProp?.databaseName).toBeDefined();
        expect(showAliasedProp?.databaseName).toBe("aliasedProp");
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
    let id: AttributeTypeHelper;
    let name: AttributeTypeHelper;
    let createdAt: AttributeTypeHelper;
    let releaseDate: AttributeTypeHelper;
    let runningTime: AttributeTypeHelper;
    let accountSize: AttributeTypeHelper;
    let favoriteColors: AttributeTypeHelper;
    let password: AttributeTypeHelper;

    // hasAccount relationship attributes
    let creationTime: AttributeTypeHelper;

    // account attributes
    let status: AttributeTypeHelper;
    let aOrB: AttributeTypeHelper;
    let point: AttributeTypeHelper;
    let points: AttributeTypeHelper;
    let cartesianPoint: AttributeTypeHelper;

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

            type hasAccount @relationshipProperties {
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
        id = userEntity?.attributes.get("id")?.typeHelper as AttributeTypeHelper;
        name = userEntity?.attributes.get("name")?.typeHelper as AttributeTypeHelper;
        createdAt = userEntity?.attributes.get("createdAt")?.typeHelper as AttributeTypeHelper;
        releaseDate = userEntity?.attributes.get("releaseDate")?.typeHelper as AttributeTypeHelper;
        runningTime = userEntity?.attributes.get("runningTime")?.typeHelper as AttributeTypeHelper;
        accountSize = userEntity?.attributes.get("accountSize")?.typeHelper as AttributeTypeHelper;
        favoriteColors = userEntity?.attributes.get("favoriteColors")?.typeHelper as AttributeTypeHelper;

        // extended attributes
        password = userEntity?.attributes.get("password")?.typeHelper as AttributeTypeHelper;

        // hasAccount relationship attributes
        creationTime = userAccounts?.attributes.get("creationTime")?.typeHelper as AttributeTypeHelper;

        // account attributes
        status = accountEntity?.attributes.get("status")?.typeHelper as AttributeTypeHelper;
        aOrB = accountEntity?.attributes.get("aOrB")?.typeHelper as AttributeTypeHelper;
        point = accountEntity?.attributes.get("point")?.typeHelper as AttributeTypeHelper;
        points = accountEntity?.attributes.get("points")?.typeHelper as AttributeTypeHelper;
        cartesianPoint = accountEntity?.attributes.get("cartesianPoint")?.typeHelper as AttributeTypeHelper;
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
