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
import { gql } from "apollo-server";
import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";
import { createJwtRequest } from "../../utils/create-jwt-request";

describe("https://github.com/neo4j/graphql/pull/2068", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    const secret = "secret";
    const jwtPlugin = new Neo4jGraphQLAuthJWTPlugin({
        secret: "secret",
    });

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
    });

    afterAll(async () => {
        await driver.close();
    });
    describe("Updates within updates", () => {
        const typeDefs = gql`
            interface Content {
                id: ID
                content: String
                creator: User! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type User {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            type Comment implements Content {
                id: ID
                content: String
                creator: User!
            }

            extend type User
                @auth(rules: [{ operations: [READ, UPDATE, DELETE, CONNECT, DISCONNECT], where: { id: "$jwt.sub" } }])

            extend type User {
                password: String! @auth(rules: [{ operations: [READ], where: { id: "$jwt.sub" } }])
            }
        `;
        test("Connect node - update within an update", async () => {
            const userID = "someID";
            const contentID = "someContentID";

            const query = `
                mutation {
                    updateUsers(update: { content: { connect: { where: { node: {} } } } }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userID}"})
                    CREATE (:Content {id: "${contentID}"})
                `);

                const req = createJwtRequest(secret, { sub: userID });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userID, contentConnection: { totalCount: 0 } }]);
            } finally {
                await session.close();
            }
        });
        test("Connect node - user defined update where within an update", async () => {
            const userID1 = "someID";
            const userID2 = "differentID";
            const contentID = "someContentID";

            const query = `
                mutation {
                    updateUsers(update: { content: { connect: { where: { node: { id: "${userID2}" } } } } }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userID1}"})
                    CREATE (:User {id: "${userID2}"})
                    CREATE (:Content {id: "${contentID}"})
                `);

                const req = createJwtRequest(secret, { sub: userID1 });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userID1, contentConnection: { totalCount: 0 } }]);
            } finally {
                await session.close();
            }
        });
        test("Disconnect node - update within an update", async () => {
            const userId = "someID";
            const contentId = "someContentID";

            const query = `
                mutation {
                    updateUsers(update: { content: { disconnect: { where: {} } } }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_CONTENT]->(:Content {id: "${contentId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userId, contentConnection: { totalCount: 0 } }]);
            } finally {
                await session.close();
            }
        });
        test("Disconnect node - user defined update where within an update", async () => {
            const userId = "someID";
            const contentId = "someContentID";

            const query = `
                mutation {
                    updateUsers(update: { content: [{ disconnect: { where: { node: { id: "${userId}" } } } }] }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            try {
                await session.run(`
                    CREATE (:User {id: "${userId}"})-[:HAS_CONTENT]->(:Content {id: "${contentId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any).updateUsers.users as any[];
                expect(users).toEqual([{ id: userId, contentConnection: { totalCount: 0 } }]);
            } finally {
                await session.close();
            }
        });
    });
    test("Unions in cypher directives", async () => {
        const actorName = "someName";
        const actorAge = 43;
        const numberOfSeasons = 2;
        const sharedTitle = "someTitle";

        const typeDefs = `
            type Actor {
                name: String
                age: Int
                movies(title: String): [Movie]
                    @cypher(
                        statement: """
                        MATCH (m:Movie {title: $title})
                        RETURN m
                        """
                    )

                tvShows(title: String): [Movie]
                    @cypher(
                        statement: """
                        MATCH (t:TVShow {title: $title})
                        RETURN t
                        """
                    )

                movieOrTVShow(title: String): [MovieOrTVShow]
                    @cypher(
                        statement: """
                        MATCH (n)
                        WHERE (n:TVShow OR n:Movie) AND ($title IS NULL OR n.title = $title)
                        RETURN n
                        """
                    )
            }

            union MovieOrTVShow = Movie | TVShow

            type TVShow {
                id: ID
                title: String
                numSeasons: Int
                actors: [Actor]
                    @cypher(
                        statement: """
                        MATCH (a:Actor)
                        RETURN a
                        """
                    )
                topActor: Actor
                    @cypher(
                        statement: """
                        MATCH (a:Actor)
                        RETURN a
                        """
                    )
            }

            type Movie {
                id: ID
                title: String
                actors: [Actor]
                    @cypher(
                        statement: """
                        MATCH (a:Actor)
                        RETURN a
                        """
                    )
                topActor: Actor
                    @cypher(
                        statement: """
                        MATCH (a:Actor)
                        RETURN a
                        """
                    )
            }
        `;

        const query = `
            {
                actors {
                    movieOrTVShow(title: "${sharedTitle}") {
                        ... on Movie {
                            title
                            topActor {
                                name
                                age
                            }
                        }
                        ... on TVShow {
                            title
                            numSeasons
                            topActor {
                                name
                            }
                        }
                    }
                }
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(`
                CREATE (:Actor { name: "${actorName}", age: ${actorAge} })
                CREATE (:TVShow { title: "${sharedTitle}", numSeasons: ${numberOfSeasons} })
                CREATE (:Movie { title: "${sharedTitle}" })
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks()),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                actors: [
                    {
                        movieOrTVShow: [
                            {
                                title: sharedTitle,
                                numSeasons: numberOfSeasons,
                                topActor: {
                                    name: actorName,
                                },
                            },
                            {
                                title: sharedTitle,
                                topActor: {
                                    name: actorName,
                                    age: actorAge,
                                },
                            },
                        ],
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });
    describe("connectOrCreate auth ordering", () => {
        const movieTitle = "Cool Movie";
        const requiredRole = "admin";
        const forbiddenMessage = "Forbidden";
        const validReq = createJwtRequest(secret, { roles: [requiredRole] });
        const invalidReq = createJwtRequest(secret, { roles: [] });

        /**
         * Generate type definitions for connectOrCreate auth tests.
         * @param operations The operations argument of auth rules.
         * @returns A graphql type deinition string.
         */
        function getTypedef(operations: string): string {
            return `
                type Movie {
                    title: String
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
                }
        
                type Genre @auth(rules: [{ operations: ${operations}, roles: ["${requiredRole}"] }]) {
                    name: String @unique
                }
            `;
        }

        /**
         * Generate a query for connectOrCreate auth tests.
         * @param mutationType The type of mutation to perform.
         * @returns A graphql query.
         */
        function getQuery(mutationType = "createMovies"): string {
            return `
                mutation {
                    ${mutationType}(
                        input: [
                            {
                                title: "${movieTitle}"
                                genres: {
                                    connectOrCreate: [
                                        { where: { node: { name: "Horror" } }, onCreate: { node: { name: "Horror" } } }
                                    ]
                                }
                            }
                        ]
                    ) {
                        movies {
                            title
                        }
                    }
                }
            `;
        }
        test("Create with createOrConnect and CONNECT operation rule - valid auth", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: getTypedef("[CONNECT]"),
                plugins: { auth: jwtPlugin },
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuery(),
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                createMovies: {
                    movies: [
                        {
                            title: movieTitle,
                        },
                    ],
                },
            });
        });
        test("Create with createOrConnect and CONNECT operation rule - invalid auth", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: getTypedef("[CONNECT]"),
                plugins: { auth: jwtPlugin },
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuery(),
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: invalidReq }),
            });

            expect(((gqlResult as any).errors[0].message as string)).toBe(forbiddenMessage);
        });
        test("Create with createOrConnect and CREATE operation rule - valid auth", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: getTypedef("[CREATE]"),
                plugins: { auth: jwtPlugin },
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuery(),
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                createMovies: {
                    movies: [
                        {
                            title: movieTitle,
                        },
                    ],
                },
            });
        });
        test("Create with createOrConnect and CREATE operation rule - invalid auth", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: getTypedef("[CREATE]"),
                plugins: { auth: jwtPlugin },
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuery(),
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: invalidReq }),
            });

            expect(((gqlResult as any).errors[0].message as string)).toBe(forbiddenMessage);
        });
        test("Create with createOrConnect and CREATE, CONNECT operation rule - valid auth", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: getTypedef("[CREATE, CONNECT]"),
                plugins: { auth: jwtPlugin },
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuery(),
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                createMovies: {
                    movies: [
                        {
                            title: movieTitle,
                        },
                    ],
                },
            });
        });
        test("Create with createOrConnect and CREATE, CONNECT operation rule - invalid auth", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: getTypedef("[CREATE, CONNECT]"),
                plugins: { auth: jwtPlugin },
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuery(),
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: invalidReq }),
            });

            expect(((gqlResult as any).errors[0].message as string)).toBe(forbiddenMessage);
        });
        test("Create with createOrConnect and DELETE operation rule - valid auth", async () => {
            const neoSchema = new Neo4jGraphQL({
                typeDefs: getTypedef("[DELETE]"),
                plugins: { auth: jwtPlugin },
            });

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: getQuery(),
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                createMovies: {
                    movies: [
                        {
                            title: movieTitle,
                        },
                    ],
                },
            });
        });
    });
});
