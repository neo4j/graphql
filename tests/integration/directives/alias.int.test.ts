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

import * as neo4jDriver from "neo4j-driver";
import { generate } from "randomstring";
import { createBearerToken } from "../../utils/create-bearer-token";
import { TestHelper } from "../../utils/tests-helper";

describe("@alias directive", () => {
    const testHelper = new TestHelper();

    const dbName = generate({ charset: "alphabetic" });
    const dbComment = generate({ charset: "alphabetic" });
    const dbTitle = generate({ charset: "alphabetic" });
    const year = neo4jDriver.int(2015);
    const secret = "secret";

    const AliasDirectiveTestUser = testHelper.createUniqueType("AliasDirectiveTestUser");
    const AliasDirectiveTestMovie = testHelper.createUniqueType("AliasDirectiveTestMovie");
    const ProtectedUser = testHelper.createUniqueType("ProtectedUser");

    beforeEach(async () => {
        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            interface AliasInterface {
                id: ID!
                name: String! 
            }

            type ${AliasDirectiveTestUser} implements AliasInterface {
                id: ID! @id @unique  @alias(property: "dbId")
                name: String! @alias(property: "dbName")
                likes: [${AliasDirectiveTestMovie}!]! @relationship(direction: OUT, type: "LIKES", properties: "AliasDirectiveTestLikesProps")
                createdAt: DateTime! @timestamp(operations: [CREATE]) @alias(property: "dbCreatedAt")
            }

            type ${AliasDirectiveTestMovie} {
                title: String! @alias(property: "dbTitle")
                titleAuth: String @alias(property: "dbTitle") @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "reader" } } }])
                year: Int
                createdAt: DateTime! @timestamp(operations: [CREATE]) @alias(property: "dbCreatedAt")
            }

            type AliasDirectiveTestLikesProps @relationshipProperties {
                comment: String! @alias(property: "dbComment")
                relationshipCreatedAt: DateTime! @timestamp(operations: [CREATE]) @alias(property: "dbCreatedAt")
            }

            type ${ProtectedUser} @authorization(validate: [{ when: [BEFORE], where: { node: { name: "$jwt.sub" } } }]) {
                name: String! @alias(property: "dbName")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
        await testHelper.executeCypher(
            `MATCH (n:${AliasDirectiveTestUser})-[]-(m:${AliasDirectiveTestMovie}) DETACH DELETE n, m`
        );
        await testHelper.executeCypher(
            `CREATE (:${AliasDirectiveTestUser} {dbName: $dbName, dbId: "stringId", dbCreatedAt: "1970-01-02"})-[:LIKES {dbComment: $dbComment, dbCreatedAt: "1970-01-02"}]->(:${AliasDirectiveTestMovie} {dbTitle: $dbTitle, year: $year, dbCreatedAt: "1970-01-02"})
            CREATE (:${ProtectedUser} {dbName: $dbName})`,
            { dbName, dbComment, dbTitle, year }
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Aliased fields on nodes through simple relationships (using STARTS_WITH filter)", async () => {
        const usersQuery = `
            query UsersLikesMovies {
                ${AliasDirectiveTestUser.plural}(where: {name_STARTS_WITH: "${dbName.substring(0, 6)}"}) {
                    id
                    name
                    likes {
                        title
                        titleAuth
                        year
                    }
                }
            }
        `;

        // For the @auth
        const token = createBearerToken(secret, { roles: ["reader"] });

        const gqlResult = await testHelper.executeGraphQLWithToken(usersQuery, token);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[AliasDirectiveTestUser.plural][0]).toEqual({
            name: dbName,
            id: expect.any(String),
            likes: [
                {
                    title: dbTitle,
                    titleAuth: dbTitle,
                    year: year.toNumber(),
                },
            ],
        });
    });

    test("Works with type level auth", async () => {
        const protectedUsersQuery = `
            query ProtectedUsersQ {
                ${ProtectedUser.plural} {
                    name
                }
            }
        `;

        // For the @auth
        const tokenSub = dbName;
        const token = createBearerToken(secret, { roles: ["reader"], sub: tokenSub });

        const gqlResult = await testHelper.executeGraphQLWithToken(protectedUsersQuery, token);

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[ProtectedUser.plural][0]).toEqual({ name: dbName });
    });
    test("Aliased fields on nodes through connections (incl. rel props)", async () => {
        const usersQuery = /* GraphQL */ `
            query UsersLikesMovies {
                ${AliasDirectiveTestUser.plural} {
                    name
                    likesConnection {
                        edges {
                            properties {
                                comment
                            }
                            node {
                                title
                                year
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(usersQuery);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[AliasDirectiveTestUser.plural][0]).toEqual({
            name: dbName,
            likesConnection: {
                edges: [
                    {
                        properties: { comment: dbComment },
                        node: {
                            title: dbTitle,
                            year: year.toNumber(),
                        },
                    },
                ],
            },
        });
    });

    test("Using GraphQL query alias with @alias (using CONTAINS filter)", async () => {
        const usersQuery = /* GraphQL */ `
            query UsersLikesMovies {
                ${AliasDirectiveTestUser.plural}(where: {name_CONTAINS: "${dbName.substring(0, 6)}"}) {
                    myName: name
                    likesConnection {
                        edges {
                           properties {
                             myComment: comment 
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(usersQuery);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[AliasDirectiveTestUser.plural][0]).toEqual({
            myName: dbName,
            likesConnection: { edges: [{ properties: { myComment: dbComment } }] },
        });
    });

    test("E2E with create mutation with @alias", async () => {
        const name = "Stella";
        const title = "Interstellar";
        const comment = "Yes!";
        const userMutation = `
        mutation CreateUser {
            ${AliasDirectiveTestUser.operations.create}(
                input: [{ name: "${name}", likes: { create: { edge: {comment: "${comment}"}, node: { title: "${title}", year: ${year} } } } }]
            ) {
                ${AliasDirectiveTestUser.plural} {
                    name
                    createdAt
                    likes {
                        createdAt
                        title
                        year
                    }
                    likesConnection {
                        edges {
                            properties {
                                relationshipCreatedAt
                                comment
                            }
                            node {
                                title
                                year
                            }
                        }
                    }
                }
            }
        }
        `;

        const gqlResult = await testHelper.executeGraphQL(userMutation);

        expect(gqlResult.errors).toBeFalsy();

        expect(
            (gqlResult.data as any)[AliasDirectiveTestUser.operations.create][AliasDirectiveTestUser.plural][0]
        ).toEqual({
            name,
            createdAt: expect.any(String),
            likes: [
                {
                    title,
                    createdAt: expect.any(String),
                    year: year.toNumber(),
                },
            ],
            likesConnection: {
                edges: [
                    {
                        properties: {
                            relationshipCreatedAt: expect.any(String),
                            comment,
                        },
                        node: {
                            title,
                            year: year.toNumber(),
                        },
                    },
                ],
            },
        });
    });
    test("E2E with connect mutation with @alias", async () => {
        const name = "Stella";
        const title = "Interstellar 2";
        const comment = "Yes!";
        await testHelper.executeCypher(
            `CREATE (m:${AliasDirectiveTestMovie} {dbTitle: "${title}", year: toInteger(2015), dbCreatedAt: "2021-08-25"})`
        );
        const userMutation = `
        mutation CreateUserConnectMovie {
            ${AliasDirectiveTestUser.operations.create}(
                input: [{ name: "${name}", likes: { connect: { where: {node: {title: "${title}"}}, edge: {comment: "${comment}"} } } }]
            ) {
                ${AliasDirectiveTestUser.plural} {
                    id
                    name
                    likes {
                        title
                        year
                    }
                    likesConnection {
                        edges {
                            properties {
                                comment
                            }
                            node {
                                title
                                year
                            }
                        }
                    }
                }
            }
        }
        `;

        const gqlResult = await testHelper.executeGraphQL(userMutation);

        expect(gqlResult.errors).toBeFalsy();
        expect(
            (gqlResult.data as any)[AliasDirectiveTestUser.operations.create][AliasDirectiveTestUser.plural][0]
        ).toEqual({
            id: expect.any(String),
            name,
            likes: [
                {
                    title,
                    year: year.toNumber(),
                },
            ],
            likesConnection: {
                edges: [
                    {
                        properties: { comment },
                        node: {
                            title,
                            year: year.toNumber(),
                        },
                    },
                ],
            },
        });
    });
    test("E2E with update mutation with @alias", async () => {
        const name = "Stella";
        const newName = "Molly";
        const title = "Interstellar 2";
        const newTitle = "Molly's game";
        const comment = "Yes!";
        const newComment = "Sick!";
        const newYear = neo4jDriver.int(2010);

        const create = `
        mutation CreateGraph {
            ${AliasDirectiveTestUser.operations.create}(
                input: [{ name: "${name}", likes: { create: { edge: {comment: "${comment}"}, node: { title: "${title}", year: ${year} } } } }]
            ) {
                ${AliasDirectiveTestUser.plural} {
                    id
                }
                info {
                    bookmark
                }

            }
          }
        `;

        await testHelper.executeGraphQL(create);

        const update = `
        mutation UpdateAll {
            ${AliasDirectiveTestUser.operations.update}(
                where: {name_CONTAINS: "${name}"}
                update: {name: "${newName}", likes: {update: {edge: {comment: "${newComment}"}, node: {title: "${newTitle}", year: ${newYear}}}}}
            ) {
                ${AliasDirectiveTestUser.plural} {
                    id
                    name
                    likes {
                        title
                        year
                    }
                    likesConnection {
                        edges {
                            properties {
                                comment
                            }
                            node {
                                title
                                year
                            }
                        }
                    }
                }
            }
        }
        `;
        const gqlResult = await testHelper.executeGraphQL(update);

        expect(gqlResult.errors).toBeFalsy();

        expect(
            (gqlResult.data as any)[AliasDirectiveTestUser.operations.update][AliasDirectiveTestUser.plural][0]
        ).toEqual({
            id: expect.any(String),
            name: newName,
            likes: [
                {
                    title: newTitle,
                    year: newYear.toNumber(),
                },
            ],
            likesConnection: {
                edges: [
                    {
                        properties: { comment: newComment },
                        node: {
                            title: newTitle,
                            year: newYear.toNumber(),
                        },
                    },
                ],
            },
        });
    });
});
