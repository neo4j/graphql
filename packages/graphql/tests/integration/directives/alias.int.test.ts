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

import { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";
import { graphql } from "graphql";
import * as neo4jDriver from "neo4j-driver";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("@alias directive", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;
    const dbName = generate({ charset: "alphabetic" });
    const dbComment = generate({ charset: "alphabetic" });
    const dbTitle = generate({ charset: "alphabetic" });
    const year = neo4jDriver.int(2015);
    const secret = "secret";

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = `
            interface AliasInterface {
                id: ID! @alias(property: "dbId")
                name: String! @alias(property: "toBeOverridden")
            }

            type AliasDirectiveTestUser implements AliasInterface {
                id: ID! @id
                name: String! @alias(property: "dbName")
                likes: [AliasDirectiveTestMovie] @relationship(direction: OUT, type: "LIKES", properties: "AliasDirectiveTestLikesProps")
                createdAt: DateTime! @timestamp(operations: [CREATE]) @alias(property: "dbCreatedAt")
            }

            type AliasDirectiveTestMovie {
                title: String! @alias(property: "dbTitle")
                titleAuth: String @alias(property: "dbTitle") @auth(rules: [{roles: ["reader"]}])
                year: Int
                createdAt: DateTime! @timestamp(operations: [CREATE]) @alias(property: "dbCreatedAt")
            }

            interface AliasDirectiveTestLikesProps {
                comment: String! @alias(property: "dbComment")
                relationshipCreatedAt: DateTime! @timestamp(operations: [CREATE]) @alias(property: "dbCreatedAt")
            }

            type ProtectedUser @auth(rules: [{ allow: { name: "$jwt.sub" } }]) {
                name: String! @alias(property: "dbName")
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });
    });

    beforeEach(async () => {
        session = driver.session();
        await session.run(`MATCH (n:AliasDirectiveTestUser)-[]-(m:AliasDirectiveTestMovie) DETACH DELETE n, m`);
        await session.run(
            `CREATE (:AliasDirectiveTestUser {dbName: $dbName, dbId: "stringId", dbCreatedAt: "1970-01-02"})-[:LIKES {dbComment: $dbComment, dbCreatedAt: "1970-01-02"}]->(:AliasDirectiveTestMovie {dbTitle: $dbTitle, year: $year, dbCreatedAt: "1970-01-02"})
            CREATE (:ProtectedUser {dbName: $dbName})`,
            { dbName, dbComment, dbTitle, year }
        );
    });

    afterEach(async () => {
        await session.run(
            `MATCH (n:AliasDirectiveTestUser), (m:AliasDirectiveTestMovie), (o:ProtectedUser) DETACH DELETE n, m, o`
        );
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Aliased fields on nodes through simple relationships (using STARTS_WITH filter)", async () => {
        const usersQuery = `
            query UsersLikesMovies {
                aliasDirectiveTestUsers(where: {name_STARTS_WITH: "${dbName.substring(0, 6)}"}) {
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

        const token = jsonwebtoken.sign({ roles: ["reader"] }, secret);

        const socket = new Socket({ readable: true });
        const req = new IncomingMessage(socket);
        req.headers.authorization = `Bearer ${token}`;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: usersQuery,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] }, req },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).aliasDirectiveTestUsers[0]).toEqual({
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
                protectedUsers {
                    name
                }
            }
        `;

        // For the @auth
        const tokenSub = dbName;
        const token = jsonwebtoken.sign({ roles: ["reader"], sub: tokenSub }, secret);

        const socket = new Socket({ readable: true });
        const req = new IncomingMessage(socket);
        req.headers.authorization = `Bearer ${token}`;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: protectedUsersQuery,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] }, req },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect((gqlResult.data as any).protectedUsers[0]).toEqual({ name: dbName });
    });
    test("Aliased fields on nodes through connections (incl. rel props)", async () => {
        const usersQuery = `
            query UsersLikesMovies {
                aliasDirectiveTestUsers {
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
            schema: neoSchema.schema,
            source: usersQuery,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).aliasDirectiveTestUsers[0]).toEqual({
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
                aliasDirectiveTestUsers(where: {name_CONTAINS: "${dbName.substring(0, 6)}"}) {
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
            schema: neoSchema.schema,
            source: usersQuery,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).aliasDirectiveTestUsers[0]).toEqual({
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
            createAliasDirectiveTestUsers(
                input: [{ name: "${name}", likes: { create: { edge: {comment: "${comment}"}, node: { title: "${title}", year: ${year} } } } }]
            ) {
                aliasDirectiveTestUsers {
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
            schema: neoSchema.schema,
            source: userMutation,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).createAliasDirectiveTestUsers.aliasDirectiveTestUsers[0]).toEqual({
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
            `CREATE (m:AliasDirectiveTestMovie {dbTitle: "${title}", year: toInteger(2015), dbCreatedAt: "2021-08-25"})`
        );
        const userMutation = `
        mutation CreateUserConnectMovie {
            createAliasDirectiveTestUsers(
                input: [{ name: "${name}", likes: { connect: { where: {node: {title: "${title}"}}, edge: {comment: "${comment}"} } } }]
            ) {
                aliasDirectiveTestUsers {
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
            schema: neoSchema.schema,
            source: userMutation,
            contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).createAliasDirectiveTestUsers.aliasDirectiveTestUsers[0]).toEqual({
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
            createAliasDirectiveTestUsers(
                input: [{ name: "${name}", likes: { create: { edge: {comment: "${comment}"}, node: { title: "${title}", year: ${year} } } } }]
            ) {
                aliasDirectiveTestUsers {
                    id
                }
                info {
                    bookmark
                }

            }
          }
        `;
        const createResult = await graphql({
            schema: neoSchema.schema,
            source: create,
            contextValue: { driver },
        });
        const { bookmark } = (createResult.data as any).createAliasDirectiveTestUsers.info;

        const update = `
        mutation UpdateAll {
            updateAliasDirectiveTestUsers(
                where: {name_CONTAINS: "${name}"}
                update: {name: "${newName}", likes: {update: {edge: {comment: "${newComment}"}, node: {title: "${newTitle}", year: ${newYear}}}}}
            ) {
                aliasDirectiveTestUsers {
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
            schema: neoSchema.schema,
            source: update,
            contextValue: { driver, driverConfig: { bookmarks: [bookmark] } },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any).updateAliasDirectiveTestUsers.aliasDirectiveTestUsers[0]).toEqual({
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
