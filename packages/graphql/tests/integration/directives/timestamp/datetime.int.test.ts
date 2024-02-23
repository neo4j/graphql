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

import { graphql } from "graphql";
import type { DateTime, Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src/classes";
import Neo4jHelper from "../../neo4j";

describe("timestamp/datetime", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("create", () => {
        test("should create a movie (with timestamps)", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Movie {
                  id: ID
                  createdAt: DateTime @timestamp(operations: [CREATE])
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createMovies(input: [{ id: "${id}" }]) {
                        movies {
                            id
                        }
                    }
                }
            `;

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: create,
                    contextValue: neo4j.getContextValues(),
                });

                expect(gqlResult.errors).toBeFalsy();

                const result = await session.run(`
                    MATCH (m:Movie {id: "${id}"})
                    RETURN m {.id, .createdAt} as m
                `);

                const movie: {
                    id: string;
                    createdAt: DateTime;
                } = (result.records[0]?.toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.createdAt.toString())).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });

        test("create timestamp on relationship property", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Actor {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    createdAt: DateTime! @timestamp(operations: [CREATE])
                    screenTime: Int!
                }

                type Movie {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation($title: String!, $name: String!) {
                    createMovies(
                        input: [
                            { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: 60 } }] } }
                        ]
                    ) {
                        movies {
                            actorsConnection {
                                edges {
                                    properties {
                                        createdAt
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            try {
                const result = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: create,
                    contextValue: neo4j.getContextValues(),
                    variableValues: { title, name },
                });

                expect(result.errors).toBeFalsy();

                const { actorsConnection } = (result.data as any).createMovies.movies[0];

                expect(new Date(actorsConnection.edges[0].properties.createdAt as string)).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should update a movie (with timestamps)", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Movie {
                  id: ID
                  updatedAt: DateTime @timestamp(operations: [UPDATE])
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    updateMovies(where: {id: "${id}"}, update: { id: "${id}" }) {
                        movies {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (m:Movie {id: "${id}"})
                `);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: create,
                    contextValue: neo4j.getContextValues(),
                });

                expect(gqlResult.errors).toBeFalsy();

                const result = await session.run(`
                    MATCH (m:Movie {id: "${id}"})
                    RETURN m {.id, .updatedAt} as m
                `);

                const movie: {
                    id: string;
                    updatedAt: DateTime;
                } = (result.records[0]?.toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.updatedAt.toString())).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });

        test("update timestamp on relationship property", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Actor {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    updatedAt: DateTime! @timestamp(operations: [UPDATE])
                    screenTime: Int!
                }

                type Movie {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });

            const update = `
                mutation($title: String!) {
                    updateMovies(
                        where: { title: $title }
                        update: { actors: [{ update: { edge: { screenTime: 60 } } }] }
                    ) {
                        movies {
                            actorsConnection {
                                edges {
                                    properties {
                                        updatedAt
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            try {
                await session.run(
                    `
                    CREATE (:Movie {title: $title})<-[:ACTED_IN {screenTime: 30}]-(:Actor {name: $name})
                `,
                    { title, name }
                );

                const result = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: update,
                    contextValue: neo4j.getContextValues(),
                    variableValues: { title },
                });

                expect(result.errors).toBeFalsy();

                const { actorsConnection } = (result.data as any).updateMovies.movies[0];

                expect(new Date(actorsConnection.edges[0].properties.updatedAt as string)).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });
    });

    describe("create/update (explicit)", () => {
        test("should create a movie (with timestamps)", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Movie {
                  id: ID
                  createdAt: DateTime @timestamp(operations: [CREATE, UPDATE])
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createMovies(input: [{ id: "${id}" }]) {
                        movies {
                            id
                        }
                    }
                }
            `;

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: create,
                    contextValue: neo4j.getContextValues(),
                });

                expect(gqlResult.errors).toBeFalsy();

                const result = await session.run(`
                    MATCH (m:Movie {id: "${id}"})
                    RETURN m {.id, .createdAt} as m
                `);

                const movie: {
                    id: string;
                    createdAt: DateTime;
                } = (result.records[0]?.toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.createdAt.toString())).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });

        test("create timestamp on relationship property", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Actor {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    createdAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
                    screenTime: Int!
                }

                type Movie {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation($title: String!, $name: String!) {
                    createMovies(
                        input: [
                            { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: 60 } }] } }
                        ]
                    ) {
                        movies {
                            actorsConnection {
                                edges {
                                    properties {
                                        createdAt
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            try {
                const result = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: create,
                    contextValue: neo4j.getContextValues(),
                    variableValues: { title, name },
                });

                expect(result.errors).toBeFalsy();

                const { actorsConnection } = (result.data as any).createMovies.movies[0];

                expect(new Date(actorsConnection.edges[0].properties.createdAt as string)).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });

        test("update timestamp on relationship property", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Actor {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
                    screenTime: Int!
                }

                type Movie {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });

            const update = `
                mutation($title: String!) {
                    updateMovies(
                        where: { title: $title }
                        update: { actors: [{ update: { edge: { screenTime: 60 } } }] }
                    ) {
                        movies {
                            actorsConnection {
                                edges {
                                    properties {
                                        updatedAt
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            try {
                await session.run(
                    `
                    CREATE (:Movie {title: $title})<-[:ACTED_IN {screenTime: 30}]-(:Actor {name: $name})
                `,
                    { title, name }
                );

                const result = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: update,
                    contextValue: neo4j.getContextValues(),
                    variableValues: { title },
                });

                expect(result.errors).toBeFalsy();

                const { actorsConnection } = (result.data as any).updateMovies.movies[0];

                expect(new Date(actorsConnection.edges[0].properties.updatedAt as string)).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });

        test("should update a movie (with timestamps)", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Movie {
                  id: ID
                  updatedAt: DateTime @timestamp(operations: [CREATE, UPDATE])
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    updateMovies(where: {id: "${id}"}, update: { id: "${id}" }) {
                        movies {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (m:Movie {id: "${id}"})
                `);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: create,
                    contextValue: neo4j.getContextValues(),
                });

                expect(gqlResult.errors).toBeFalsy();

                const result = await session.run(`
                    MATCH (m:Movie {id: "${id}"})
                    RETURN m {.id, .updatedAt} as m
                `);

                const movie: {
                    id: string;
                    updatedAt: DateTime;
                } = (result.records[0]?.toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.updatedAt.toString())).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });
    });

    describe("create/update (implicit)", () => {
        test("should create a movie (with timestamps)", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Movie {
                  id: ID
                  createdAt: DateTime @timestamp
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createMovies(input: [{ id: "${id}" }]) {
                        movies {
                            id
                        }
                    }
                }
            `;

            try {
                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: create,
                    contextValue: neo4j.getContextValues(),
                });

                expect(gqlResult.errors).toBeFalsy();

                const result = await session.run(`
                    MATCH (m:Movie {id: "${id}"})
                    RETURN m {.id, .createdAt} as m
                `);

                const movie: {
                    id: string;
                    createdAt: DateTime;
                } = (result.records[0]?.toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.createdAt.toString())).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });

        test("create timestamp on relationship property", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Actor {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    createdAt: DateTime! @timestamp
                    screenTime: Int!
                }

                type Movie {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation($title: String!, $name: String!) {
                    createMovies(
                        input: [
                            { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: 60 } }] } }
                        ]
                    ) {
                        movies {
                            actorsConnection {
                                edges {
                                    properties {
                                        createdAt
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            try {
                const result = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: create,
                    contextValue: neo4j.getContextValues(),
                    variableValues: { title, name },
                });

                expect(result.errors).toBeFalsy();

                const { actorsConnection } = (result.data as any).createMovies.movies[0];

                expect(new Date(actorsConnection.edges[0].properties.createdAt as string)).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });

        test("update timestamp on relationship property", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Actor {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    updatedAt: DateTime! @timestamp
                    screenTime: Int!
                }

                type Movie {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });

            const update = `
                mutation($title: String!) {
                    updateMovies(
                        where: { title: $title }
                        update: { actors: [{ update: { edge: { screenTime: 60 } } }] }
                    ) {
                        movies {
                            actorsConnection {
                                edges {
                                    properties {
                                        updatedAt
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            try {
                await session.run(
                    `
                    CREATE (:Movie {title: $title})<-[:ACTED_IN {screenTime: 30}]-(:Actor {name: $name})
                `,
                    { title, name }
                );

                const result = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: update,
                    contextValue: neo4j.getContextValues(),
                    variableValues: { title },
                });

                expect(result.errors).toBeFalsy();

                const { actorsConnection } = (result.data as any).updateMovies.movies[0];

                expect(new Date(actorsConnection.edges[0].properties.updatedAt as string)).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });

        test("should update a movie (with timestamps)", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Movie {
                  id: ID
                  updatedAt: DateTime @timestamp
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    updateMovies(where: {id: "${id}"}, update: { id: "${id}" }) {
                        movies {
                            id
                        }
                    }
                }
            `;

            try {
                await session.run(`
                    CREATE (m:Movie {id: "${id}"})
                `);

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: create,
                    contextValue: neo4j.getContextValues(),
                });

                expect(gqlResult.errors).toBeFalsy();

                const result = await session.run(`
                    MATCH (m:Movie {id: "${id}"})
                    RETURN m {.id, .updatedAt} as m
                `);

                const movie: {
                    id: string;
                    updatedAt: DateTime;
                } = (result.records[0]?.toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.updatedAt.toString())).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });
    });
});
