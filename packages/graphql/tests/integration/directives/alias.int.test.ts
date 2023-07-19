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

import type { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";
import { graphql } from "graphql";
import * as neo4jDriver from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("@alias directive", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;
    let neoSchema: Neo4jGraphQL;
    const dbName = generate({ charset: "alphabetic" });
    const dbComment = generate({ charset: "alphabetic" });
    const dbTitle = generate({ charset: "alphabetic" });
    const year = neo4jDriver.int(2015);
    const secret = "secret";

    const AliasDirectiveTestUser = new UniqueType("AliasDirectiveTestUser");
    const AliasDirectiveTestMovie = new UniqueType("AliasDirectiveTestMovie");
    const ProtectedUser = new UniqueType("ProtectedUser");

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            interface AliasInterface {
                id: ID! @alias(property: "dbId")
                name: String! @alias(property: "toBeOverridden")
            }

            type ${AliasDirectiveTestUser} implements AliasInterface {
                id: ID! @id
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

            interface AliasDirectiveTestLikesProps @relationshipProperties {
                comment: String! @alias(property: "dbComment")
                relationshipCreatedAt: DateTime! @timestamp(operations: [CREATE]) @alias(property: "dbCreatedAt")
            }

            type ${ProtectedUser} @authorization(validate: [{ when: [BEFORE], where: { node: { name: "$jwt.sub" } } }]) {
                name: String! @alias(property: "dbName")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
        await session.run(`MATCH (n:${AliasDirectiveTestUser})-[]-(m:${AliasDirectiveTestMovie}) DETACH DELETE n, m`);
        await session.run(
            `CREATE (:${AliasDirectiveTestUser} {dbName: $dbName, dbId: "stringId", dbCreatedAt: "1970-01-02"})-[:LIKES {dbComment: $dbComment, dbCreatedAt: "1970-01-02"}]->(:${AliasDirectiveTestMovie} {dbTitle: $dbTitle, year: $year, dbCreatedAt: "1970-01-02"})
            CREATE (:${ProtectedUser} {dbName: $dbName})`,
            { dbName, dbComment, dbTitle, year }
        );
    });

    afterEach(async () => {
        await session.run(
            `MATCH (n:${AliasDirectiveTestUser}), (m:${AliasDirectiveTestMovie}), (o:${ProtectedUser}) DETACH DELETE n, m, o`
        );
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: usersQuery,
            contextValue: neo4j.getContextValues({ token }),
        });

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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: protectedUsersQuery,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any)[ProtectedUser.plural][0]).toEqual({ name: dbName });
    });
    test("Aliased fields on nodes through connections (incl. rel props)", async () => {
        const usersQuery = `
            query UsersLikesMovies {
                ${AliasDirectiveTestUser.plural} {
                    name
                    likesConnection {
                        edges {
                            comment
                            node {
                                title
                                year
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: usersQuery,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[AliasDirectiveTestUser.plural][0]).toEqual({
            name: dbName,
            likesConnection: {
                edges: [
                    {
                        comment: dbComment,
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
        const usersQuery = `
            query UsersLikesMovies {
                ${AliasDirectiveTestUser.plural}(where: {name_CONTAINS: "${dbName.substring(0, 6)}"}) {
                    myName: name
                    likesConnection {
                        edges {
                            myComment: comment
                        }
                    }
                }
            }
        `;

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: usersQuery,
            contextValue: neo4j.getContextValues(),
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[AliasDirectiveTestUser.plural][0]).toEqual({
            myName: dbName,
            likesConnection: { edges: [{ myComment: dbComment }] },
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
                            relationshipCreatedAt
                            comment
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValues(),
        });

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
                        relationshipCreatedAt: expect.any(String),
                        comment,
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
        await session.run(
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
                            comment
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

        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: userMutation,
            contextValue: neo4j.getContextValues(),
        });

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
                        comment,
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
        
        await graphql({
            schema: await neoSchema.getSchema(),
            source: create,
            contextValue: neo4j.getContextValues(),
        });

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
                            comment
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
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: update,
            contextValue: neo4j.getContextValues(),
        });

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
                        comment: newComment,
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
