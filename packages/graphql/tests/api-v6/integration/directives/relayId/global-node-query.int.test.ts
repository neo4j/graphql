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

describe("Global node query", () => {
    const testHelper = new TestHelper({ v6Api: true });
    let movieDatabaseID: string;
    let genreDatabaseID: string;
    let actorDatabaseID: string;

    const Movie = testHelper.createUniqueType("Movie");
    const Genre = testHelper.createUniqueType("Genre");
    const Actor = testHelper.createUniqueType("Actor");

    beforeAll(async () => {
        const typeDefs = `
            type ${Movie} @node {
                dbId: ID! @id @unique @relayId
                title: String!
                genre: ${Genre}! @relationship(type: "HAS_GENRE", direction: OUT)
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${Genre} @node {
                dbId: ID! @id @unique @relayId
                name: String!
            }

            type ${Actor} @node {
                dbId: ID! @id @unique @relayId
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
        movieDatabaseID = "1234";
        genreDatabaseID = "abcd";
        actorDatabaseID = "ArthurId";
        await testHelper.executeCypher(`
         CREATE (m:${Movie.name} { title: "Movie1", dbId: "${movieDatabaseID}" })
         CREATE (g:${Genre.name} { name: "Action", dbId: "${genreDatabaseID}" })
         CREATE (o:${Actor.name} { name: "Keanu", dbId: "${actorDatabaseID}" })
         CREATE (m)-[:HAS_GENRE]->(g)
         CREATE (m)-[:ACTED_IN]->(o)
     `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should return the correct relayId nodes using the global node API", async () => {
        const movieGlobalId = toGlobalId({ typeName: Movie.name, field: "dbId", id: movieDatabaseID });

        const connectionQuery = `
        query {
            node(id: "${movieGlobalId}") {
              ... on ${Movie} {
                title
                dbId
              }
              id
            }
          }
        `;

        const connectionQueryResult = await testHelper.executeGraphQL(connectionQuery);

        expect(connectionQueryResult.errors).toBeUndefined();
        expect(connectionQueryResult.data).toEqual({
            node: {
                title: "Movie1",
                id: movieGlobalId,
                dbId: movieDatabaseID,
            },
        });
    });

    test("should return the correct relayId nodes using the global node API with relationships", async () => {
        const movieGlobalId = toGlobalId({ typeName: Movie.name, field: "dbId", id: movieDatabaseID });

        const connectionQuery = `
        query {
            node(id: "${movieGlobalId}") {
              ... on ${Movie} {
                title
                dbId
                actors {
                    connection {
                      edges {
                        node {
                          name
                        }
                      }
                    }
                  }
              }
              id
            }
          }
        `;

        const connectionQueryResult = await testHelper.executeGraphQL(connectionQuery);

        expect(connectionQueryResult.errors).toBeUndefined();
        expect(connectionQueryResult.data).toEqual({
            node: {
                title: "Movie1",
                id: movieGlobalId,
                dbId: movieDatabaseID,
                actors: {
                    connection: {
                        edges: [
                            {
                                node: {
                                    name: "Keanu",
                                },
                            },
                        ],
                    },
                },
            },
        });
    });
});
