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

describe("Relationship filters with all", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actors");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String
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
            CREATE (a1:${Actor} {name: "Keanu"})
            CREATE (a2:${Actor} {name: "Uneak"})
            CREATE (m1:${Movie} {title: "The Matrix"})<-[:ACTED_IN {year: 1999}]-(a1)
            CREATE (m1)<-[:ACTED_IN {year: 2001}]-(a2)
            CREATE (:${Movie} {title: "The Matrix Reloaded"})<-[:ACTED_IN {year: 2001}]-(a1)
            CREATE (:${Movie} {title: "A very cool movie"})<-[:ACTED_IN {year: 1999}]-(a2)
            CREATE (:${Movie} {title: "unknown movie"})<-[:ACTED_IN {year: 3000}]-(a2)
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("filter by nested node with all", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: { node: { actors: { edges: { all: { node: { name: { equals: "Keanu" } } } } } } }
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
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: "The Matrix Reloaded",
                            },
                        },
                    ]),
                },
            },
        });
    });

    test("filter by nested relationship properties with all", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: { node: { actors: { edges: { all: { properties: { year: { equals: 1999 } } } } } } }
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
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: "A very cool movie",
                            },
                        },
                    ]),
                },
            },
        });
    });

    test("filter by nested relationship properties with all and OR operator", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: { node: { actors: { edges: { all: { OR: [{ properties: { year: { equals: 1999 } } }, { node: { name: { equals: "Keanu" } } }] } } } } }
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
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: "The Matrix Reloaded",
                            },
                        },
                        {
                            node: {
                                title: "A very cool movie",
                            },
                        },
                    ]),
                },
            },
        });
    });

    test("filter by nested node with all and NOT operator", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: { edges: { node: { actors: { edges: { all: { NOT: { node: { name: { equals: "Keanu" } } } } } } } } }
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
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                title: "A very cool movie",
                            },
                        },
                        {
                            node: {
                                title: "unknown movie",
                            },
                        },
                    ]),
                },
            },
        });
    });
});
