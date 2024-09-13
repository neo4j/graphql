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

import { type DateTime } from "neo4j-driver";
import { generate } from "randomstring";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("timestamp/datetime", () => {
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
                  createdAt: DateTime @timestamp(operations: [CREATE])
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

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

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie}  {id: "${id}"})
                    RETURN m {.id, .createdAt} as m
                `);

            const movie: {
                id: string;
                createdAt: DateTime;
            } = (result.records[0]?.toObject() as any).m;

            expect(movie.id).toEqual(id);
            expect(new Date(movie.createdAt.toString())).toBeInstanceOf(Date);
        });

        test("create timestamp on relationship property", async () => {
            const typeDefs = `
                type ${Actor} {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    createdAt: DateTime! @timestamp(operations: [CREATE])
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

            const create = `
                mutation($title: String!, $name: String!) {
                    ${Movie.operations.create}(
                        input: [
                            { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: 60 } }] } }
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

            const result = await testHelper.executeGraphQL(create, {
                variableValues: { title, name },
            });

            expect(result.errors).toBeFalsy();

            const { actorsConnection } = (result.data as any)[Movie.operations.create][Movie.plural][0];

            expect(new Date(actorsConnection.edges[0].properties.createdAt as string)).toBeInstanceOf(Date);
        });
    });

    describe("update", () => {
        test("should update a movie (with timestamps)", async () => {
            const typeDefs = `
                type ${Movie} {
                  id: ID
                  updatedAt: DateTime @timestamp(operations: [UPDATE])
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    ${Movie.operations.update}(where: {id: "${id}"}, update: { id: "${id}" }) {
                        ${Movie.plural} {
                            id
                        }
                    }
                }
            `;

            await testHelper.executeCypher(`
                    CREATE (m:${Movie}  {id: "${id}"})
                `);

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie}  {id: "${id}"})
                    RETURN m {.id, .updatedAt} as m
                `);

            const movie: {
                id: string;
                updatedAt: DateTime;
            } = (result.records[0]?.toObject() as any).m;

            expect(movie.id).toEqual(id);
            expect(new Date(movie.updatedAt.toString())).toBeInstanceOf(Date);
        });

        test("update timestamp on relationship property", async () => {
            const typeDefs = `
                type ${Actor} {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    updatedAt: DateTime! @timestamp(operations: [UPDATE])
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

            const update = `
                mutation($title: String!) {
                    ${Movie.operations.update}(
                        where: { title: $title }
                        update: { actors: [{ update: { edge: { screenTime: 60 } } }] }
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
                    CREATE (:${Movie} {title: $title})<-[:ACTED_IN {screenTime: 30}]-(:${Actor}  {name: $name})
                `,
                { title, name }
            );

            const result = await testHelper.executeGraphQL(update, {
                variableValues: { title },
            });

            expect(result.errors).toBeFalsy();

            const { actorsConnection } = (result.data as any)[Movie.operations.update][Movie.plural][0];

            expect(new Date(actorsConnection.edges[0].properties.updatedAt as string)).toBeInstanceOf(Date);
        });
    });

    describe("create/update (explicit)", () => {
        test("should create a movie (with timestamps)", async () => {
            const typeDefs = `
                type ${Movie} {
                  id: ID
                  createdAt: DateTime @timestamp(operations: [CREATE, UPDATE])
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

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

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie}  {id: "${id}"})
                    RETURN m {.id, .createdAt} as m
                `);

            const movie: {
                id: string;
                createdAt: DateTime;
            } = (result.records[0]?.toObject() as any).m;

            expect(movie.id).toEqual(id);
            expect(new Date(movie.createdAt.toString())).toBeInstanceOf(Date);
        });

        test("create timestamp on relationship property", async () => {
            const typeDefs = `
                type ${Actor} {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    createdAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
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

            const create = `
                mutation($title: String!, $name: String!) {
                    ${Movie.operations.create}(
                        input: [
                            { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: 60 } }] } }
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

            const result = await testHelper.executeGraphQL(create, {
                variableValues: { title, name },
            });

            expect(result.errors).toBeFalsy();

            const { actorsConnection } = (result.data as any)[Movie.operations.create][Movie.plural][0];

            expect(new Date(actorsConnection.edges[0].properties.createdAt as string)).toBeInstanceOf(Date);
        });

        test("update timestamp on relationship property", async () => {
            const typeDefs = `
                type ${Actor} {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
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

            const update = `
                mutation($title: String!) {
                    ${Movie.operations.update}(
                        where: { title: $title }
                        update: { actors: [{ update: { edge: { screenTime: 60 } } }] }
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
                    CREATE (:${Movie} {title: $title})<-[:ACTED_IN {screenTime: 30}]-(:${Actor}  {name: $name})
                `,
                { title, name }
            );

            const result = await testHelper.executeGraphQL(update, {
                variableValues: { title },
            });

            expect(result.errors).toBeFalsy();

            const { actorsConnection } = (result.data as any)[Movie.operations.update][Movie.plural][0];

            expect(new Date(actorsConnection.edges[0].properties.updatedAt as string)).toBeInstanceOf(Date);
        });

        test("should update a movie (with timestamps)", async () => {
            const typeDefs = `
                type ${Movie} {
                  id: ID
                  updatedAt: DateTime @timestamp(operations: [CREATE, UPDATE])
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    ${Movie.operations.update}(where: {id: "${id}"}, update: { id: "${id}" }) {
                        ${Movie.plural} {
                            id
                        }
                    }
                }
            `;

            await testHelper.executeCypher(`
                    CREATE (m:${Movie}  {id: "${id}"})
                `);

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie}  {id: "${id}"})
                    RETURN m {.id, .updatedAt} as m
                `);

            const movie: {
                id: string;
                updatedAt: DateTime;
            } = (result.records[0]?.toObject() as any).m;

            expect(movie.id).toEqual(id);
            expect(new Date(movie.updatedAt.toString())).toBeInstanceOf(Date);
        });
    });

    describe("create/update (implicit)", () => {
        test("should create a movie (with timestamps)", async () => {
            const typeDefs = `
                type ${Movie} {
                  id: ID
                  createdAt: DateTime @timestamp
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

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

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie}  {id: "${id}"})
                    RETURN m {.id, .createdAt} as m
                `);

            const movie: {
                id: string;
                createdAt: DateTime;
            } = (result.records[0]?.toObject() as any).m;

            expect(movie.id).toEqual(id);
            expect(new Date(movie.createdAt.toString())).toBeInstanceOf(Date);
        });

        test("create timestamp on relationship property", async () => {
            const typeDefs = `
                type ${Actor} {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    createdAt: DateTime! @timestamp
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

            const create = `
                mutation($title: String!, $name: String!) {
                    ${Movie.operations.create}(
                        input: [
                            { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: 60 } }] } }
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

            const result = await testHelper.executeGraphQL(create, {
                variableValues: { title, name },
            });

            expect(result.errors).toBeFalsy();

            const { actorsConnection } = (result.data as any)[Movie.operations.create][Movie.plural][0];

            expect(new Date(actorsConnection.edges[0].properties.createdAt as string)).toBeInstanceOf(Date);
        });

        test("update timestamp on relationship property", async () => {
            const typeDefs = `
                type ${Actor} {
                    name: String!
                }

                type ActedIn @relationshipProperties {
                    updatedAt: DateTime! @timestamp
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

            const update = `
                mutation($title: String!) {
                    ${Movie.operations.update}(
                        where: { title: $title }
                        update: { actors: [{ update: { edge: { screenTime: 60 } } }] }
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
                    CREATE (:${Movie} {title: $title})<-[:ACTED_IN {screenTime: 30}]-(:${Actor}  {name: $name})
                `,
                { title, name }
            );

            const result = await testHelper.executeGraphQL(update, {
                variableValues: { title },
            });

            expect(result.errors).toBeFalsy();

            const { actorsConnection } = (result.data as any)[Movie.operations.update][Movie.plural][0];

            expect(new Date(actorsConnection.edges[0].properties.updatedAt as string)).toBeInstanceOf(Date);
        });

        test("should update a movie (with timestamps)", async () => {
            const typeDefs = `
                type ${Movie} {
                  id: ID
                  updatedAt: DateTime @timestamp
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    ${Movie.operations.update}(where: {id: "${id}"}, update: { id: "${id}" }) {
                        ${Movie.plural} {
                            id
                        }
                    }
                }
            `;

            await testHelper.executeCypher(`
                    CREATE (m:${Movie}  {id: "${id}"})
                `);

            const gqlResult = await testHelper.executeGraphQL(create);

            expect(gqlResult.errors).toBeFalsy();

            const result = await testHelper.executeCypher(`
                    MATCH (m:${Movie}  {id: "${id}"})
                    RETURN m {.id, .updatedAt} as m
                `);

            const movie: {
                id: string;
                updatedAt: DateTime;
            } = (result.records[0]?.toObject() as any).m;

            expect(movie.id).toEqual(id);
            expect(new Date(movie.updatedAt.toString())).toBeInstanceOf(Date);
        });
    });
});
