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

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { TestHelper } from "../../utils/tests-helper";

describe("@populatedBy directive", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    describe("Node property tests", () => {
        describe("@populatedBy - String", () => {
            test("Should use on CREATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const string1 = generate({
                    charset: "alphabetic",
                });

                const callback = () => Promise.resolve(string1);

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        callback: String! @populatedBy(callback: "callback", operations: [CREATE])
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.create]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                callback: string1,
                            },
                        ],
                    },
                });
            });

            test("Should use on UPDATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const string1 = generate({
                    charset: "alphabetic",
                });

                const callback = () => Promise.resolve(string1);

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        callback: String! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                callback: string1,
                            },
                        ],
                    },
                });
            });

            test("Should use on CREATE and UPDATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const string1 = generate({
                    charset: "alphabetic",
                });
                const string2 = generate({
                    charset: "alphabetic",
                });

                let counter = 0;
                const callback = () => {
                    counter += 1;

                    if (counter === 1) {
                        return Promise.resolve(string1);
                    }

                    return Promise.resolve(string2);
                };

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        callback: String! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.create]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                callback: string1,
                            },
                        ],
                    },
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                callback: string2,
                            },
                        ],
                    },
                });
            });
        });

        describe("@populatedBy - Int", () => {
            test("Should use on CREATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const int1 = Number(
                    generate({
                        charset: "numeric",
                        length: 6,
                    })
                );

                const callback = () => Promise.resolve(int1);

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        callback: Int! @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.create]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                callback: int1,
                            },
                        ],
                    },
                });
            });

            test("Should use on UPDATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const int1 = Number(
                    generate({
                        charset: "numeric",
                        length: 6,
                    })
                );

                const callback = () => Promise.resolve(int1);

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        callback: Int! @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                callback: int1,
                            },
                        ],
                    },
                });
            });

            test("Should use on CREATE and UPDATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const int1 = Number(
                    generate({
                        charset: "numeric",
                        length: 6,
                    })
                );
                const int2 = Number(
                    generate({
                        charset: "numeric",
                        length: 6,
                    })
                );

                let counter = 0;
                const callback = () => {
                    counter += 1;

                    if (counter === 1) {
                        return Promise.resolve(int1);
                    }

                    return Promise.resolve(int2);
                };

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        callback: Int! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}" }]) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.create]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                callback: int1,
                            },
                        ],
                    },
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                callback: int2,
                            },
                        ],
                    },
                });
            });
        });

        describe("@populatedBy - Misc", () => {
            test("should not change the property when returning 'undefined'", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const string1 = generate({
                    charset: "alphabetic",
                });

                const callback = () => undefined;

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        callback: String @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}", callback: "${string1}" })
                    `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                callback: string1,
                            },
                        ],
                    },
                });
            });

            test("should remove property when returning 'null'", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const string1 = generate({
                    charset: "alphabetic",
                });

                const callback = () => null;

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        callback: String @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}" }) {
                            ${testMovie.plural} {
                                id
                                callback
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}", callback: "${string1}" })
                    `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                callback: null,
                            },
                        ],
                    },
                });
            });

            test("should have access to parent in callback function for CREATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const callback = (parent) => `${parent.title}-slug`;

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID!
                        title: String!
                        slug: String @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieTitle = generate({
                    charset: "alphabetic",
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}", title: "${movieTitle}" }]) {
                            ${testMovie.plural} {
                                id
                                title
                                slug
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.create]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                title: movieTitle,
                                slug: `${movieTitle}-slug`,
                            },
                        ],
                    },
                });
            });

            test("should have access to parent in callback function for UPDATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const callback = (parent) => `${parent.title}-slug`;

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID!
                        title: String!
                        slug: String @populatedBy(operations: [UPDATE], callback: "callback")
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieTitle = generate({
                    charset: "alphabetic",
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.update}(where: { id: "${movieId}" }, update: { id: "${movieId}", title: "${movieTitle}" }) {
                            ${testMovie.plural} {
                                id
                                title
                                slug
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })
                    `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                title: movieTitle,
                                slug: `${movieTitle}-slug`,
                            },
                        ],
                    },
                });
            });

            test("should have access to context as third argument", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const callback = (_parent, _args, context) => context.testValue;

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID!
                        title: String!
                        contextValue: String @populatedBy(operations: [CREATE], callback: "callback")
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieTitle = generate({
                    charset: "alphabetic",
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const testValue = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [{ id: "${movieId}", title: "${movieTitle}" }]) {
                            ${testMovie.plural} {
                                id
                                title
                                contextValue
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation, {
                    contextValue: { testValue },
                });

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.create]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                title: movieTitle,
                                contextValue: testValue,
                            },
                        ],
                    },
                });
            });
        });
    });
    describe("Relationship property tests", () => {
        describe("@populatedBy - String", () => {
            test("Should use on CREATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const testGenre = testHelper.createUniqueType("Genre");
                const string1 = generate({
                    charset: "alphabetic",
                });

                const callback = () => Promise.resolve(string1);

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        genres: [${testGenre.name}!]! @relationship(
                            type: "IN_GENRE",
                            direction: OUT,
                            properties: "RelProperties"
                        )
                    }

                    type RelProperties @relationshipProperties {
                        id: ID!
                        callback: String! @populatedBy(operations: [CREATE], callback: "callback")
                    }

                    type ${testGenre.name} {
                        id: ID!
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });
                const genreId = generate({
                    charset: "alphabetic",
                });
                const relId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [
                            {
                                id: "${movieId}",
                                genres: {
                                    create: [
                                        {
                                            node: {
                                                id: "${genreId}",
                                            },
                                            edge: {
                                                id: "${relId}",
                                            }
                                        }
                                    ]
                                }
                            }
                        ]) {
                            ${testMovie.plural} {
                                id
                                genresConnection {
                                    edges {
                                       properties { callback
                                       }
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.create]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                genresConnection: {
                                    edges: [
                                        {
                                            properties: { callback: string1 },
                                            node: {
                                                id: genreId,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                });
            });

            test("Should use on UPDATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const testGenre = testHelper.createUniqueType("Genre");
                const string1 = generate({
                    charset: "alphabetic",
                });

                const callback = () => Promise.resolve(string1);

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        genres: [${testGenre.name}!]! @relationship(
                            type: "IN_GENRE", 
                            direction: OUT, 
                            properties: "RelProperties"
                        )
                    }

                    type RelProperties @relationshipProperties {
                        id: ID!
                        callback: String! @populatedBy(operations: [UPDATE], callback: "callback")
                    }

                    type ${testGenre.name} {
                        id: ID!
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const genreId = generate({
                    charset: "alphabetic",
                });
                const relId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.update}(
                            where: { id: "${movieId}" }, 
                            update: { 
                                genres: {
                                    update: {
                                        edge: {
                                            id: "${relId}"
                                        }
                                    }
                                }
                            }
                        ) {
                            ${testMovie.plural} {
                                id
                                genresConnection {
                                    edges {
                                       properties { callback
                                       }
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })-[:IN_GENRE { id: "${relId}" }]->(:${testGenre.name} { id: "${genreId}" })
                    `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                genresConnection: {
                                    edges: [
                                        {
                                            properties: { callback: string1 },
                                            node: {
                                                id: genreId,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                });
            });

            test("Should use on CREATE and UPDATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const testGenre = testHelper.createUniqueType("Genre");
                const string1 = generate({
                    charset: "alphabetic",
                });
                const string2 = generate({
                    charset: "alphabetic",
                });

                let counter = 0;
                const callback = () => {
                    counter += 1;

                    if (counter === 1) {
                        return Promise.resolve(string1);
                    }

                    return Promise.resolve(string2);
                };

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        genres: [${testGenre.name}!]! @relationship(
                            type: "IN_GENRE", 
                            direction: OUT, 
                            properties: "RelProperties"
                        )
                    }

                    type RelProperties @relationshipProperties {
                        id: ID!
                        callback: String! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
                    }

                    type ${testGenre.name} {
                        id: ID!
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });
                const genreId = generate({
                    charset: "alphabetic",
                });
                const relId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [
                            {
                                id: "${movieId}",
                                genres: {
                                    create: [
                                        {
                                            node: {
                                                id: "${genreId}",
                                            },
                                            edge: {
                                                id: "${relId}",
                                            }
                                        }
                                    ]
                                }
                            }
                        ]) {
                            ${testMovie.plural} {
                                id
                                genresConnection {
                                    edges {
                                      properties {  callback
                                      }
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }

                        ${testMovie.operations.update}(
                            where: { id: "${movieId}" }, 
                            update: { 
                                genres: {
                                    update: {
                                        edge: {
                                            id: "${relId}"
                                        }
                                    }
                                }
                            }
                        ) {
                            ${testMovie.plural} {
                                id
                                genresConnection {
                                    edges {
                                       properties { callback
                                       }
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.create]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                genresConnection: {
                                    edges: [
                                        {
                                            properties: { callback: string1 },
                                            node: {
                                                id: genreId,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                genresConnection: {
                                    edges: [
                                        {
                                            properties: { callback: string2 },
                                            node: {
                                                id: genreId,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                });
            });
        });

        describe("@populatedBy - Int", () => {
            test("Should use on CREATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const testGenre = testHelper.createUniqueType("Genre");
                const int1 = Number(
                    generate({
                        charset: "numeric",
                        length: 6,
                    })
                );

                const callback = () => Promise.resolve(int1);

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        genres: [${testGenre.name}!]! @relationship(
                            type: "IN_GENRE",
                            direction: OUT,
                            properties: "RelProperties"
                        )
                    }

                    type RelProperties @relationshipProperties {
                        id: ID!
                        callback: Int! @populatedBy(operations: [CREATE], callback: "callback")
                    }

                    type ${testGenre.name} {
                        id: ID!
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });
                const genreId = generate({
                    charset: "alphabetic",
                });
                const relId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [
                            {
                                id: "${movieId}",
                                genres: {
                                    create: [
                                        {
                                            node: {
                                                id: "${genreId}",
                                            },
                                            edge: {
                                                id: "${relId}",
                                            }
                                        }
                                    ]
                                }
                            }
                        ]) {
                            ${testMovie.plural} {
                                id
                                genresConnection {
                                    edges {
                                       properties { callback
                                       }
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.create]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                genresConnection: {
                                    edges: [
                                        {
                                            properties: { callback: int1 },
                                            node: {
                                                id: genreId,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                });
            });

            test("Should use on UPDATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const testGenre = testHelper.createUniqueType("Genre");
                const int1 = Number(
                    generate({
                        charset: "numeric",
                        length: 6,
                    })
                );

                const callback = () => Promise.resolve(int1);

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        genres: [${testGenre.name}!]! @relationship(
                            type: "IN_GENRE", 
                            direction: OUT, 
                            properties: "RelProperties"
                        )
                    }

                    type RelProperties @relationshipProperties {
                        id: ID!
                        callback: Int! @populatedBy(operations: [UPDATE], callback: "callback")
                    }

                    type ${testGenre.name} {
                        id: ID!
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });

                const genreId = generate({
                    charset: "alphabetic",
                });
                const relId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.update}(
                            where: { id: "${movieId}" }, 
                            update: { 
                                genres: {
                                    update: {
                                        edge: {
                                            id: "${relId}"
                                        }
                                    }
                                }
                            }
                        ) {
                            ${testMovie.plural} {
                                id
                                genresConnection {
                                    edges {
                                      properties { callback
                                      }
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                await testHelper.executeCypher(`
                        CREATE (:${testMovie.name} { id: "${movieId}" })-[:IN_GENRE { id: "${relId}" }]->(:${testGenre.name} { id: "${genreId}" })
                    `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                genresConnection: {
                                    edges: [
                                        {
                                            properties: { callback: int1 },
                                            node: {
                                                id: genreId,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                });
            });

            test("Should use on CREATE and UPDATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const testGenre = testHelper.createUniqueType("Genre");
                const int1 = Number(
                    generate({
                        charset: "numeric",
                        length: 6,
                    })
                );
                const int2 = Number(
                    generate({
                        charset: "numeric",
                        length: 6,
                    })
                );

                let counter = 0;
                const callback = () => {
                    counter += 1;

                    if (counter === 1) {
                        return Promise.resolve(int1);
                    }

                    return Promise.resolve(int2);
                };

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        genres: [${testGenre.name}!]! @relationship(
                            type: "IN_GENRE", 
                            direction: OUT, 
                            properties: "RelProperties"
                        )
                    }

                    type RelProperties @relationshipProperties {
                        id: ID!
                        callback: Int! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
                    }

                    type ${testGenre.name} {
                        id: ID!
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });
                const genreId = generate({
                    charset: "alphabetic",
                });
                const relId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [
                            {
                                id: "${movieId}",
                                genres: {
                                    create: [
                                        {
                                            node: {
                                                id: "${genreId}",
                                            },
                                            edge: {
                                                id: "${relId}",
                                            }
                                        }
                                    ]
                                }
                            }
                        ]) {
                            ${testMovie.plural} {
                                id
                                genresConnection {
                                    edges {
                                       properties { callback
                                       }
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }

                        ${testMovie.operations.update}(
                            where: { id: "${movieId}" }, 
                            update: { 
                                genres: {
                                    update: {
                                        edge: {
                                            id: "${relId}"
                                        }
                                    }
                                }
                            }
                        ) {
                            ${testMovie.plural} {
                                id
                                genresConnection {
                                    edges {
                                       properties { callback
                                       }
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.create]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                genresConnection: {
                                    edges: [
                                        {
                                            properties: { callback: int1 },
                                            node: {
                                                id: genreId,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                genresConnection: {
                                    edges: [
                                        {
                                            properties: { callback: int2 },
                                            node: {
                                                id: genreId,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                });
            });
        });

        describe("@populatedBy - Misc", () => {
            test("should have access to parent in callback function for CREATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const testGenre = testHelper.createUniqueType("Genre");
                const callback = (parent) => `${parent.title}-slug`;

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        genres: [${testGenre.name}!]! @relationship(
                            type: "IN_GENRE",
                            direction: OUT,
                            properties: "RelProperties"
                        )
                    }

                    type RelProperties @relationshipProperties {
                        id: ID!
                        title: String!
                        slug: String! @populatedBy(operations: [CREATE], callback: "callback")
                    }

                    type ${testGenre.name} {
                        id: ID!
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });
                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const genreId = generate({
                    charset: "alphabetic",
                });
                const relId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                    mutation {
                        ${testMovie.operations.create}(input: [
                            {
                                id: "${movieId}",
                                genres: {
                                    create: [
                                        {
                                            node: {
                                                id: "${genreId}",
                                            },
                                            edge: {
                                                id: "${relId}",
                                                title: "${movieTitle}"
                                            }
                                        }
                                    ]
                                }
                            }
                        ]) {
                            ${testMovie.plural} {
                                id
                                genresConnection {
                                    edges {
                                      properties { 
                                         title
                                         slug
                                      }
                                        node {
                                            id
                                        }
                                    }
                                }
                            }
                        }
                    }
                `;

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.create]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                genresConnection: {
                                    edges: [
                                        {
                                            properties: { title: movieTitle, slug: `${movieTitle}-slug` },
                                            node: {
                                                id: genreId,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                });
            });

            test("should have access to parent in callback function for UPDATE", async () => {
                const testMovie = testHelper.createUniqueType("Movie");
                const testGenre = testHelper.createUniqueType("Genre");
                const callback = (parent) => `${parent.title}-slug`;

                const typeDefs = gql`
                    type ${testMovie.name} {
                        id: ID
                        genres: [${testGenre.name}!]! @relationship(
                            type: "IN_GENRE",
                            direction: OUT,
                            properties: "RelProperties"
                        )
                    }

                    type RelProperties @relationshipProperties {
                        id: ID!
                        title: String!
                        slug: String! @populatedBy(operations: [UPDATE], callback: "callback")
                    }

                    type ${testGenre.name} {
                        id: ID!
                    }
                `;

                await testHelper.initNeo4jGraphQL({
                    typeDefs,
                    features: {
                        populatedBy: {
                            callbacks: {
                                callback,
                            },
                        },
                    },
                });

                const movieId = generate({
                    charset: "alphabetic",
                });
                const movieTitle = generate({
                    charset: "alphabetic",
                });
                const genreId = generate({
                    charset: "alphabetic",
                });
                const relId = generate({
                    charset: "alphabetic",
                });

                const mutation = `
                mutation {
                    ${testMovie.operations.update}(
                        where: { id: "${movieId}" }, 
                        update: { 
                            genres: {
                                update: {
                                    edge: {
                                        id: "${relId}"
                                        title: "${movieTitle}"
                                    }
                                }
                            }
                        }
                    ) {
                        ${testMovie.plural} {
                            id
                            genresConnection {
                                edges {
                                  properties { 
                                     title
                                     slug
                                  }
                                    node {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

                await testHelper.executeCypher(`
                    CREATE (:${testMovie.name} { id: "${movieId}" })-[:IN_GENRE { id: "${relId}" }]->(:${testGenre.name} { id: "${genreId}" })
                `);

                const result = await testHelper.executeGraphQL(mutation);

                expect(result.errors).toBeUndefined();
                expect(result.data as any).toMatchObject({
                    [testMovie.operations.update]: {
                        [testMovie.plural]: [
                            {
                                id: movieId,
                                genresConnection: {
                                    edges: [
                                        {
                                            properties: { title: movieTitle, slug: `${movieTitle}-slug` },
                                            node: {
                                                id: genreId,
                                            },
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                });
            });
        });
    });
});
