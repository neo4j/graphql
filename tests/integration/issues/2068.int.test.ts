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

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/pull/2068", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("Unions in cypher directives", async () => {
        const actorName = "someName";
        const actorAge = 43;
        const numberOfSeasons = 2;
        const sharedTitle = "someTitle";

        const actorType = testHelper.createUniqueType("Actor");
        const movieType = testHelper.createUniqueType("Movie");
        const tvShowType = testHelper.createUniqueType("TVShow");
        const movieOrTVShowType = testHelper.createUniqueType("MovieOrTVShow");

        const typeDefs = `
            type ${actorType.name} {
                name: String
                age: Int
                movies(title: String): [${movieType.name}]
                    @cypher(
                        statement: """
                        MATCH (m:${movieType.name} {title: $title})
                        RETURN m
                        """,
                        columnName: "m"
                    )

                tvShows(title: String): [${movieType.name}]
                    @cypher(
                        statement: """
                        MATCH (t:${tvShowType.name} {title: $title})
                        RETURN t
                        """,
                        columnName: "t"
                    )

                movieOrTVShow(title: String): [${movieOrTVShowType.name}]
                    @cypher(
                        statement: """
                        MATCH (n)
                        WHERE (n:${tvShowType.name} OR n:${movieType.name}) AND ($title IS NULL OR n.title = $title)
                        RETURN n
                        """,
                        columnName: "n"
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
                        """,
                        columnName: "a"
                    )
                topActor: ${actorType.name}
                    @cypher(
                        statement: """
                        MATCH (a:${actorType.name})
                        RETURN a
                        """,
                        columnName: "a"
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
                        """,
                        columnName: "a"
                    )
                topActor: ${actorType.name}
                    @cypher(
                        statement: """
                        MATCH (a:${actorType.name})
                        RETURN a
                        """,
                        columnName: "a"
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
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
                CREATE (:${actorType.name} { name: "${actorName}", age: ${actorAge} })
                CREATE (:${tvShowType.name} { title: "${sharedTitle}", numSeasons: ${numberOfSeasons} })
                CREATE (:${movieType.name} { title: "${sharedTitle}" })
            `);

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult.data as any)?.[actorType.plural]?.[0].movieOrTVShow).toIncludeSameMembers([
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
        ]);
    });

    describe("Updates within updates", () => {
        let contentType: UniqueType;
        let userType: UniqueType;
        let commentType: UniqueType;
        let typeDefs: string;

        const secret = "secret";

        beforeEach(() => {
            contentType = testHelper.createUniqueType("Content");
            userType = testHelper.createUniqueType("User");
            commentType = testHelper.createUniqueType("Comment");

            typeDefs = `
            interface ${contentType.name} {
                id: ID
                content: String
                creator: ${userType.name}! @declareRelationship
            }
    
            type ${userType.name} {
                id: ID
                name: String
                content: [${contentType.name}!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }
    
            type ${commentType.name} implements ${contentType.name} {
                id: ID
                content: String
                creator: ${userType.name}!  @relationship(type: "HAS_CONTENT", direction: IN)
            }
    
            extend type ${userType.name}
                @authorization(filter: [{ operations: [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP], where: { node: { id: "$jwt.sub" } } }])
    
            extend type ${userType.name} {
                password: String! @authorization(filter: [{ operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }
        `;
        });

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

            await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

            await testHelper.executeCypher(`
                CREATE (:${userType.name} {id: "${userID}"})
                CREATE (:${contentType.name} {id: "${contentID}"})
            `);

            const token = createBearerToken(secret, { sub: userID });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();

            const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
            expect(users).toEqual([{ id: userID, contentConnection: { totalCount: 0 } }]);
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

            await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

            await testHelper.executeCypher(`
                CREATE (:${userType.name} {id: "${userID1}"})
                CREATE (:${userType.name} {id: "${userID2}"})
                CREATE (:${contentType.name} {id: "${contentID}"})
            `);

            const token = createBearerToken(secret, { sub: userID1 });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();

            const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
            expect(users).toEqual([{ id: userID1, contentConnection: { totalCount: 0 } }]);
        });

        test("Disconnect node - update within an update", async () => {
            const userID = "someID";
            const contentID = "someContentID";

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

            await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

            await testHelper.executeCypher(`
                CREATE (:${userType.name} {id: "${userID}"})-[:HAS_CONTENT]->(:${contentType.name} {id: "${contentID}"})
            `);

            const token = createBearerToken(secret, { sub: userID });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();

            const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
            expect(users).toEqual([{ id: userID, contentConnection: { totalCount: 0 } }]);
        });
        test("Disconnect node - user defined update where within an update", async () => {
            const userID = "someID";
            const contentID = "someContentID";

            const query = `
            mutation {
                ${userType.operations.update}(update: { content: [{ disconnect: { where: { node: { id: "${userID}" } } } }] }) {
                    ${userType.plural} {
                        id
                        contentConnection {
                            totalCount
                        }
                    }
                }
            }
        `;

            await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

            await testHelper.executeCypher(`
                CREATE (:${userType.name} {id: "${userID}"})-[:HAS_CONTENT]->(:${contentType.name} {id: "${contentID}"})
            `);

            const token = createBearerToken(secret, { sub: userID });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();

            const users = (gqlResult.data as any)[userType.operations.update][userType.plural] as any[];
            expect(users).toEqual([{ id: userID, contentConnection: { totalCount: 0 } }]);
        });
    });
    describe("connectOrCreate auth ordering", () => {
        const secret = "secret";

        const movieTitle = "Cool Movie";

        const requiredRole = "admin";
        const forbiddenMessage = "Forbidden";
        const validToken = createBearerToken(secret, { roles: [requiredRole] });
        const invalidToken = createBearerToken(secret, { roles: [] });

        /**
         * Generate type definitions for connectOrCreate auth tests.
         * @param operations The operations argument of auth rules.
         * @returns Unique types and a graphql type deinition string.
         */
        function getTypedef(operations: string): [UniqueType, UniqueType, string] {
            const movieType = testHelper.createUniqueType("Movie");
            const genreType = testHelper.createUniqueType("Genre");
            const typeDefs = `
            type JWTPayload @jwt {
                roles: [String!]!
            }
            
            type ${movieType.name} {
                title: String
                genres: [${genreType.name}!]! @relationship(type: "IN_GENRE", direction: OUT)
            }
    
            type ${genreType.name} @authorization(validate: [{ operations: ${operations}, where: { jwt: { roles_INCLUDES: "${requiredRole}" } } }]) {
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
            let argType = "update";

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
        test("Create with createOrConnect and CREATE_RELATIONSHIP operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE_RELATIONSHIP]");
            const createOperation = movieType.operations.create;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(createOperation, movieType.plural),
                validToken
            );

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
        });
        test("Create with createOrConnect and CREATE_RELATIONSHIP operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE_RELATIONSHIP]");
            const createOperation = movieType.operations.create;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(createOperation, movieType.plural),
                invalidToken
            );

            expect((gqlResult as any).errors[0].message as string).toBe(forbiddenMessage);
        });
        test("Create with createOrConnect and CREATE operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE]");
            const createOperation = movieType.operations.create;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(createOperation, movieType.plural),
                validToken
            );

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
        });
        test("Create with createOrConnect and CREATE operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE]");
            const createOperation = movieType.operations.create;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(createOperation, movieType.plural),
                invalidToken
            );

            expect((gqlResult as any).errors[0].message as string).toBe(forbiddenMessage);
        });
        test("Create with createOrConnect and CREATE, CREATE_RELATIONSHIP operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE, CREATE_RELATIONSHIP]");
            const createOperation = movieType.operations.create;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(createOperation, movieType.plural),
                validToken
            );

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
        });
        test("Create with createOrConnect and CREATE, CREATE_RELATIONSHIP operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE, CREATE_RELATIONSHIP]");
            const createOperation = movieType.operations.create;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(createOperation, movieType.plural),
                invalidToken
            );

            expect((gqlResult as any).errors[0].message as string).toBe(forbiddenMessage);
        });
        test("Create with createOrConnect and DELETE operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[DELETE]");
            const createOperation = movieType.operations.create;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(createOperation, movieType.plural),
                validToken
            );

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
        });
        test("Update with createOrConnect and CREATE_RELATIONSHIP operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE_RELATIONSHIP]");
            const updateOperation = movieType.operations.update;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            await testHelper.executeCypher(`CREATE (:${movieType.name})`);

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(updateOperation, movieType.plural),
                validToken
            );

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
        });
        test("Update with createOrConnect and CREATE_RELATIONSHIP operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE_RELATIONSHIP]");
            const updateOperation = movieType.operations.update;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            await testHelper.executeCypher(`CREATE (:${movieType.name})`);

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(updateOperation, movieType.plural),
                invalidToken
            );

            expect((gqlResult as any).errors[0].message as string).toBe(forbiddenMessage);
        });
        test("Update with createOrConnect and CREATE operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE]");
            const updateOperation = movieType.operations.update;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            await testHelper.executeCypher(`CREATE (:${movieType.name})`);

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(updateOperation, movieType.plural),
                validToken
            );

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
        });

        test("Update with createOrConnect and CREATE operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE]");
            const updateOperation = movieType.operations.update;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            await testHelper.executeCypher(`CREATE (:${movieType.name})`);

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(updateOperation, movieType.plural),
                invalidToken
            );

            expect((gqlResult as any).errors[0].message as string).toBe(forbiddenMessage);
        });
        test("Update with createOrConnect and CREATE, CREATE_RELATIONSHIP operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE, CREATE_RELATIONSHIP]");
            const updateOperation = movieType.operations.update;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            await testHelper.executeCypher(`CREATE (:${movieType.name})`);

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(updateOperation, movieType.plural),
                validToken
            );

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
        });
        test("Update with createOrConnect and CREATE, CREATE_RELATIONSHIP operation rule - invalid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[CREATE, CREATE_RELATIONSHIP]");
            const updateOperation = movieType.operations.update;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            await testHelper.executeCypher(`CREATE (:${movieType.name})`);

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(updateOperation, movieType.plural),
                invalidToken
            );

            expect((gqlResult as any).errors[0].message as string).toBe(forbiddenMessage);
        });
        test("Update with createOrConnect and DELETE operation rule - valid auth", async () => {
            const [movieType, , typeDefs] = getTypedef("[DELETE]");
            const updateOperation = movieType.operations.update;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            await testHelper.executeCypher(`CREATE (:${movieType.name})`);

            const gqlResult = await testHelper.executeGraphQLWithToken(
                getQuery(updateOperation, movieType.plural),
                validToken
            );

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
        });
    });
    describe("Select connections following the creation of a multiple nodes", () => {
        let movieType: UniqueType;
        let actorType: UniqueType;

        let typeDefs: string;

        beforeEach(() => {
            movieType = testHelper.createUniqueType("Movie");
            actorType = testHelper.createUniqueType("Actor");

            typeDefs = `
            type ${movieType.name} {
                title: String
                actors: [${actorType.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }
            
            type ${actorType.name} {
                name: String
                movies: [${movieType.name}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }
    
            type ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;
        });

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
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const gqlResult = await testHelper.executeGraphQL(query);

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
                    ],
                },
            });
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
                                properties {
                                    screenTime
                                }
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const gqlResult = await testHelper.executeGraphQL(query);

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
                    ],
                },
            });
        });
    });
});
