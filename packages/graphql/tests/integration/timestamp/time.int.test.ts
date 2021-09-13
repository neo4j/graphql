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

import { Driver, isTime, Integer } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("timestamp/time", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });
    describe("create", () => {
        test("should create a movie (with timestamps)", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Movie {
                      id: ID
                      createdAt: Time @timestamp(operations: [CREATE])
                    }
                `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                    mutation ($id: ID!) {
                        createMovies(input: [{ id: $id }]) {
                            movies {
                                id
                            }
                        }
                    }
                `;

            try {
                const graphqlResult = await graphql({
                    schema,
                    source: create,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    variableValues: { id },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(
                    `
                            MATCH (movie:Movie {id: $id})
                            RETURN movie {.id, .createdAt} as movie
                        `,
                    { id }
                );

                const neo4jMovie: { id: string; createdAt: any } = neo4jResult.records[0].toObject().movie;

                expect(neo4jMovie.id).toEqual(id);
                expect(isTime(neo4jMovie.createdAt)).toBe(true);
            } finally {
                await session.close();
            }
        });

        test("create timestamp on relationship property", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Actor {
                        name: String!
                    }
    
                    interface ActedIn {
                        createdAt: Time! @timestamp(operations: [CREATE])
                        screenTime: Int!
                    }
    
                    type Movie {
                        title: String!
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    }
                `;

            const { schema } = new Neo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const create = `
                    mutation($title: String!, $name: String!, $screenTime: Int!) {
                        createMovies(
                            input: [
                                { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: $screenTime } }] } }
                            ]
                        ) {
                            movies {
                                actorsConnection {
                                    edges {
                                        createdAt
                                    }
                                }
                            }
                        }
                    }
                `;

            try {
                const graphqlResult = await graphql({
                    schema,
                    source: create,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    variableValues: { title, name, screenTime },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(
                    `
                            MATCH (:Actor {name: $name})-[r:ACTED_IN]->(:Movie {title: $title})
                            RETURN r { .createdAt, .screenTime} as relationship
                        `,
                    { title, name }
                );

                const neo4jRelationship: { createdAt: any; screenTime: Integer } = neo4jResult.records[0].toObject()
                    .relationship;

                expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
                expect(isTime(neo4jRelationship.createdAt)).toBe(true);
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should update a movie (with timestamps)", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Movie {
                      id: ID
                      updatedAt: Time @timestamp(operations: [UPDATE])
                    }
                `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                    mutation ($id: ID!) {
                        updateMovies(where: {id: $id}, update: { id: $id }) {
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

                const graphqlResult = await graphql({
                    schema,
                    source: create,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    variableValues: { id },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(`
                        MATCH (m:Movie {id: "${id}"})
                        RETURN m {.id, .updatedAt} as m
                    `);

                const neo4jMovie: { id: string; updatedAt: any } = neo4jResult.records[0].toObject().m;

                expect(neo4jMovie.id).toEqual(id);
                expect(isTime(neo4jMovie.updatedAt)).toBe(true);
            } finally {
                await session.close();
            }
        });

        test("update timestamp on relationship property", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Actor {
                        name: String!
                    }
    
                    interface ActedIn {
                        updatedAt: Time! @timestamp(operations: [UPDATE])
                        screenTime: Int!
                    }
    
                    type Movie {
                        title: String!
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    }
                `;

            const { schema } = new Neo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const update = `
                    mutation($title: String!, $screenTime: Int!) {
                        updateMovies(
                            where: { title: $title }
                            update: { actors: [{ update: { edge: { screenTime: $screenTime } } }] }
                        ) {
                            movies {
                                actorsConnection {
                                    edges {
                                        updatedAt
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

                const graphqlResult = await graphql({
                    schema,
                    source: update,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    variableValues: { title, screenTime },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(
                    `
                            MATCH (:Actor {name: $name})-[r:ACTED_IN]->(:Movie {title: $title})
                            RETURN r { .updatedAt, .screenTime} as relationship
                        `,
                    { title, name }
                );

                const neo4jRelationship: { updatedAt: any; screenTime: Integer } = neo4jResult.records[0].toObject()
                    .relationship;

                expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
                expect(isTime(neo4jRelationship.updatedAt)).toBe(true);
            } finally {
                await session.close();
            }
        });
    });

    describe("create/update (explicit)", () => {
        test("should create a movie (with timestamps)", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Movie {
                      id: ID
                      createdAt: Time @timestamp(operations: [CREATE, UPDATE])
                    }
                `;

            const { schema } = new Neo4jGraphQL({
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
                const graphqlResult = await graphql({
                    schema,
                    source: create,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(`
                        MATCH (m:Movie {id: "${id}"})
                        RETURN m {.id, .createdAt} as movie
                    `);

                const neo4jMovie: { id: string; createdAt: any } = neo4jResult.records[0].toObject().movie;

                expect(neo4jMovie.id).toEqual(id);
                expect(isTime(neo4jMovie.createdAt)).toBe(true);
            } finally {
                await session.close();
            }
        });

        test("create timestamp on relationship property", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Actor {
                        name: String!
                    }
    
                    interface ActedIn {
                        createdAt: Time! @timestamp(operations: [CREATE, UPDATE])
                        screenTime: Int!
                    }
    
                    type Movie {
                        title: String!
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    }
                `;

            const { schema } = new Neo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const create = `
                    mutation($title: String!, $name: String!, $screenTime: Int!) {
                        createMovies(
                            input: [
                                { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: $screenTime } }] } }
                            ]
                        ) {
                            movies {
                                actorsConnection {
                                    edges {
                                        createdAt
                                    }
                                }
                            }
                        }
                    }
                `;

            try {
                const graphqlResult = await graphql({
                    schema,
                    source: create,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    variableValues: { title, name, screenTime },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(
                    `
                            MATCH (:Actor {name: $name})-[r:ACTED_IN]->(:Movie {title: $title})
                            RETURN r { .createdAt, .screenTime } as relationship
                        `,
                    { title, name }
                );

                const neo4jRelationship: { createdAt: any; screenTime: Integer } = neo4jResult.records[0].toObject()
                    .relationship;

                expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
                expect(isTime(neo4jRelationship.createdAt)).toBe(true);
            } finally {
                await session.close();
            }
        });

        test("update timestamp on relationship property", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Actor {
                        name: String!
                    }
    
                    interface ActedIn {
                        updatedAt: Time! @timestamp(operations: [CREATE, UPDATE])
                        screenTime: Int!
                    }
    
                    type Movie {
                        title: String!
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    }
                `;

            const { schema } = new Neo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const update = `
                    mutation($title: String!, $screenTime: Int!) {
                        updateMovies(
                            where: { title: $title }
                            update: { actors: [{ update: { edge: { screenTime: $screenTime } } }] }
                        ) {
                            movies {
                                actorsConnection {
                                    edges {
                                        updatedAt
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

                const graphqlResult = await graphql({
                    schema,
                    source: update,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    variableValues: { title, screenTime },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(
                    `
                            MATCH (:Actor {name: $name})-[r:ACTED_IN]->(:Movie {title: $title})
                            RETURN r { .updatedAt, .screenTime } as relationship
                        `,
                    { title, name }
                );

                const neo4jRelationship: { updatedAt: any; screenTime: Integer } = neo4jResult.records[0].toObject()
                    .relationship;

                expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
                expect(isTime(neo4jRelationship.updatedAt)).toBe(true);
            } finally {
                await session.close();
            }
        });

        test("should update a movie (with timestamps)", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Movie {
                      id: ID
                      updatedAt: Time @timestamp(operations: [CREATE, UPDATE])
                    }
                `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                    mutation ($id: ID!) {
                        updateMovies(where: {id: $id}, update: { id: $id }) {
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

                const graphqlResult = await graphql({
                    schema,
                    source: create,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    variableValues: { id },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(`
                        MATCH (m:Movie {id: "${id}"})
                        RETURN m {.id, .updatedAt} as movie
                    `);

                const neo4jMovie: { id: string; updatedAt: any } = neo4jResult.records[0].toObject().movie;

                expect(neo4jMovie.id).toEqual(id);
                expect(isTime(neo4jMovie.updatedAt)).toBe(true);
            } finally {
                await session.close();
            }
        });
    });

    describe("create/update (implicit)", () => {
        test("should create a movie (with timestamps)", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Movie {
                      id: ID
                      createdAt: Time @timestamp
                    }
                `;

            const { schema } = new Neo4jGraphQL({
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
                const graphqlResult = await graphql({
                    schema,
                    source: create,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(`
                        MATCH (m:Movie {id: "${id}"})
                        RETURN m { .id, .createdAt } as movie
                    `);

                const neo4jMovie: { id: string; createdAt: any } = neo4jResult.records[0].toObject().movie;

                expect(neo4jMovie.id).toEqual(id);
                expect(isTime(neo4jMovie.createdAt)).toBe(true);
            } finally {
                await session.close();
            }
        });

        test("create timestamp on relationship property", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Actor {
                        name: String!
                    }
    
                    interface ActedIn {
                        createdAt: Time! @timestamp
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
            const screenTime = 60;

            const create = `
                    mutation($title: String!, $name: String!, $screenTime: Int!) {
                        createMovies(
                            input: [
                                { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: $screenTime } }] } }
                            ]
                        ) {
                            movies {
                                actorsConnection {
                                    edges {
                                        createdAt
                                    }
                                }
                            }
                        }
                    }
                `;

            try {
                const graphqlResult = await graphql({
                    schema: neoSchema.schema,
                    source: create,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    variableValues: { title, name, screenTime },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(
                    `
                            MATCH (:Actor {name: $name})-[r:ACTED_IN]->(:Movie {title: $title})
                            RETURN r { .createdAt, .screenTime } as relationship
                        `,
                    { title, name }
                );

                const neo4jRelationship: { createdAt: any; screenTime: Integer } = neo4jResult.records[0].toObject()
                    .relationship;

                expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
                expect(isTime(neo4jRelationship.createdAt)).toBe(true);
            } finally {
                await session.close();
            }
        });

        test("update timestamp on relationship property", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Actor {
                        name: String!
                    }
    
                    interface ActedIn {
                        updatedAt: Time! @timestamp
                        screenTime: Int!
                    }
    
                    type Movie {
                        title: String!
                        actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    }
                `;

            const { schema } = new Neo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const update = `
                    mutation($title: String!, $screenTime: Int!) {
                        updateMovies(
                            where: { title: $title }
                            update: { actors: [{ update: { edge: { screenTime: $screenTime } } }] }
                        ) {
                            movies {
                                actorsConnection {
                                    edges {
                                        updatedAt
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

                const graphqlResult = await graphql({
                    schema,
                    source: update,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    variableValues: { title, screenTime },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(
                    `
                            MATCH (:Actor {name: $name})-[r:ACTED_IN]->(:Movie {title: $title})
                            RETURN r { .updatedAt, .screenTime } as relationship
                        `,
                    { title, name }
                );

                const neo4jRelationship: { updatedAt: any; screenTime: Integer } = neo4jResult.records[0].toObject()
                    .relationship;

                expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
                expect(isTime(neo4jRelationship.updatedAt)).toBe(true);
            } finally {
                await session.close();
            }
        });

        test("should update a movie (with timestamps)", async () => {
            const session = driver.session();

            const typeDefs = `
                    type Movie {
                      id: ID
                      updatedAt: Time @timestamp
                    }
                `;

            const { schema } = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                    mutation ($id: ID!) {
                        updateMovies(where: {id: $id}, update: { id: $id }) {
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

                const graphqlResult = await graphql({
                    schema,
                    source: create,
                    contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                    variableValues: { id },
                });

                expect(graphqlResult.errors).toBeFalsy();

                const neo4jResult = await session.run(`
                        MATCH (m:Movie {id: "${id}"})
                        RETURN m { .id, .updatedAt } as movie
                    `);

                const neo4jMovie: { id: string; updatedAt: any } = neo4jResult.records[0].toObject().movie;

                expect(neo4jMovie.id).toEqual(id);
                expect(isTime(neo4jMovie.updatedAt)).toBe(true);
            } finally {
                await session.close();
            }
        });
    });
});
