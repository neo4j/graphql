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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Relationship filters", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actors");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
                year: Int
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                year: Int
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999, runtime: 90.5})<-[:ACTED_IN {year: 1999}]-(a:${Actor} {name: "Keanu"})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001, runtime: 90.5})<-[:ACTED_IN {year: 2001}]-(a)
            CREATE (:${Movie} {title: "The Matrix Revelations", year: 2002, runtime: 70})<-[:ACTED_IN {year: 2002}]-(a)
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("top level OR filter by node", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: {
                        OR: [
                            { edges: { node: { title: { equals: "The Matrix" } } } }
                            { edges: { node: { year: { equals: 2001 } } } }
                        ]
                    }
                ) {
                    connection {
                        edges {
                            node {
                                title
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
                    edges: [
                        {
                            node: {
                                title: "The Matrix",
                            },
                        },
                        {
                            node: {
                                title: "The Matrix Reloaded",
                            },
                        },
                    ],
                },
            },
        });
    });

    test("OR filter in edges by node", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: {
                        edges: {
                            OR: [{ node: { title: { equals: "The Matrix" } } }, { node: { year: { equals: 2001 } } }]
                        }
                    }
                ) {
                    connection {
                        edges {
                            node {
                                title
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
                    edges: [
                        {
                            node: {
                                title: "The Matrix",
                            },
                        },
                        {
                            node: {
                                title: "The Matrix Reloaded",
                            },
                        },
                    ],
                },
            },
        });
    });
});
