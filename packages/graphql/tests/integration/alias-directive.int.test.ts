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
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("@alias directive", () => {
    let driver: Driver;
    let session: Session;
    let neoSchema: Neo4jGraphQL;
    const dbName = generate({ charset: "alphabetic" });
    const dbComment = generate({ charset: "alphabetic" });
    const dbTitle = generate({ charset: "alphabetic" });
    const year = neo4jDriver.int(2015);

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = `
            type AliasDirectiveTestUser {
                name: String! @alias(property: "dbName")
                likes: [AliasDirectiveTestMovie] @relationship(direction: OUT, type: "LIKES", properties: "AliasDirectiveTestLikesProps")
            }

            type AliasDirectiveTestMovie {
                title: String! @alias(property: "dbTitle")
                year: Int
            }

            interface AliasDirectiveTestLikesProps {
                comment: String! @alias(property: "dbComment")
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    beforeEach(async () => {
        session = driver.session();
        await session.run(`MATCH (n:AliasDirectiveTestUser)-[]-(m:AliasDirectiveTestMovie) DETACH DELETE n, m`);
        await session.run(
            `CREATE (:AliasDirectiveTestUser {dbName: $dbName})-[:LIKES {dbComment: $dbComment}]->(:AliasDirectiveTestMovie {dbTitle: $dbTitle, year: $year})`,
            { dbName, dbComment, dbTitle, year }
        );
    });

    afterEach(async () => {
        await session.run(`MATCH (n:AliasDirectiveTestUser)-[]-(m:AliasDirectiveTestMovie) DETACH DELETE n, m`);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Aliased fields on nodes through simple relationships", async () => {
        const usersQuery = `
            query UsersLikesMovies {
                aliasDirectiveTestUsers {
                    name
                    likes {
                        title
                        year
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
            likes: [
                {
                    title: dbTitle,
                    year: year.toNumber(),
                },
            ],
        });
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
    test("Using GraphQL query alias with @alias", async () => {
        const usersQuery = `
            query UsersLikesMovies {
                aliasDirectiveTestUsers {
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
});
