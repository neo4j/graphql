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
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("PageInfo", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    let Actor: UniqueType;
    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }


        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix 1"})
            CREATE (m:${Movie} {title: "The Matrix 2"})
            CREATE (:${Actor} { name: "Keanu" })-[:ACTED_IN]->(m)
            CREATE (:${Actor} { name: "Carrie" })-[:ACTED_IN]->(m)
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Get pageInfo and cursor information on top level connection", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection {
                        pageInfo {
                            hasPreviousPage
                            hasNextPage
                            startCursor
                            endCursor
                        }
                        edges {
                            cursor
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    pageInfo: {
                        hasPreviousPage: false,
                        hasNextPage: false,
                        startCursor: offsetToCursor(0),
                        endCursor: offsetToCursor(1),
                    },
                    edges: [
                        {
                            cursor: offsetToCursor(0),
                        },
                        {
                            cursor: offsetToCursor(1),
                        },
                    ],
                },
            },
        });
    });

    test("Get pageInfo and cursor information on nested level connection", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection {
                        edges {
                            node {
                                actors {
                                    connection {
                                        pageInfo {
                                            hasPreviousPage
                                            hasNextPage
                                            startCursor
                                            endCursor
                                        }
                                        edges {
                                            cursor
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                actors: {
                                    connection: {
                                        edges: [],
                                        pageInfo: {
                                            endCursor: null,
                                            hasNextPage: false,
                                            hasPreviousPage: false,
                                            startCursor: null,
                                        },
                                    },
                                },
                            },
                        },
                        {
                            node: {
                                actors: {
                                    connection: {
                                        edges: [
                                            {
                                                cursor: offsetToCursor(0),
                                            },
                                            {
                                                cursor: offsetToCursor(1),
                                            },
                                        ],
                                        pageInfo: {
                                            endCursor: offsetToCursor(1),
                                            hasNextPage: false,
                                            hasPreviousPage: false,
                                            startCursor: offsetToCursor(0),
                                        },
                                    },
                                },
                            },
                        },
                    ]),
                },
            },
        });
    });
});
