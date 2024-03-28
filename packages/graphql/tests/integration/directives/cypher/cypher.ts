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

import { generate } from "randomstring";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("cypher directive", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    describe(`Top level cypher`, () => {
        describe("Query", () => {
            let Movie: UniqueType;
            let Actor: UniqueType;
            let Director: UniqueType;

            beforeEach(() => {
                Movie = testHelper.createUniqueType("Movie");
                Actor = testHelper.createUniqueType("Actor");
                Director = testHelper.createUniqueType("Director");
            });

            test("should query custom query and return relationship data", async () => {
                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(title: String!): [${Movie}]
                            @cypher(
                                statement: """
                                MATCH (m:${Movie} {title: $title})
                                RETURN m
                                """,
                                columnName: "m"
                            )
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const source = `
                    query($title: String!) {
                        customMovies(title: $title) {
                            title
                            actors {
                                name
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(
                    `
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                    {
                        title: movieTitle,
                        name: actorName,
                    }
                );

                const gqlResult = await testHelper.executeGraphQL(source, {
                    variableValues: { title: movieTitle },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect((gqlResult?.data as any).customMovies).toEqual([
                    { title: movieTitle, actors: [{ name: actorName }] },
                ]);
            });

            test("should query custom query and return relationship data with custom where on field", async () => {
                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(title: String!): [${Movie}] @cypher(statement: """
                            MATCH (m:${Movie} {title: $title})
                            RETURN m
                        """,
                        columnName: "m"
                        )
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const source = `
                    query($title: String!, $name: String) {
                        customMovies(title: $title) {
                            title
                            actors(where: {name: $name}) {
                                name
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(
                    `
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                    {
                        title: movieTitle,
                        name: actorName,
                    }
                );

                const gqlResult = await testHelper.executeGraphQL(source, {
                    variableValues: { title: movieTitle, name: actorName },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect((gqlResult?.data as any).customMovies).toEqual([
                    { title: movieTitle, actors: [{ name: actorName }] },
                ]);
            });

            test("should query custom query and return relationship data with auth", async () => {
                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type JWT @jwt {
                        roles: [String!]!
                    }

                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} @authorization(validate: [{ operations: [READ], where: { jwt: { roles_INCLUDES:"admin" } } }]) {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(title: String!): [${Movie}] @cypher(statement: """
                            MATCH (m:${Movie} {title: $title})
                            RETURN m
                            """,
                            columnName: "m")
                    }
                `;

                const secret = "secret";

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: { authorization: { key: "secret" } },
                });

                const source = `
                    query($title: String!, $name: String) {
                        customMovies(title: $title) {
                            title
                            actors(where: {name: $name}) {
                                name
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(
                    `
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                    {
                        title: movieTitle,
                        name: actorName,
                    }
                );

                const token = createBearerToken(secret);

                const gqlResult = await testHelper.executeGraphQLWithToken(source, token, {
                    variableValues: { title: movieTitle, name: actorName },
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            });

            test("should query multiple nodes and return relationship data", async () => {
                const movieTitle1 = generate({
                    charset: "alphabetic",
                });
                const movieTitle2 = generate({
                    charset: "alphabetic",
                });
                const movieTitle3 = generate({
                    charset: "alphabetic",
                });

                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Query {
                        customMovies(titles: [String!]!): [${Movie}] @cypher(statement: """
                            MATCH (m:${Movie})
                            WHERE m.title in $titles
                            RETURN m
                            """,
                            columnName: "m"
                            )
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const source = `
                    query($titles: [String!]!) {
                        customMovies(titles: $titles) {
                            title
                            actors {
                                name
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(
                    `
                            CREATE (:${Movie} {title: $title1})<-[:ACTED_IN]-(a:${Actor} {name: $name})
                            CREATE (:${Movie} {title: $title2})<-[:ACTED_IN]-(a)
                            CREATE (:${Movie} {title: $title3})<-[:ACTED_IN]-(a)
                        `,
                    {
                        title1: movieTitle1,
                        title2: movieTitle2,
                        title3: movieTitle3,
                        name: actorName,
                    }
                );

                const gqlResult = await testHelper.executeGraphQL(source, {
                    variableValues: { titles: [movieTitle1, movieTitle2, movieTitle3] },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect((gqlResult?.data as any).customMovies).toHaveLength(3);
                expect((gqlResult?.data as any).customMovies).toContainEqual({
                    title: movieTitle1,
                    actors: [{ name: actorName }],
                });
                expect((gqlResult?.data as any).customMovies).toContainEqual({
                    title: movieTitle2,
                    actors: [{ name: actorName }],
                });
                expect((gqlResult?.data as any).customMovies).toContainEqual({
                    title: movieTitle3,
                    actors: [{ name: actorName }],
                });
            });

            test("should query multiple connection fields on a type", async () => {
                const title = generate({
                    charset: "alphabetic",
                });

                const actorName = generate({
                    charset: "alphabetic",
                });
                const directorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                        directors: [${Director}!]! @relationship(type: "DIRECTED", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type ${Director} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
                    }

                    type Query {
                        movie(title: String!): ${Movie}
                            @cypher(
                                statement: """
                                MATCH (m:${Movie})
                                WHERE m.title = $title
                                RETURN m
                                """,
                                columnName: "m"
                            )
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const source = `
                    query($title: String!) {
                        movie(title: $title) {
                            title
                            actorsConnection {
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                            directorsConnection {
                                edges {
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(
                    `
                            CREATE (m:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $actorName})
                            CREATE (m)<-[:DIRECTED]-(:${Director} {name: $directorName})
                        `,
                    {
                        title,
                        actorName,
                        directorName,
                    }
                );

                const gqlResult = await testHelper.executeGraphQL(source, {
                    variableValues: { title },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect(gqlResult?.data?.movie).toEqual({
                    title,
                    actorsConnection: {
                        edges: [{ node: { name: actorName } }],
                    },
                    directorsConnection: {
                        edges: [{ node: { name: directorName } }],
                    },
                });
            });
        });

        describe("Mutation", () => {
            let Movie: UniqueType;
            let Actor: UniqueType;

            beforeEach(() => {
                Movie = testHelper.createUniqueType("Movie");
                Actor = testHelper.createUniqueType("Actor");
            });

            test("should query custom mutation and return relationship data", async () => {
                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Mutation {
                        customMovies(title: String!): [${Movie}]
                            @cypher(
                                statement: """
                                MATCH (m:${Movie} {title: $title})
                                RETURN m
                                """,
                                columnName: "m"
                            )
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const source = `
                    mutation($title: String!) {
                        customMovies(title: $title) {
                            title
                            actors {
                                name
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(
                    `
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                    {
                        title: movieTitle,
                        name: actorName,
                    }
                );

                const gqlResult = await testHelper.executeGraphQL(source, {
                    variableValues: { title: movieTitle },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect((gqlResult?.data as any).customMovies).toEqual([
                    { title: movieTitle, actors: [{ name: actorName }] },
                ]);
            });

            test("should query custom mutation and return relationship data with custom where on field", async () => {
                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Mutation {
                        customMovies(title: String!): [${Movie}] @cypher(statement: """
                            MATCH (m:${Movie} {title: $title})
                            RETURN m
                            """,
                            columnName: "m")
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const source = `
                    mutation($title: String!, $name: String) {
                        customMovies(title: $title) {
                            title
                            actors(where: {name: $name}) {
                                name
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(
                    `
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                    {
                        title: movieTitle,
                        name: actorName,
                    }
                );

                const gqlResult = await testHelper.executeGraphQL(source, {
                    variableValues: { title: movieTitle },
                });

                expect(gqlResult.errors).toBeFalsy();

                expect((gqlResult?.data as any).customMovies).toEqual([
                    { title: movieTitle, actors: [{ name: actorName }] },
                ]);
            });

            test("should query custom mutation and return relationship data with auth", async () => {
                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const actorName = generate({
                    charset: "alphabetic",
                });

                const typeDefs = `
                    type JWT @jwt {
                        roles: [String!]!
                    }

                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
                    }

                    type ${Actor} @authorization(validate: [{ operations: [READ], where: { jwt: { roles_INCLUDES: "admin" } } }]) {
                        name: String!
                        movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                    }

                    type Mutation {
                        customMovies(title: String!): [${Movie}] @cypher(statement: """
                            MATCH (m:${Movie} {title: $title})
                            RETURN m
                            """,
                            columnName: "m")
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: { authorization: { key: "secret" } },
                });

                const source = `
                    mutation($title: String!, $name: String) {
                        customMovies(title: $title) {
                            title
                            actors(where: {name: $name}) {
                                name
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(
                    `
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN]-(:${Actor} {name: $name})
                        `,
                    {
                        title: movieTitle,
                        name: actorName,
                    }
                );

                const gqlResult = await testHelper.executeGraphQL(source, {
                    variableValues: { title: movieTitle },
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
            });
        });
    });

    describe("Field level cypher", () => {
        // Reproduces https://github.com/neo4j/graphql/issues/444 with default value test
        describe("Null Values with default value", () => {
            const townId = generate({ charset: "alphabetic" });
            const destinationId = generate({ charset: "alphabetic" });

            const defaultPreposition = generate({ charset: "alphabetic" });
            const testCaseName = generate({ charset: "alphabetic" });
            let Destination: UniqueType;
            let Town: UniqueType;

            beforeEach(async () => {
                Destination = testHelper.createUniqueType("Destination");
                Town = testHelper.createUniqueType("Town");

                const typeDefs = `
                type ${Destination} {
                    id: ID!
                    preposition(caseName: String = null): String! @cypher(statement: "RETURN coalesce($caseName, '${defaultPreposition}') as result", columnName: "result")
                }

                type Query {
                    townDestinationList(id: ID!): [${Destination}] @cypher(statement: """
                        MATCH (town:${Town} {id:$id})
                        OPTIONAL MATCH (town)<-[:BELONGS_TO]-(destination:${Destination})
                        RETURN destination
                    """,
                    columnName: "destination")
                }
            `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                });

                await testHelper.executeCypher(
                    `
                        CREATE (t:${Town} {id: $townId})
                        MERGE (t)<-[:BELONGS_TO]-(:${Destination} {id: $destinationId})
                    `,
                    {
                        townId,
                        destinationId,
                    }
                );
            });

            test("should return default value", async () => {
                const source = `
                        query($id: ID!) {
                            townDestinationList(id: $id) {
                                id
                                preposition
                            }
                        }
                `;

                const expectedTownDestinationList = [{ id: destinationId, preposition: defaultPreposition }];

                // Schema with default value
                const gqlResultWithDefaultValue = await testHelper.executeGraphQL(source, {
                    variableValues: { id: townId },
                });

                expect(gqlResultWithDefaultValue.errors).toBeFalsy();

                expect((gqlResultWithDefaultValue?.data as any).townDestinationList).toEqual(
                    expectedTownDestinationList
                );
            });

            test("should return test value", async () => {
                const source = `
                        query($id: ID!, $caseName: String) {
                            townDestinationList(id: $id) {
                                id
                                preposition(caseName: $caseName)
                            }
                        }
                    `;

                const expectedTownDestinationList = [{ id: destinationId, preposition: testCaseName }];

                // Schema with default value
                const gqlResultWithDefaultValue = await testHelper.executeGraphQL(source, {
                    variableValues: { id: townId, caseName: testCaseName },
                });

                expect(gqlResultWithDefaultValue.errors).toBeFalsy();

                expect((gqlResultWithDefaultValue?.data as any).townDestinationList).toEqual(
                    expectedTownDestinationList
                );
            });
        });

        describe("Null Values without default value", () => {
            const townId = generate({ charset: "alphabetic" });
            const destinationId = generate({ charset: "alphabetic" });

            const defaultPreposition = generate({ charset: "alphabetic" });
            const testCaseName = generate({ charset: "alphabetic" });
            let Destination: UniqueType;
            let Town: UniqueType;

            beforeEach(async () => {
                Destination = testHelper.createUniqueType("Destination");
                Town = testHelper.createUniqueType("Town");

                const typeDefs = `
                type ${Destination} {
                    id: ID!
                    preposition(caseName: String): String! @cypher(statement: "RETURN coalesce($caseName, '${defaultPreposition}') as result", columnName: "result")
                }

                type Query {
                    townDestinationList(id: ID!): [${Destination}] @cypher(statement: """
                        MATCH (town:${Town} {id:$id})
                        OPTIONAL MATCH (town)<-[:BELONGS_TO]-(destination:${Destination})
                        RETURN destination
                    """,
                    columnName: "destination")
                }
            `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                });

                await testHelper.executeCypher(
                    `
                        CREATE (t:${Town} {id: $townId})
                        MERGE (t)<-[:BELONGS_TO]-(:${Destination} {id: $destinationId})
                    `,
                    {
                        townId,
                        destinationId,
                    }
                );
            });

            test("should return default value", async () => {
                const source = `
                        query($id: ID!) {
                            townDestinationList(id: $id) {
                                id
                                preposition
                            }
                        }
                `;

                const expectedTownDestinationList = [{ id: destinationId, preposition: defaultPreposition }];

                // Schema with default value
                const gqlResultWithMissingValue = await testHelper.executeGraphQL(source, {
                    variableValues: { id: townId },
                });

                expect(gqlResultWithMissingValue.errors).toBeFalsy();

                expect((gqlResultWithMissingValue?.data as any).townDestinationList).toEqual(
                    expectedTownDestinationList
                );
            });

            test("should return test value", async () => {
                const source = `
                        query($id: ID!, $caseName: String) {
                            townDestinationList(id: $id) {
                                id
                                preposition(caseName: $caseName)
                            }
                        }
                    `;

                const expectedTownDestinationList = [{ id: destinationId, preposition: testCaseName }];

                // Schema with default value
                const gqlResultWithMissingValue = await testHelper.executeGraphQL(source, {
                    variableValues: { id: townId, caseName: testCaseName },
                });

                expect(gqlResultWithMissingValue.errors).toBeFalsy();

                expect((gqlResultWithMissingValue?.data as any).townDestinationList).toEqual(
                    expectedTownDestinationList
                );
            });
        });

        describe("Union type", () => {
            const secret = "secret";

            const userId = generate({ charset: "alphabetic" });

            let Post: UniqueType;
            let Movie: UniqueType;
            let User: UniqueType;

            beforeEach(async () => {
                Post = new UniqueType("Post");
                Movie = new UniqueType("Movie");
                User = new UniqueType("User");

                const typeDefs = `
                union PostMovieUser = ${Post} | ${Movie} | ${User}

                type ${Post} {
                    name: String
                }

                type ${Movie} {
                    name: String
                }

                type ${User} {
                    id: ID @id @unique
                    updates: [PostMovieUser!]!
                        @cypher(
                            statement: """
                            MATCH (this:${User})-[:WROTE]->(wrote:${Post})
                            RETURN wrote
                            LIMIT 5
                            """,
                            columnName: "wrote"
                        )
                }
            `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: { authorization: { key: "secret" } },
                });

                await testHelper.executeCypher(
                    `
                        CREATE (p:${Post} {name: "Postname"})
                        CREATE (m:${Movie} {name: "Moviename"})
                        CREATE (u:${User} {id: "${userId}"})
                        CREATE (u)-[:WROTE]->(p)
                        CREATE (u)-[:WATCHED]->(m)
                    `
                );
            });

            test("should return __typename", async () => {
                const source = `
                        query {
                            ${User.plural} (where: { id: "${userId}" }) {
                                updates {
                                    __typename
                                }
                            }
                        }
                `;

                const token = createBearerToken(secret);
                const gqlResult = await testHelper.executeGraphQLWithToken(source, token);

                expect(gqlResult.errors).toBeUndefined();
                expect(gqlResult?.data).toEqual({
                    [User.plural]: [
                        {
                            updates: [
                                {
                                    __typename: `${Post}`,
                                },
                            ],
                        },
                    ],
                });
            });
        });
    });
});
