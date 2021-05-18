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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Relationship properties - read", () => {
    let driver: Driver;
    const typeDefs = gql`
        type Movie {
            title: String!
            actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
        }

        type Actor {
            name: String!
            movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
        }

        interface ActedIn {
            screenTime: Int!
        }
    `;

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();

        try {
            await session.run(
                "CREATE (:Actor { name: 'Tom Hanks' })-[:ACTED_IN { screenTime: 105 }]->(:Movie { title: 'Forrest Gump'})"
            );
            // Another couple of actors to test sorting and filtering
            await session.run(
                "MATCH (m:Movie) WHERE m.title = 'Forrest Gump' CREATE (m)<-[:ACTED_IN { screenTime: 105 }]-(:Actor { name: 'Robin Wright' })"
            );
            await session.run(
                "MATCH (m:Movie) WHERE m.title = 'Forrest Gump' CREATE (m)<-[:ACTED_IN { screenTime: 5 }]-(:Actor { name: 'Sally Field' })"
            );
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = driver.session();

        try {
            await session.run("MATCH (a:Actor) WHERE a.name = 'Tom Hanks' DETACH DELETE a");
            await session.run("MATCH (a:Actor) WHERE a.name = 'Robin Wright' DETACH DELETE a");
            await session.run("MATCH (a:Actor) WHERE a.name = 'Sally Field' DETACH DELETE a");
            await session.run("MATCH (m:Movie) WHERE m.title = 'Forrest Gump' DETACH DELETE m");
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("Projecting node and relationship properties with no arguments", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection {
                        edges {
                            screenTime
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.movies).toEqual([
                {
                    title: "Forrest Gump",
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 5,
                                node: {
                                    name: "Sally Field",
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: "Robin Wright",
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: "Tom Hanks",
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With `where` argument", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(
                        where: { AND: [{ relationship: { screenTime_GT: 60 } }, { node: { name_STARTS_WITH: "Tom" } }] }
                    ) {
                        edges {
                            screenTime
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();

            expect(result?.data?.movies).toEqual([
                {
                    title: "Forrest Gump",
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 105,
                                node: {
                                    name: "Tom Hanks",
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With `sort` argument", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ConnectionWithSort($nameSort: SortDirection) {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(
                        options: { sort: [{ relationship: { screenTime: DESC } }, { node: { name: $nameSort } }] }
                    ) {
                        edges {
                            screenTime
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const ascResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
                variableValues: { nameSort: "ASC" },
            });

            expect(ascResult.errors).toBeFalsy();

            expect(ascResult?.data?.movies).toEqual([
                {
                    title: "Forrest Gump",
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 105,
                                node: {
                                    name: "Robin Wright",
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: "Tom Hanks",
                                },
                            },
                            {
                                screenTime: 5,
                                node: {
                                    name: "Sally Field",
                                },
                            },
                        ],
                    },
                },
            ]);

            const descResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
                variableValues: { nameSort: "DESC" },
            });

            expect(descResult.errors).toBeFalsy();

            expect(descResult?.data?.movies).toEqual([
                {
                    title: "Forrest Gump",
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 105,
                                node: {
                                    name: "Tom Hanks",
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: "Robin Wright",
                                },
                            },
                            {
                                screenTime: 5,
                                node: {
                                    name: "Sally Field",
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("With `where` and `sort` arguments", async () => {
        const session = driver.session();

        const neoSchema = new Neo4jGraphQL({ typeDefs, driver });

        const query = `
            query ConnectionWithSort($nameSort: SortDirection) {
                movies(where: { title: "Forrest Gump" }) {
                    title
                    actorsConnection(
                        where: { relationship: { screenTime_GT: 60 } }
                        options: { sort: [{ node: { name: $nameSort } }] }
                    ) {
                        edges {
                            screenTime
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        try {
            await neoSchema.checkNeo4jCompat();

            const ascResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
                variableValues: { nameSort: "ASC" },
            });

            expect(ascResult.errors).toBeFalsy();

            expect(ascResult?.data?.movies).toEqual([
                {
                    title: "Forrest Gump",
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 105,
                                node: {
                                    name: "Robin Wright",
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: "Tom Hanks",
                                },
                            },
                        ],
                    },
                },
            ]);

            const descResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
                variableValues: { nameSort: "DESC" },
            });

            expect(descResult.errors).toBeFalsy();

            expect(descResult?.data?.movies).toEqual([
                {
                    title: "Forrest Gump",
                    actorsConnection: {
                        edges: [
                            {
                                screenTime: 105,
                                node: {
                                    name: "Tom Hanks",
                                },
                            },
                            {
                                screenTime: 105,
                                node: {
                                    name: "Robin Wright",
                                },
                            },
                        ],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });
});
