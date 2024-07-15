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

import { toGlobalId } from "../../../../../src/utils/global-ids";
import { TestHelper } from "../../../../utils/tests-helper";

describe("RelayId projection", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let movieDatabaseID: string;
    let genreDatabaseID: string;
    let actorDatabaseID: string;

    const Movie = testHelper.createUniqueType("Movie");
    const Genre = testHelper.createUniqueType("Genre");
    const Actor = testHelper.createUniqueType("Actor");

    beforeAll(async () => {
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                dbId: ID! @id @unique(constraintName: "MOVIE_ID_UNIQUE") @relayId 
                title: String!
                genre: [${Genre}!]! @relationship(type: "HAS_GENRE", direction: OUT)
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Genre} @node {
                dbId: ID! @id @unique(constraintName: "GENRE_ID_UNIQUE") @relayId
                name: String!
            }

            type ${Actor} @node {
                dbId: ID! @id @unique(constraintName: "ACTOR_ID_UNIQUE") @relayId 
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        const randomID = "1234";
        const randomID2 = "abcd";
        const randomID3 = "ArthurId";
        await testHelper.executeCypher(`
         CREATE (m:${Movie.name} { title: "Movie1", dbId: "${randomID}" })
         CREATE (g:${Genre.name} { name: "Action", dbId: "${randomID2}" })
         CREATE (o:${Actor.name} { name: "Keanu", dbId: "${randomID3}" })
         CREATE (m)-[:HAS_GENRE]->(g)
         CREATE (m)-[:ACTED_IN]->(o)
     `);
        movieDatabaseID = randomID;
        genreDatabaseID = randomID2;
        actorDatabaseID = randomID3;
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return the correct relayId ids using the connection API", async () => {
        const connectionQuery = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection {
                        edges {
                            node {
                                id
                                dbId
                                title
                                genre {
                                    connection {
                                        edges {
                                            node {
                                                id
                                                dbId
                                                name
                                            }
                                        }
                                    }
                                }
                                actors {
                                    connection {
                                        edges {
                                            node {
                                                id
                                                dbId
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const connectionQueryResult = await testHelper.executeGraphQL(connectionQuery);

        expect(connectionQueryResult.errors).toBeUndefined();
        expect(connectionQueryResult.data).toBeDefined();

        const movieGlobalId = toGlobalId({ typeName: Movie.name, field: "dbId", id: movieDatabaseID });
        const genreGlobalId = toGlobalId({ typeName: Genre.name, field: "dbId", id: genreDatabaseID });
        const actorGlobalId = toGlobalId({ typeName: Actor.name, field: "dbId", id: actorDatabaseID });

        expect(connectionQueryResult.data?.[Movie.plural]).toEqual({
            connection: {
                edges: [
                    {
                        node: {
                            id: movieGlobalId,
                            dbId: movieDatabaseID,
                            title: "Movie1",
                            genre: {
                                connection: {
                                    edges: [
                                        {
                                            node: {
                                                id: genreGlobalId,
                                                dbId: genreDatabaseID,
                                                name: "Action",
                                            },
                                        },
                                    ],
                                },
                            },
                            actors: {
                                connection: {
                                    edges: [
                                        {
                                            node: {
                                                id: actorGlobalId,
                                                dbId: actorDatabaseID,
                                                name: "Keanu",
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
        });
    });

    test("should return the correct relayId ids using the connection API with aliased fields", async () => {
        const connectionQuery = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection {
                        edges {
                            node {
                                testAliasId: id
                                testAliasDbId: dbId
                                title
                                genre {
                                    connection {
                                        edges {
                                            node {
                                                testAliasId: id
                                                testAliasDbId: dbId
                                                name
                                            }
                                        }
                                    }
                                }
                                actors {
                                    connection {
                                        edges {
                                            node {
                                                testAliasId: id
                                                testAliasDbId: dbId
                                                name
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const connectionQueryResult = await testHelper.executeGraphQL(connectionQuery);

        expect(connectionQueryResult.errors).toBeUndefined();
        expect(connectionQueryResult.data).toBeDefined();

        const movieGlobalId = toGlobalId({ typeName: Movie.name, field: "dbId", id: movieDatabaseID });
        const genreGlobalId = toGlobalId({ typeName: Genre.name, field: "dbId", id: genreDatabaseID });
        const actorGlobalId = toGlobalId({ typeName: Actor.name, field: "dbId", id: actorDatabaseID });

        expect(connectionQueryResult.data?.[Movie.plural]).toEqual({
            connection: {
                edges: [
                    {
                        node: {
                            testAliasId: movieGlobalId,
                            testAliasDbId: movieDatabaseID,
                            title: "Movie1",
                            genre: {
                                connection: {
                                    edges: [
                                        {
                                            node: {
                                                testAliasId: genreGlobalId,
                                                testAliasDbId: genreDatabaseID,
                                                name: "Action",
                                            },
                                        },
                                    ],
                                },
                            },
                            actors: {
                                connection: {
                                    edges: [
                                        {
                                            node: {
                                                testAliasId: actorGlobalId,
                                                testAliasDbId: actorDatabaseID,
                                                name: "Keanu",
                                            },
                                        },
                                    ],
                                },
                            },
                        },
                    },
                ],
            },
        });
    });
});
