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
import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4j from "../neo4j";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/pull/2068", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    const secret = "secret";
    const jwtPlugin = new Neo4jGraphQLAuthJWTPlugin({
        secret: "secret",
    });

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });
    describe("Updates within updates", () => {
        const contentType = generateUniqueType("Content");
        const userType = generateUniqueType("User");
        const commentType = generateUniqueType("Comment");

        const typeDefs = gql`
            interface ${contentType.name} {
                id: ID
                content: String
                creator: ${userType.name}! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type ${userType.name} {
                id: ID
                name: String
                content: [${contentType.name}!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            type ${commentType.name} implements ${contentType.name} {
                id: ID
                content: String
                creator: ${userType.name}!
            }

            extend type ${userType.name}
                @auth(rules: [{ operations: [READ, UPDATE, DELETE, CONNECT, DISCONNECT], where: { id: "$jwt.sub" } }])

            extend type ${userType.name} {
                password: String! @auth(rules: [{ operations: [READ], where: { id: "$jwt.sub" } }])
            }
        `;
        test("Connect node - update within an update", async () => {
            const userID = "someID";
            const contentID = "someContentID";
            const query = `
                mutation {
                    ${userType.operations.update}(update: { content: { connect: { where: { node: {} } } } }) {
                        ${userType.plural} {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userID}"})
                    CREATE (:${contentType.name} {id: "${contentID}"})
                `);

                const req = createJwtRequest(secret, { sub: userID });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
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
                    ${userType.operations.update}(update: { content: { connect: { where: { node: { id: "${userID2}" } } } } }) {
                        ${userType.plural} {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userID1}"})
                    CREATE (:${userType.name} {id: "${userID2}"})
                    CREATE (:${contentType.name} {id: "${contentID}"})
                `);

                const req = createJwtRequest(secret, { sub: userID1 });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
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
                    ${userType.operations.update}(update: { content: { disconnect: { where: {} } } }) {
                        ${userType.plural} {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_CONTENT]->(:${contentType.name} {id: "${contentId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
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
                    ${userType.operations.update}(update: { content: [{ disconnect: { where: { node: { id: "${userId}" } } } }] }) {
                        ${userType.plural} {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, plugins: { auth: jwtPlugin } });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                await session.run(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_CONTENT]->(:${contentType.name} {id: "${contentId}"})
                `);

                const req = createJwtRequest(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req }),
                });

                expect(gqlResult.errors).toBeUndefined();

                const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
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

        const actorType = generateUniqueType("Actor");
        const movieType = generateUniqueType("Movie");
        const tvShowType = generateUniqueType("TVShow");
        const movieOrTVShowType = generateUniqueType("MovieOrTVShow")

        const typeDefs = `
            type ${actorType.name} {
                name: String
                age: Int
                movies(title: String): [${movieType.name}]
                    @cypher(
                        statement: """
                        MATCH (m:${movieType.name} {title: $title})
                        RETURN m
                        """
                    )

                tvShows(title: String): [${movieType.name}]
                    @cypher(
                        statement: """
                        MATCH (t:${tvShowType.name} {title: $title})
                        RETURN t
                        """
                    )

                movieOrTVShow(title: String): [${movieOrTVShowType.name}]
                    @cypher(
                        statement: """
                        MATCH (n)
                        WHERE (n:${tvShowType.name} OR n:${movieType.name}) AND ($title IS NULL OR n.title = $title)
                        RETURN n
                        """
                    )
            }

            union ${movieOrTVShowType.name} = ${movieType.name} | ${tvShowType.name}

            type ${tvShowType.name} {
                id: ID
                title: String
                numSeasons: Int
                actors: [${actorType.name}]
                    @cypher(
                        statement: """
                        MATCH (a:${actorType.name})
                        RETURN a
                        """
                    )
                topActor: ${actorType.name}
                    @cypher(
                        statement: """
                        MATCH (a:${actorType.name})
                        RETURN a
                        """
                    )
            }

            type ${movieType.name} {
                id: ID
                title: String
                actors: [${actorType.name}]
                    @cypher(
                        statement: """
                        MATCH (a:${actorType.name})
                        RETURN a
                        """
                    )
                topActor: ${actorType.name}
                    @cypher(
                        statement: """
                        MATCH (a:${actorType.name})
                        RETURN a
                        """
                    )
            }
        `;

        const query = `
            {
                ${actorType.plural} {
                    movieOrTVShow(title: "${sharedTitle}") {
                        ... on ${movieType.name} {
                            title
                            topActor {
                                name
                                age
                            }
                        }
                        ... on ${tvShowType.name} {
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

        const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

        try {
            await session.run(`
                CREATE (:${actorType.name} { name: "${actorName}", age: ${actorAge} })
                CREATE (:${tvShowType.name} { title: "${sharedTitle}", numSeasons: ${numberOfSeasons} })
                CREATE (:${movieType.name} { title: "${sharedTitle}" })
            `);

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks()),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [actorType.plural]: [
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
         * @returns Unique types and a graphql type deinition string.
         */
        function getTypedef(operations: string): [UniqueType, UniqueType, string] {
            const movieType = generateUniqueType("Movie");
            const genreType = generateUniqueType("Genre");
            const typeDefs = `
                type ${movieType.name} {
                    title: String
                    genres: [${genreType.name}!]! @relationship(type: "IN_GENRE", direction: OUT)
                }
        
                type ${genreType.name} @auth(rules: [{ operations: ${operations}, roles: ["${requiredRole}"] }]) {
                    name: String @unique
                }
            `;

            return [movieType, genreType, typeDefs];
        }

        /**
         * Generate a query for connectOrCreate auth tests.
         * @param mutationType The type of mutation to perform.
         * @param movieTypePlural The plural of the movie type.
         * @returns A graphql query.
         */
        function getQuery(mutationType: string, movieTypePlural: string): string {
            let argType = "update"
    
            if (mutationType.startsWith("create")) {
                argType = "input";
            }

            return `
                mutation {
                    ${mutationType}(
                        ${argType}: {
                            title: "${movieTitle}"
                            genres: {
                                connectOrCreate: [
                                    { where: { node: { name: "Horror" } }, onCreate: { node: { name: "Horror" } } }
                                ]
                            }
                        }
                    ) {
                        ${movieTypePlural} {
                            title
                        }
                    }
                }
            `;
        }
        test("Create with createOrConnect and CONNECT operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CONNECT]");
            const createOperation = movieType.operations.create;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(createOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult.data).toEqual({
                    [createOperation]: {
                        [movieType.plural]: [
                            {
                                title: movieTitle,
                            },
                        ],
                    },
                });
            } finally {
                await session.close();
            }
        });
        test("Create with createOrConnect and CONNECT operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CONNECT]");
            const createOperation = movieType.operations.create;
            
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });
            
            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(createOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: invalidReq }),
                });

                expect(((gqlResult as any).errors[0].message as string)).toBe(forbiddenMessage);
            } finally {
                await session.close();
            }
        });
        test("Create with createOrConnect and CREATE operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE]");
            const createOperation = movieType.operations.create;
            
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(createOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult.data).toEqual({
                    [createOperation]: {
                        [movieType.plural]: [
                            {
                                title: movieTitle,
                            },
                        ],
                    },
                });
            } finally {
                await session.close();
            }
        });
        test("Create with createOrConnect and CREATE operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE]");
            const createOperation = movieType.operations.create;
            
            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(createOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: invalidReq }),
                });

                expect(((gqlResult as any).errors[0].message as string)).toBe(forbiddenMessage);
            } finally {
                await session.close();
            }
        });
        test("Create with createOrConnect and CREATE, CONNECT operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE, CONNECT]");
            const createOperation = movieType.operations.create;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(createOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult.data).toEqual({
                    [createOperation]: {
                        [movieType.plural]: [
                            {
                                title: movieTitle,
                            },
                        ],
                    },
                });
            } finally {
                await session.close();
            }
        });
        test("Create with createOrConnect and CREATE, CONNECT operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE, CONNECT]");
            const createOperation = movieType.operations.create;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(createOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: invalidReq }),
                });

                expect(((gqlResult as any).errors[0].message as string)).toBe(forbiddenMessage);
            } finally {
                await session.close();
            }
        });
        test("Create with createOrConnect and DELETE operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[DELETE]");
            const createOperation = movieType.operations.create;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(createOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult.data).toEqual({
                    [createOperation]: {
                        [movieType.plural]: [
                            {
                                title: movieTitle,
                            },
                        ],
                    },
                });
            } finally {
                await session.close();
            }
        });
        test("Update with createOrConnect and CONNECT operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CONNECT]");
            const updateOperation = movieType.operations.update;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                await session.run(`CREATE (:${movieType.name})`);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(updateOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
                });
    
                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult.data).toEqual({
                    [updateOperation]: {
                        [movieType.plural]: [
                            {
                                title: movieTitle,
                            },
                        ],
                    },
                });
            } finally {
                await session.close();
            }
        });
        test("Update with createOrConnect and CONNECT operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CONNECT]");
            const updateOperation = movieType.operations.update;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                await session.run(`CREATE (:${movieType.name})`);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(updateOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: invalidReq }),
                });

                expect(((gqlResult as any).errors[0].message as string)).toBe(forbiddenMessage);
            } finally {
                await session.close();
            }
        });
        test("Update with createOrConnect and CREATE operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE]");
            const updateOperation = movieType.operations.update;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                await session.run(`CREATE (:${movieType.name})`);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(updateOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult.data).toEqual({
                    [updateOperation]: {
                        [movieType.plural]: [
                            {
                                title: movieTitle,
                            },
                        ],
                    },
                });
            } finally {
                await session.close();
            }
        });
        test("Update with createOrConnect and CREATE operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE]");
            const updateOperation = movieType.operations.update;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                await session.run(`CREATE (:${movieType.name})`);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(updateOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: invalidReq }),
                });

                expect(((gqlResult as any).errors[0].message as string)).toBe(forbiddenMessage);
            } finally {
                await session.close();
            }
        });
        test("Update with createOrConnect and CREATE, CONNECT operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE, CONNECT]");
            const updateOperation = movieType.operations.update;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                await session.run(`CREATE (:${movieType.name})`);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(updateOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult.data).toEqual({
                    [updateOperation]: {
                        [movieType.plural]: [
                            {
                                title: movieTitle,
                            },
                        ],
                    },
                });
            } finally {
                await session.close();
            }
        });
        test("Update with createOrConnect and CREATE, CONNECT operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE, CONNECT]");
            const updateOperation = movieType.operations.update;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                await session.run(`CREATE (:${movieType.name})`);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(updateOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: invalidReq }),
                });

                expect(((gqlResult as any).errors[0].message as string)).toBe(forbiddenMessage);
            } finally {
                await session.close();
            }
        });
        test("Update with createOrConnect and DELETE operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[DELETE]");
            const updateOperation = movieType.operations.update;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: { auth: jwtPlugin },
            });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {
                await session.run(`CREATE (:${movieType.name})`);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: getQuery(updateOperation, movieType.plural),
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks(), { req: validReq }),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult.data).toEqual({
                    [updateOperation]: {
                        [movieType.plural]: [
                            {
                                title: movieTitle,
                            },
                        ],
                    },
                });
            } finally {
                await session.close();
            }
        });
    });
    describe("Select connections following the creation of a multiple nodes", () => {
        const movieType = generateUniqueType("Movie");
        const actorType = generateUniqueType("Actor");

        const typeDefs = `
            type ${movieType.name} {
                title: String
                actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }
            
            type ${actorType.name} {
                name: String
                movies: [${movieType.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;
        test("Filtered results", async () => {
            const filmName1 = "Forrest Gump";
            const filmName2 = "Toy Story";
            const actorName = "Tom Hanks";

            const query = `
                mutation {
                    ${movieType.operations.create}(input: [{ title: "${filmName1}" }, { title: "${filmName2}" }]) {
                        ${movieType.plural} {
                            title
                            actorsConnection(where: { node: { name: "${actorName}" } }) {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult.data).toEqual({
                    [movieType.operations.create]: {
                        [movieType.plural]: [
                            {
                                actorsConnection: {
                                    edges: [],
                                },
                                title: filmName1,
                            },
                            {
                                actorsConnection: {
                                    edges: [],
                                },
                                title: filmName2,
                            },
                        ]
                    }
                });
            } finally {
                await session.close();
            }
        });
        test("Unfiltered results", async () => {
            const filmName1 = "Forrest Gump";
            const filmName2 = "Toy Story";

            const query = `
                mutation {
                    ${movieType.operations.create}(input: [{ title: "${filmName1}" }, { title: "${filmName2}" }]) {
                        ${movieType.plural} {
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            try {

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmarks()),
                });

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult.data).toEqual({
                    [movieType.operations.create]: {
                        [movieType.plural]: [
                            {
                                actorsConnection: {
                                    edges: [],
                                },
                                title: filmName1,
                            },
                            {
                                actorsConnection: {
                                    edges: [],
                                },
                                title: filmName2,
                            },
                        ]
                    }
                });
            } finally {
                await session.close();
            }
        });
    });
});
