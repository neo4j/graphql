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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src";
import { toGlobalId } from "../../../../src/utils/global-ids";
import { cleanNodes } from "../../../utils/clean-nodes";
import { UniqueType } from "../../../utils/graphql-types";
import Neo4jHelper from "../../neo4j";

describe("RelayId projection with different database name", () => {
    let schema: GraphQLSchema;
    let neo4j: Neo4jHelper;
    let driver: Driver;
    let session: Session;
    let movieDatabaseID: string;
    let genreDatabaseID: string;
    let actorDatabaseID: string;

    const Movie = new UniqueType("Movie");
    const Genre = new UniqueType("Genre");
    const Actor = new UniqueType("Actor");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        const typeDefs = `
            type ${Movie} {
                dbId: ID! @id @unique @relayId @alias(property: "serverId")
                title: String!
                genre: ${Genre}! @relationship(type: "HAS_GENRE", direction: OUT)
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Genre} {
                dbId: ID! @id @unique @relayId @alias(property: "serverId")
                name: String!
            }

            type ${Actor} {
                dbId: ID! @id @unique @relayId @alias(property: "serverId")
                name: String!
            }
        `;

        session = await neo4j.getSession();

        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        const randomID = generate({ charset: "alphabetic" });
        const randomID2 = generate({ charset: "alphabetic" });
        const randomID3 = generate({ charset: "alphabetic" });
        await session.run(`
        CREATE (m:${Movie.name} { title: "Movie1", serverId: "${randomID}" })
        CREATE (g:${Genre.name} { name: "Action", serverId: "${randomID2}" })
        CREATE (o:${Actor.name} { name: "Keanu", serverId: "${randomID3}" })
        CREATE (m)-[:HAS_GENRE]->(g)
        CREATE (m)-[:ACTED_IN]->(o)
    `);
        movieDatabaseID = randomID;
        genreDatabaseID = randomID2;
        actorDatabaseID = randomID3;
    });

    afterEach(async () => {
        await cleanNodes(driver, [Movie, Genre, Actor]);
        await session.close();
    });

    test("should return the correct relayId ids using the simple API", async () => {
        const query = `
        query {
            ${Movie.plural} {
                id
                dbId
                title
                genre {
                    id
                    dbId
                    name
                }
                actors {
                    id
                    dbId
                    name
                }       
            }
        }
    `;

        const queryResult = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
        expect(queryResult.errors).toBeUndefined();

        expect(queryResult.data?.[Movie.plural]).toEqual([
            {
                id: expect.toBeString(),
                dbId: expect.toBeString(),
                title: "Movie1",
                genre: {
                    id: expect.toBeString(),
                    dbId: expect.toBeString(),
                    name: "Action",
                },
                actors: [
                    {
                        id: expect.toBeString(),
                        dbId: expect.toBeString(),
                        name: "Keanu",
                    },
                ],
            },
        ]);
        const id = (queryResult.data as any)[Movie.plural][0].id;
        const dbId = (queryResult.data as any)?.[Movie.plural][0].dbId;
        expect(dbId).toBe(movieDatabaseID);
        expect(id).toBe(toGlobalId({ typeName: Movie.name, field: "dbId", id: dbId }));

        const genreId = (queryResult.data as any)?.[Movie.plural][0].genre?.id;
        const genreDbId = (queryResult.data as any)?.[Movie.plural][0].genre?.dbId;
        expect(genreDbId).toBe(genreDatabaseID);
        expect(genreId).toBe(toGlobalId({ typeName: Genre.name, field: "dbId", id: genreDbId }));

        const actorId = (queryResult.data as any)?.[Movie.plural][0].actors[0]?.id;
        const actorDbId = (queryResult.data as any)?.[Movie.plural][0].actors[0]?.dbId;
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
                            id
                            dbId
                            title
                            genre {
                                id
                                dbId
                                name
                            }
                            actors {
                                id
                                dbId
                                name
                            }
                        }
                    }
                }
            }
        `;

        const connectionQueryResult = await graphql({
            schema,
            source: connectionQuery,
            contextValue: neo4j.getContextValues(),
        });

        expect(connectionQueryResult.errors).toBeUndefined();
        expect(connectionQueryResult.data).toBeDefined();

        expect(connectionQueryResult.data?.[Movie.operations.connection]).toEqual({
            edges: [
                {
                    node: {
                        id: expect.toBeString(),
                        dbId: expect.toBeString(),
                        title: "Movie1",
                        genre: {
                            id: expect.toBeString(),
                            dbId: expect.toBeString(),
                            name: "Action",
                        },
                        actors: [
                            {
                                id: expect.toBeString(),
                                dbId: expect.toBeString(),
                                name: "Keanu",
                            },
                        ],
                    },
                },
            ],
            totalCount: 1,
        });
        const id = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.id;
        const dbId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.dbId;
        expect(dbId).toBe(movieDatabaseID);
        expect(id).toBe(toGlobalId({ typeName: Movie.name, field: "dbId", id: dbId }));

        const genreId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.genre?.id;
        const genreDbId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.genre
            ?.dbId;
        expect(genreDbId).toBe(genreDatabaseID);
        expect(genreId).toBe(toGlobalId({ typeName: Genre.name, field: "dbId", id: genreDbId }));

        const actorId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.actors[0]
            ?.id;
        const actorDbId = (connectionQueryResult.data as any)?.[Movie.operations.connection]?.edges[0]?.node?.actors[0]
            ?.dbId;
        expect(actorDbId).toBe(actorDatabaseID);
        expect(actorId).toBe(toGlobalId({ typeName: Actor.name, field: "dbId", id: actorDbId }));
    });
});
