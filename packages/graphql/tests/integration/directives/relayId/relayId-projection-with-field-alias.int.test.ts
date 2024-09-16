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
import { toGlobalId } from "../../../../src/utils/global-ids";
import { TestHelper } from "../../../utils/tests-helper";

// used to confirm the issue: https://github.com/neo4j/graphql/issues/4158
describe("RelayId projection with GraphQL field alias", () => {
    const testHelper = new TestHelper();
    let movieDatabaseID: string;
    let genreDatabaseID: string;
    let actorDatabaseID: string;

    const Movie = testHelper.createUniqueType("Movie");
    const Genre = testHelper.createUniqueType("Genre");
    const Actor = testHelper.createUniqueType("Actor");

    beforeAll(async () => {
        const typeDefs = `
            type ${Movie} {
                dbId: ID! @id @unique @relayId
                title: String!
                genre: ${Genre}! @relationship(type: "HAS_GENRE", direction: OUT)
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Genre} {
                dbId: ID! @id @unique @relayId
                name: String!
            }

            type ${Actor} {
                dbId: ID! @id @unique @relayId
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const randomID = generate({ charset: "alphabetic" });
        const randomID2 = generate({ charset: "alphabetic" });
        const randomID3 = generate({ charset: "alphabetic" });
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

    test("should return the correct relayId ids using the simple API", async () => {
        const query = `
        query {
            ${Movie.plural} {
                testAliasID: id
                testAliasDBID: dbId
                title
                genre {
                    testAliasID: id
                    testAliasDBID: dbId
                    name
                }
                actors {
                    testAliasID: id
                    testAliasDBID: dbId
                    name
                }       
            }
        }
    `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(queryResult.data?.[Movie.plural]).toEqual([
            {
                testAliasID: expect.toBeString(),
                testAliasDBID: expect.toBeString(),
                title: "Movie1",
                genre: {
                    testAliasID: expect.toBeString(),
                    testAliasDBID: expect.toBeString(),
                    name: "Action",
                },
                actors: [
                    {
                        testAliasID: expect.toBeString(),
                        testAliasDBID: expect.toBeString(),
                        name: "Keanu",
                    },
                ],
            },
        ]);
        const id = (queryResult.data as any)[Movie.plural][0].testAliasID;
        const dbId = (queryResult.data as any)?.[Movie.plural][0].testAliasDBID;
        expect(dbId).toBe(movieDatabaseID);
        expect(id).toBe(toGlobalId({ typeName: Movie.name, field: "dbId", id: dbId }));

        const genreId = (queryResult.data as any)?.[Movie.plural][0].genre?.testAliasID;
        const genreDbId = (queryResult.data as any)?.[Movie.plural][0].genre?.testAliasDBID;
        expect(genreDbId).toBe(genreDatabaseID);
        expect(genreId).toBe(toGlobalId({ typeName: Genre.name, field: "dbId", id: genreDbId }));

        const actorId = (queryResult.data as any)?.[Movie.plural][0].actors[0]?.testAliasID;
        const actorDbId = (queryResult.data as any)?.[Movie.plural][0].actors[0]?.testAliasDBID;
        expect(actorDbId).toBe(actorDatabaseID);
        expect(actorId).toBe(toGlobalId({ typeName: Actor.name, field: "dbId", id: actorDbId }));
    });

    test("should return the correct relayId ids using the connection API", async () => {
        const connectionQuery = `
            query {
                ${Movie.operations.connection} {
                    totalCount
                    edges {
                        node {
                            testAliasID: id
                            testAliasDBID: dbId
                            title
                            genre {
                                testAliasID: id
                                testAliasDBID: dbId
                                name
                            }
                            actors {
                                testAliasID: id
                                testAliasDBID: dbId
                                name
                            }
                        }
                    }
                }
            }
        `;

        const connectionQueryResult = await testHelper.executeGraphQL(connectionQuery);

        expect(connectionQueryResult.errors).toBeUndefined();
        expect(connectionQueryResult.data).toBeDefined();

        expect(connectionQueryResult.data?.[Movie.operations.connection]).toEqual({
            edges: [
                {
                    node: {
                        testAliasID: expect.toBeString(),
                        testAliasDBID: expect.toBeString(),
                        title: "Movie1",
                        genre: {
                            testAliasID: expect.toBeString(),
                            testAliasDBID: expect.toBeString(),
                            name: "Action",
                        },
                        actors: [
                            {
                                testAliasID: expect.toBeString(),
                                testAliasDBID: expect.toBeString(),
                                name: "Keanu",
                            },
                        ],
                    },
                },
            ],
            totalCount: 1,
        });
        const id = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.testAliasID;
        const dbId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.testAliasDBID;
        expect(dbId).toBe(movieDatabaseID);
        expect(id).toBe(toGlobalId({ typeName: Movie.name, field: "dbId", id: dbId }));

        const genreId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.genre
            ?.testAliasID;
        const genreDbId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.genre
            ?.testAliasDBID;
        expect(genreDbId).toBe(genreDatabaseID);
        expect(genreId).toBe(toGlobalId({ typeName: Genre.name, field: "dbId", id: genreDbId }));

        const actorId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.actors[0]
            ?.testAliasID;
        const actorDbId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.actors[0]
            ?.testAliasDBID;
        expect(actorDbId).toBe(actorDatabaseID);
        expect(actorId).toBe(toGlobalId({ typeName: Actor.name, field: "dbId", id: actorDbId }));
    });
});
