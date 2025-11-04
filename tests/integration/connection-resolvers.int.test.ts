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

import { offsetToCursor } from "graphql-relay";
import { generate } from "randomstring";
import type { UniqueType } from "../utils/graphql-types";
import { TestHelper } from "../utils/tests-helper";

describe("Connection Resolvers", () => {
    const testHelper = new TestHelper();
    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeEach(async () => {
        Actor = testHelper.createUniqueType("Actor");
        Movie = testHelper.createUniqueType("Movie");
        const typeDefs = `
              type ${Actor} {
                  id: ID
                  name: String!
                  movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
              }
  
              type ${Movie} {
                  id: ID
                  title: String!
                  actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
              }
  
              type ActedIn @relationshipProperties {
                  screenTime: Int!
              }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should define a connection field resolver and resolve it", async () => {
        const movieId = generate({
            charset: "alphabetic",
        });

        const actorId = generate({
            charset: "alphabetic",
        });

        const create = /* GraphQL */ `
            mutation {
                ${Movie.operations.create}(input:[{
                    id: "${movieId}",
                    title: "Point Break",
                    actors: {
                        create: [{
                            node: {
                                id: "${actorId}",
                                name: "Keanu Reeves"
                            },
                            edge: {
                                screenTime: 100
                            }
                        }]
                    }
                }]) {
                    ${Movie.plural} {
                        id
                        actorsConnection {
                            totalCount
                            pageInfo {
                                hasNextPage
                                hasPreviousPage
                                endCursor
                                startCursor
                            }
                            edges {
                                properties {
                                    screenTime
                                }
                                node {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(create);

        expect(gqlResult.errors).toBeFalsy();

        expect((gqlResult.data as any)[Movie.operations.create][Movie.plural][0]).toEqual({
            id: movieId,
            actorsConnection: {
                totalCount: 1,
                pageInfo: {
                    hasNextPage: false,
                    hasPreviousPage: false,
                    endCursor: expect.any(String),
                    startCursor: expect.any(String),
                },
                edges: [
                    {
                        properties: { screenTime: 100 },
                        node: {
                            id: actorId,
                            name: "Keanu Reeves",
                        },
                    },
                ],
            },
        });
    });

    test("it should provide an after offset that correctly results in the next batch of items", async () => {
        const create = /* GraphQL */ `
            mutation CreateMovie($input: [${Movie}CreateInput!]!) {
                ${Movie.operations.create}(input: $input) {
                    ${Movie.plural} {
                        id
                        title
                        actorsConnection(first: 5, sort: [{ node: { name: ASC } }]) {
                            totalCount
                            pageInfo {
                                hasNextPage
                                hasPreviousPage
                                endCursor
                                startCursor
                            }
                            edges {
                                cursor
                                properties {
                                    screenTime
                                }
                                node {
                                    id
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const actors = [...Array(20).keys()].map((x) => ({
            node: {
                id: x.toString(),
                name: String.fromCharCode(x + 1 + 64) + generate({ charset: "alphabetic" }),
            },
            edge: {
                screenTime: Math.floor(Math.random() * 200),
            },
        }));

        const movieTitle = "Bill & Ted's Excellent Pagination Adventure";
        const movieId = generate({ charset: "alphabetic" });

        const result = await testHelper.executeGraphQL(create, {
            variableValues: {
                input: [
                    {
                        id: movieId,
                        title: movieTitle,
                        actors: {
                            create: actors,
                        },
                    },
                ],
            },
        });

        expect(result.errors).toBeFalsy();

        expect((result?.data as any)[Movie.operations.create][Movie.plural]).toEqual([
            {
                id: movieId,
                title: movieTitle,
                actorsConnection: {
                    totalCount: 20,
                    edges: actors.slice(0, 5).map(({ node, edge }) => ({
                        node,
                        properties: { screenTime: edge.screenTime },
                        cursor: expect.any(String),
                    })),
                    pageInfo: {
                        hasNextPage: true,
                        hasPreviousPage: false,
                        startCursor: offsetToCursor(0),
                        endCursor: offsetToCursor(4),
                    },
                },
            },
        ]);

        const secondQuery = /* GraphQL */ `
                query movies($movieId: ID!, $endCursor: String) {
                    ${Movie.plural}(where: { id: $movieId }) {
                        id
                        title
                        actorsConnection(sort: [{ node: { name: ASC } }], first: 5, after: $endCursor) {
                            totalCount
                            edges {
                                cursor
                                properties {
                                    screenTime
                                }
                                node {
                                    id
                                    name
                                }
                            }
                            pageInfo {
                                hasPreviousPage
                                hasNextPage
                                startCursor
                                endCursor
                            }
                        }
                    }
                }
            `;

        const result2 = await testHelper.executeGraphQL(secondQuery, {
            variableValues: {
                movieId,
                endCursor: (result?.data as any)[Movie.operations.create][Movie.plural][0].actorsConnection.pageInfo
                    .endCursor,
            },
        });
        expect(result2.errors).toBeFalsy();

        expect((result2?.data as any)[Movie.plural][0]).toEqual({
            id: movieId,
            title: movieTitle,
            actorsConnection: {
                totalCount: 20,
                edges: actors.slice(5, 10).map(({ node, edge }) => ({
                    node,
                    cursor: expect.any(String),
                    properties: { screenTime: edge.screenTime },
                })),
                pageInfo: {
                    hasPreviousPage: true,
                    hasNextPage: true,
                    startCursor: offsetToCursor(5),
                    endCursor: offsetToCursor(9),
                },
            },
        });

        const result3 = await testHelper.executeGraphQL(secondQuery, {
            variableValues: {
                movieId,
                endCursor: (result2?.data as any)[Movie.plural][0].actorsConnection.pageInfo.endCursor,
            },
        });

        expect(result3.errors).toBeFalsy();

        expect((result3?.data as any)[Movie.plural][0]).toEqual({
            id: movieId,
            title: movieTitle,
            actorsConnection: {
                totalCount: 20,
                edges: actors.slice(10, 15).map(({ node, edge }) => ({
                    node,
                    cursor: expect.any(String),
                    properties: { screenTime: edge.screenTime },
                })),
                pageInfo: {
                    hasPreviousPage: true,
                    hasNextPage: true,
                    startCursor: offsetToCursor(10),
                    endCursor: offsetToCursor(14),
                },
            },
        });
    });

    test("should return a total count of zero and correct pageInfo if no edges", async () => {
        const movieId = generate({
            charset: "alphabetic",
        });

        const query = `
            query GetMovie($movieId: ID) {
                ${Movie.plural}(where: { id: $movieId }) {
                    id
                    actorsConnection {
                        totalCount
                        pageInfo {
                            startCursor
                            endCursor
                            hasNextPage
                            hasPreviousPage
                        }
                    }
                }
            }
        `;

        await testHelper.executeCypher(`CREATE (:${Movie} { id: $movieId })`, { movieId });

        const gqlResult = await testHelper.executeGraphQL(query, {
            variableValues: { movieId },
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Movie.plural]).toEqual([
            {
                id: movieId,
                actorsConnection: {
                    totalCount: 0,
                    pageInfo: { startCursor: null, endCursor: null, hasNextPage: false, hasPreviousPage: false },
                },
            },
        ]);
    });
});
