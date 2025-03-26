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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/6005", () => {
    let Movie: UniqueType;
    let Actor: UniqueType;
    const age1 = 54;
    const age2 = 37;
    const age3 = 40;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
            type ${Actor} @node {
                name: String!
                age: Int!
                born: DateTime!
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
            type ActedIn @relationshipProperties {
                screentime: Int!
                character: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (m:${Movie} { title: "Terminator"})
            CREATE (m)<-[:ACTED_IN { screentime: 60, character: "Terminator" }]-(arnold:${Actor} { name: "Arnold", age: ${age1}, born: datetime('1980-07-02')})
            CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Sarah" }]-(:${Actor} {name: "Linda", age: ${age2}, born: datetime('2000-02-02')})
            CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Another Character" }]-(:${Actor} {name: "Another actor", age: ${age3}, born: datetime('2000-02-02')})
            CREATE (m)<-[:ACTED_IN { screentime: 10, character: "Future Terminator" }]-(arnold)
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should filter movies by actors count with unique results", async () => {
        // count should be the 3 actors but should not count Arnold twice
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { actorsConnection: { aggregate: { count: { nodes: { eq: 3 } } } } }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    title: "Terminator",
                },
            ],
        });
    });

    test("should filter movies by actors count with unique results at the field-level", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    name
                    movies(where: { actorsConnection: { aggregate: { count: { nodes: { eq: 3 } } } } }) {
                        title
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                { name: "Arnold", movies: [{ title: "Terminator" }] },
                { name: "Linda", movies: [{ title: "Terminator" }] },
                { name: "Another actor", movies: [{ title: "Terminator" }] },
            ]),
        });
    });

    test("should filter movies by actors count on connection projection", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection}(where: { actorsConnection: { aggregate: { count: { nodes: { eq: 3 } } } } }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                edges: [
                    {
                        node: {
                            title: "Terminator",
                        },
                    },
                ],
            },
        });
    });

    test("should filter movies by actors count on connection projection at field-level", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.operations.connection} {
                    edges {
                        node {
                            name
                            moviesConnection(
                                where: { node: { actorsConnection: { aggregate: { count: { nodes: { eq: 3 } } } } } }
                            ) {
                                edges {
                                    properties {
                                        character
                                    }                                    
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Actor.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            name: "Arnold",
                            moviesConnection: {
                                edges: expect.toIncludeSameMembers([
                                    { properties: { character: "Terminator" } },
                                    { properties: { character: "Future Terminator" } },
                                ]),
                            },
                        },
                    },
                    {
                        node: {
                            name: "Linda",
                            moviesConnection: {
                                edges: expect.toIncludeSameMembers([{ properties: { character: "Sarah" } }]),
                            },
                        },
                    },
                    {
                        node: {
                            name: "Another actor",
                            moviesConnection: {
                                edges: expect.toIncludeSameMembers([
                                    { properties: { character: "Another Character" } },
                                ]),
                            },
                        },
                    },
                ]),
            },
        });
    });

    test("should filter movies by related movies count without duplicate results, double nested", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { actors: { all: { moviesConnection: { aggregate: { count: { nodes: { eq: 1 } } } } } } }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    title: "Terminator",
                },
            ],
        });
    });

    test("should return movies where the actors age sum is EQUAL to", async () => {
        // arnold should not counted twice
        const sum = age1 + age2 + age3;

        const query = /* GraphQL */ `
            {
                ${Movie.plural}(where: { 
                    actorsConnection: {
                        aggregate: {
                            node: { 
                                age: { sum: { eq: ${sum} } } 
                            }
                        }
                    }
                }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    title: "Terminator",
                },
            ],
        });
    });

    test("should return movies where the actors age avg is EQUAL to", async () => {
        // arnold should not counted twice
        const avg = (age1 + age2 + age3) / 3;

        const query = /* GraphQL */ `
            {
                ${Movie.plural}(where: { 
                    actorsConnection: {
                        aggregate: {
                            node: { 
                                age: { average: { eq: ${avg} } } 
                            }
                        }
                    }
                }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: [
                {
                    title: "Terminator",
                },
            ],
        });
    });
});
