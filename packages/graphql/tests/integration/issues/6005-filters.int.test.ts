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

describe("https://github.com/neo4j/graphql/issues/6005 filters", () => {
    let Movie: UniqueType;
    let Actor: UniqueType;

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
        // Arnold as two edge with terminator and two actors have the same age to test that the distinct is not applied on properties
        await testHelper.executeCypher(`
            CREATE (m:${Movie} { title: "Terminator"})
            CREATE (m)<-[:ACTED_IN { screentime: 60, character: "Terminator" }]-(arnold:${Actor} { name: "Arnold", age: 54, born: datetime('1980-07-02')})
            CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Sarah" }]-(:${Actor} {name: "Linda", age: 37, born: datetime('2000-02-02')})
            CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Another Character" }]-(:${Actor} {name: "Another actor", age: 37, born: datetime('2000-02-02')})
            CREATE (m)<-[:ACTED_IN { screentime: 10, character: "Future Terminator" }]-(arnold)
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    /**
     * For the following tests we assuming that the deprecated syntax keep the existing behavior while when using the new syntax the
     * distinct is applied. This is applied only to count aggregation as for node aggregations second thoughts are needed.
     **/
    test("should filter movies by actors count with duplicate results (deprecated syntax)", async () => {
        // should count the 4 actors with Arnold counted twice
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { actorsAggregate: { count: { eq: 4 } } }) {
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
    /**
     * For the following tests we assuming that the deprecated syntax keep the existing behavior while when using the new syntax the
     * distinct is applied. This is applied only to count aggregation as for node aggregations second thoughts are needed.
     **/
    test("should filter movies by actors count with duplicate results at the field-level (deprecated syntax, no DISTINCT)", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural} {
                    name
                    movies(where: { actorsAggregate: { count: { eq: 4 } } }) {
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

    /**
     * For the following tests we assuming that the deprecated syntax keep the existing behavior while when using the new syntax the
     * distinct is applied. This is applied only to count aggregation as for node aggregations second thoughts are needed.
     **/
    test("should filter movies by actors count with unique results (connection syntax)", async () => {
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

    /**
     * For the following tests we assuming that the deprecated syntax keep the existing behavior while when using the new syntax the
     * distinct is applied. This is applied only to count aggregation as for node aggregations second thoughts are needed.
     **/
    test("should filter movies by actors count with unique results at the field-level (connection syntax, with DISTINCT)", async () => {
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

    /**
     * For the following tests we assuming that the deprecated syntax keep the existing behavior while when using the new syntax the
     * distinct is applied. This is applied only to count aggregation as for node aggregations second thoughts are needed.
     **/
    test("should filter movies by actors count on connection projection (connection syntax, with DISTINCT)", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}Connection(where: { actorsConnection: { aggregate: { count: { nodes: { eq: 3 } } } } }) {
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

    /**
     * For the following tests we assuming that the deprecated syntax keep the existing behavior while when using the new syntax the
     * distinct is applied. This is applied only to count aggregation as for node aggregations second thoughts are needed.
     **/
    test("should filter movies by actors count on connection projection at field-level (connection syntax, with DISTINCT)", async () => {
        const query = /* GraphQL */ `
            query {
                ${Actor.plural}Connection {
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

    /**
     * For the following tests we assuming that the deprecated syntax keep the existing behavior while when using the new syntax the
     * distinct is applied. This is applied only to count aggregation as for node aggregations second thoughts are needed.
     **/
    test("should filter movies by related movies count with duplicate results, double nested (deprecated syntax, no DISTINCT)", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { actors: { all: { moviesAggregate: { count: { eq: 1 } } } } }) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.plural]: expect.toBeArrayOfSize(0),
        });
    });

    /**
     * For the following tests we assuming that the deprecated syntax keep the existing behavior while when using the new syntax the
     * distinct is applied. This is applied only to count aggregation as for node aggregations second thoughts are needed.
     **/
    test("should filter movies by related movies count with duplicate results, double nested (connection syntax, with DISTINCT)", async () => {
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
});
