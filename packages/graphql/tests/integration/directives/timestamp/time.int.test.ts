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

import type { Integer } from "neo4j-driver";
import { isTime } from "neo4j-driver";
import { generate } from "randomstring";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("timestamp/time", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeEach(() => {
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("create", () => {
        test("should create a movie (with timestamps)", async () => {
            const typeDefs = `
                    type ${Movie} {
                      id: ID
                      createdAt: Time @timestamp(operations: [CREATE])
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                    mutation ($id: ID!) {
                        ${Movie.operations.create}(input: [{ id: $id }]) {
                            ${Movie.plural} {
                                id
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(create, {
                variableValues: { id },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(
                `
                            MATCH (movie:${Movie} {id: $id})
                            RETURN movie {.id, .createdAt} as movie
                        `,
                { id }
            );

            const neo4jMovie: { id: string; createdAt: Date } = neo4jResult.records[0]?.toObject().movie;

            expect(neo4jMovie.id).toEqual(id);
            expect(isTime(neo4jMovie.createdAt)).toBe(true);
        });

        test("create timestamp on relationship property", async () => {
            const typeDefs = `
                    type ${Actor} {
                        name: String!
                    }

                    type ActedIn @relationshipProperties {
                        createdAt: Time! @timestamp(operations: [CREATE])
                        screenTime: Int!
                    }

                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const create = `
                    mutation($title: String!, $name: String!, $screenTime: Int!) {
                        ${Movie.operations.create}(
                            input: [
                                { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: $screenTime } }] } }
                            ]
                        ) {
                            ${Movie.plural} {
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

            const graphqlResult = await testHelper.executeGraphQL(create, {
                variableValues: { title, name, screenTime },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(
                `
                            MATCH (:${Actor}{name: $name})-[r:ACTED_IN]->(:${Movie} {title: $title})
                            RETURN r { .createdAt, .screenTime} as relationship
                        `,
                { title, name }
            );

            const neo4jRelationship: { createdAt: Date; screenTime: Integer } =
                neo4jResult.records[0]?.toObject().relationship;

            expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
            expect(isTime(neo4jRelationship.createdAt)).toBe(true);
        });
    });

    describe("update", () => {
        test("should update a movie (with timestamps)", async () => {
            const typeDefs = `
                    type ${Movie} {
                      id: ID
                      updatedAt: Time @timestamp(operations: [UPDATE])
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                    mutation ($id: ID!) {
                        ${Movie.operations.update}(where: {id: $id}, update: { id: $id }) {
                            ${Movie.plural} {
                                id
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (m:${Movie} {id: "${id}"})
                    `);

            const graphqlResult = await testHelper.executeGraphQL(create, {
                variableValues: { id },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(`
                        MATCH (m:${Movie} {id: "${id}"})
                        RETURN m {.id, .updatedAt} as m
                    `);

            const neo4jMovie: { id: string; updatedAt: Date } = neo4jResult.records[0]?.toObject().m;

            expect(neo4jMovie.id).toEqual(id);
            expect(isTime(neo4jMovie.updatedAt)).toBe(true);
        });

        test("update timestamp on relationship property", async () => {
            const typeDefs = `
                    type ${Actor} {
                        name: String!
                    }

                    type ActedIn @relationshipProperties {
                        updatedAt: Time! @timestamp(operations: [UPDATE])
                        screenTime: Int!
                    }

                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const update = `
                    mutation($title: String!, $screenTime: Int!) {
                        ${Movie.operations.update}(
                            where: { title: $title }
                            update: { actors: [{ update: { edge: { screenTime: $screenTime } } }] }
                        ) {
                            ${Movie.plural} {
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

            await testHelper.executeCypher(
                `
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN {screenTime: 30}]-(:${Actor}{name: $name})
                        `,
                { title, name }
            );

            const graphqlResult = await testHelper.executeGraphQL(update, {
                variableValues: { title, screenTime },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(
                `
                            MATCH (:${Actor}{name: $name})-[r:ACTED_IN]->(:${Movie} {title: $title})
                            RETURN r { .updatedAt, .screenTime} as relationship
                        `,
                { title, name }
            );

            const neo4jRelationship: { updatedAt: Date; screenTime: Integer } =
                neo4jResult.records[0]?.toObject().relationship;

            expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
            expect(isTime(neo4jRelationship.updatedAt)).toBe(true);
        });
    });

    describe("create/update (explicit)", () => {
        test("should create a movie (with timestamps)", async () => {
            const typeDefs = `
                    type ${Movie} {
                      id: ID
                      createdAt: Time @timestamp(operations: [CREATE, UPDATE])
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                    mutation {
                        ${Movie.operations.create}(input: [{ id: "${id}" }]) {
                            ${Movie.plural} {
                                id
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(create);

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(`
                        MATCH (m:${Movie} {id: "${id}"})
                        RETURN m {.id, .createdAt} as movie
                    `);

            const neo4jMovie: { id: string; createdAt: Date } = neo4jResult.records[0]?.toObject().movie;

            expect(neo4jMovie.id).toEqual(id);
            expect(isTime(neo4jMovie.createdAt)).toBe(true);
        });

        test("create timestamp on relationship property", async () => {
            const typeDefs = `
                    type ${Actor} {
                        name: String!
                    }

                    type ActedIn @relationshipProperties {
                        createdAt: Time! @timestamp(operations: [CREATE, UPDATE])
                        screenTime: Int!
                    }

                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const create = `
                    mutation($title: String!, $name: String!, $screenTime: Int!) {
                        ${Movie.operations.create}(
                            input: [
                                { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: $screenTime } }] } }
                            ]
                        ) {
                            ${Movie.plural} {
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

            const graphqlResult = await testHelper.executeGraphQL(create, {
                variableValues: { title, name, screenTime },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(
                `
                            MATCH (:${Actor}{name: $name})-[r:ACTED_IN]->(:${Movie} {title: $title})
                            RETURN r { .createdAt, .screenTime } as relationship
                        `,
                { title, name }
            );

            const neo4jRelationship: { createdAt: Date; screenTime: Integer } =
                neo4jResult.records[0]?.toObject().relationship;

            expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
            expect(isTime(neo4jRelationship.createdAt)).toBe(true);
        });

        test("update timestamp on relationship property", async () => {
            const typeDefs = `
                    type ${Actor} {
                        name: String!
                    }

                    type ActedIn @relationshipProperties {
                        updatedAt: Time! @timestamp(operations: [CREATE, UPDATE])
                        screenTime: Int!
                    }

                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const update = `
                    mutation($title: String!, $screenTime: Int!) {
                        ${Movie.operations.update}(
                            where: { title: $title }
                            update: { actors: [{ update: { edge: { screenTime: $screenTime } } }] }
                        ) {
                            ${Movie.plural} {
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

            await testHelper.executeCypher(
                `
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN {screenTime: 30}]-(:${Actor}{name: $name})
                        `,
                { title, name }
            );

            const graphqlResult = await testHelper.executeGraphQL(update, {
                variableValues: { title, screenTime },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(
                `
                            MATCH (:${Actor}{name: $name})-[r:ACTED_IN]->(:${Movie} {title: $title})
                            RETURN r { .updatedAt, .screenTime } as relationship
                        `,
                { title, name }
            );

            const neo4jRelationship: { updatedAt: Date; screenTime: Integer } =
                neo4jResult.records[0]?.toObject().relationship;

            expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
            expect(isTime(neo4jRelationship.updatedAt)).toBe(true);
        });

        test("should update a movie (with timestamps)", async () => {
            const typeDefs = `
                    type ${Movie} {
                      id: ID
                      updatedAt: Time @timestamp(operations: [CREATE, UPDATE])
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                    mutation ($id: ID!) {
                        ${Movie.operations.update}(where: {id: $id}, update: { id: $id }) {
                            ${Movie.plural} {
                                id
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (m:${Movie} {id: "${id}"})
                    `);

            const graphqlResult = await testHelper.executeGraphQL(create, {
                variableValues: { id },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(`
                        MATCH (m:${Movie} {id: "${id}"})
                        RETURN m {.id, .updatedAt} as movie
                    `);

            const neo4jMovie: { id: string; updatedAt: Date } = neo4jResult.records[0]?.toObject().movie;

            expect(neo4jMovie.id).toEqual(id);
            expect(isTime(neo4jMovie.updatedAt)).toBe(true);
        });
    });

    describe("create/update (implicit)", () => {
        test("should create a movie (with timestamps)", async () => {
            const typeDefs = `
                    type ${Movie} {
                      id: ID
                      createdAt: Time @timestamp
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                    mutation {
                        ${Movie.operations.create}(input: [{ id: "${id}" }]) {
                            ${Movie.plural} {
                                id
                            }
                        }
                    }
                `;

            const graphqlResult = await testHelper.executeGraphQL(create);

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(`
                        MATCH (m:${Movie} {id: "${id}"})
                        RETURN m { .id, .createdAt } as movie
                    `);

            const neo4jMovie: { id: string; createdAt: Date } = neo4jResult.records[0]?.toObject().movie;

            expect(neo4jMovie.id).toEqual(id);
            expect(isTime(neo4jMovie.createdAt)).toBe(true);
        });

        test("create timestamp on relationship property", async () => {
            const typeDefs = `
                    type ${Actor} {
                        name: String!
                    }

                    type ActedIn @relationshipProperties {
                        createdAt: Time! @timestamp
                        screenTime: Int!
                    }

                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const create = `
                    mutation($title: String!, $name: String!, $screenTime: Int!) {
                        ${Movie.operations.create}(
                            input: [
                                { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: $screenTime } }] } }
                            ]
                        ) {
                            ${Movie.plural} {
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

            const graphqlResult = await testHelper.executeGraphQL(create, {
                variableValues: { title, name, screenTime },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(
                `
                            MATCH (:${Actor}{name: $name})-[r:ACTED_IN]->(:${Movie} {title: $title})
                            RETURN r { .createdAt, .screenTime } as relationship
                        `,
                { title, name }
            );

            const neo4jRelationship: { createdAt: Date; screenTime: Integer } =
                neo4jResult.records[0]?.toObject().relationship;

            expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
            expect(isTime(neo4jRelationship.createdAt)).toBe(true);
        });

        test("update timestamp on relationship property", async () => {
            const typeDefs = `
                    type ${Actor} {
                        name: String!
                    }

                    type ActedIn @relationshipProperties {
                        updatedAt: Time! @timestamp
                        screenTime: Int!
                    }

                    type ${Movie} {
                        title: String!
                        actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const title = generate({
                charset: "alphabetic",
            });
            const name = generate({
                charset: "alphabetic",
            });
            const screenTime = 60;

            const update = `
                    mutation($title: String!, $screenTime: Int!) {
                        ${Movie.operations.update}(
                            where: { title: $title }
                            update: { actors: [{ update: { edge: { screenTime: $screenTime } } }] }
                        ) {
                            ${Movie.plural} {
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

            await testHelper.executeCypher(
                `
                            CREATE (:${Movie} {title: $title})<-[:ACTED_IN {screenTime: 30}]-(:${Actor}{name: $name})
                        `,
                { title, name }
            );

            const graphqlResult = await testHelper.executeGraphQL(update, {
                variableValues: { title, screenTime },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(
                `
                            MATCH (:${Actor}{name: $name})-[r:ACTED_IN]->(:${Movie} {title: $title})
                            RETURN r { .updatedAt, .screenTime } as relationship
                        `,
                { title, name }
            );

            const neo4jRelationship: { updatedAt: Date; screenTime: Integer } =
                neo4jResult.records[0]?.toObject().relationship;

            expect(neo4jRelationship.screenTime.toInt()).toBe(screenTime);
            expect(isTime(neo4jRelationship.updatedAt)).toBe(true);
        });

        test("should update a movie (with timestamps)", async () => {
            const typeDefs = `
                    type ${Movie} {
                      id: ID
                      updatedAt: Time @timestamp
                    }
                `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                    mutation ($id: ID!) {
                        ${Movie.operations.update}(where: {id: $id}, update: { id: $id }) {
                            ${Movie.plural} {
                                id
                            }
                        }
                    }
                `;

            await testHelper.executeCypher(`
                        CREATE (m:${Movie} {id: "${id}"})
                    `);

            const graphqlResult = await testHelper.executeGraphQL(create, {
                variableValues: { id },
            });

            expect(graphqlResult.errors).toBeFalsy();

            const neo4jResult = await testHelper.executeCypher(`
                        MATCH (m:${Movie} {id: "${id}"})
                        RETURN m { .id, .updatedAt } as movie
                    `);

            const neo4jMovie: { id: string; updatedAt: Date } = neo4jResult.records[0]?.toObject().movie;

            expect(neo4jMovie.id).toEqual(id);
            expect(isTime(neo4jMovie.updatedAt)).toBe(true);
        });
    });
});
