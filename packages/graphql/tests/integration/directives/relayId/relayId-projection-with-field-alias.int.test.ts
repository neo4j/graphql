/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
            type ${Movie} @node {
                dbId: ID! @id @relayId
                title: String!
                genre: [${Genre}!]! @relationship(type: "HAS_GENRE", direction: OUT)
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Genre} @node {
                dbId: ID! @id @relayId
                name: String!
            }

            type ${Actor} @node {
                dbId: ID! @id @relayId
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
                genre: [
                    {
                        testAliasID: expect.toBeString(),
                        testAliasDBID: expect.toBeString(),
                        name: "Action",
                    },
                ],
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

        const genreId = (queryResult.data as any)?.[Movie.plural][0].genre[0]?.testAliasID;
        const genreDbId = (queryResult.data as any)?.[Movie.plural][0].genre[0]?.testAliasDBID;
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
                        genre: [
                            {
                                testAliasID: expect.toBeString(),
                                testAliasDBID: expect.toBeString(),
                                name: "Action",
                            },
                        ],
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

        const genreId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.genre[0]
            ?.testAliasID;
        const genreDbId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.genre[0]
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
