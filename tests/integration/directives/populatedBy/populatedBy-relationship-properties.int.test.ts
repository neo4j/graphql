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

import { generate } from "randomstring";
import { TestHelper } from "../../../utils/tests-helper";

describe("@populatedBy directive - Relationship properties", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    describe("@populatedBy - String", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");
            const string1 = "string_one";

            const callback = () => Promise.resolve(string1);

            const typeDefs = /* GraphQL */ `
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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
            const string1 = "string_one";

            const callback = () => Promise.resolve(string1);

            const typeDefs = /* GraphQL */ `
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

            const movieId = "movie_id";

            const genreId = "genre_id";
            const relId = "relationship_id";

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
            const string1 = "string_one";
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

            const typeDefs = /* GraphQL */ `
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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

            const typeDefs = /* GraphQL */ `
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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

            const typeDefs = /* GraphQL */ `
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

            const movieId = "movie_id";

            const genreId = "genre_id";
            const relId = "relationship_id";

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

            const typeDefs = /* GraphQL */ `
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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

    describe("@populatedBy - Float", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");
            const float1 = Number(
                generate({
                    charset: "numeric",
                    length: 6,
                })
            );

            const callback = () => Promise.resolve(float1);

            const typeDefs = /* GraphQL */ `
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
                        callback: Float! @populatedBy(operations: [CREATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: float1 },
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
            const float1 = Number(
                generate({
                    charset: "numeric",
                    length: 6,
                })
            );

            const callback = () => Promise.resolve(float1);

            const typeDefs = /* GraphQL */ `
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

            const movieId = "movie_id";

            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: float1 },
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
            const float1 = Number(
                generate({
                    charset: "numeric",
                    length: 6,
                })
            );
            const float2 = Number(
                generate({
                    charset: "numeric",
                    length: 6,
                })
            );

            let counter = 0;
            const callback = () => {
                counter += 1;

                if (counter === 1) {
                    return Promise.resolve(float1);
                }

                return Promise.resolve(float2);
            };

            const typeDefs = /* GraphQL */ `
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: float1 },
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
                                        properties: { callback: float2 },
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

    describe("@populatedBy - Boolean", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");

            const callback = () => Promise.resolve(true);

            const typeDefs = /* GraphQL */ `
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
                        callback: Boolean! @populatedBy(operations: [CREATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: true },
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

            const callback = () => Promise.resolve(true);

            const typeDefs = /* GraphQL */ `
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
                        callback: Boolean! @populatedBy(operations: [UPDATE], callback: "callback")
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

            const movieId = "movie_id";

            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: true },
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

            let counter = 0;
            const callback = () => {
                counter += 1;

                if (counter === 1) {
                    return Promise.resolve(true);
                }

                return Promise.resolve(false);
            };

            const typeDefs = /* GraphQL */ `
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
                        callback: Boolean! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: true },
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
                                        properties: { callback: false },
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

    describe("@populatedBy - ID", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");

            const callback = () => Promise.resolve("12345");

            const typeDefs = /* GraphQL */ `
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
                        callback: ID! @populatedBy(operations: [CREATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: "12345" },
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

            const callback = () => Promise.resolve("12345");

            const typeDefs = /* GraphQL */ `
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
                        callback: ID! @populatedBy(operations: [UPDATE], callback: "callback")
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

            const movieId = "movie_id";

            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: "12345" },
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

            let counter = 0;
            const callback = () => {
                counter += 1;

                if (counter === 1) {
                    return Promise.resolve(54321);
                }

                return Promise.resolve("76543");
            };

            const typeDefs = /* GraphQL */ `
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
                        callback: ID! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: "54321" },
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
                                        properties: { callback: "76543" },
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

        test("should throw an error if the callback result is not a number or a string", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");

            const callback = () => Promise.resolve(true);

            const typeDefs = /* GraphQL */ `
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
                        callback: ID! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "ID cannot represent value: true",
                }),
            ]);
        });
    });

    describe("@populatedBy - BigInt", () => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");

            const callback = () => Promise.resolve("12345");

            const typeDefs = /* GraphQL */ `
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
                        callback: BigInt! @populatedBy(operations: [CREATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: "12345" },
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

            const callback = () => Promise.resolve("12345");

            const typeDefs = /* GraphQL */ `
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
                        callback: BigInt! @populatedBy(operations: [UPDATE], callback: "callback")
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

            const movieId = "movie_id";

            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: "12345" },
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

            let counter = 0;
            const callback = () => {
                counter += 1;

                if (counter === 1) {
                    return Promise.resolve("54321");
                }

                return Promise.resolve("76543");
            };

            const typeDefs = /* GraphQL */ `
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
                        callback: BigInt! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: "54321" },
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
                                        properties: { callback: "76543" },
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

        test("should throw an error if the callback result is not a number or a string", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");

            const callback = () => Promise.resolve("banana");

            const typeDefs = /* GraphQL */ `
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
                        callback: BigInt! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: "Value must be either a BigInt, or a string representing a BigInt value.",
                }),
            ]);
        });
    });

    const date = new Date(1716458062912);

    describe.each<{
        description: string;
        type: string;
        callback: () => Promise<string>;
        expectedValue: string;
    }>([
        {
            description: "@populatedBy - Time",
            type: "Time",
            callback: () => Promise.resolve(`${date.toISOString().split("T")[1]}`),
            expectedValue: `${date.toISOString().split("T")[1]?.split("Z")[0]}000000Z`,
        },
        {
            description: "@populatedBy - LocalDateTime",
            type: "LocalDateTime",
            callback: () => Promise.resolve(`${date.toISOString().split("Z")[0]}`),
            expectedValue: `${date.toISOString().split("Z")[0]}000000`,
        },
        {
            description: "@populatedBy - LocalTime",
            type: "LocalTime",
            callback: () => Promise.resolve(`${date.toISOString().split("Z")[0]?.split("T")[1]}`),
            expectedValue: `${date.toISOString().split("Z")[0]?.split("T")[1]}000000`,
        },
        {
            description: "@populatedBy - Duration",
            type: "Duration",
            callback: () => Promise.resolve(`P14M3DT14700S`),
            expectedValue: `P14M3DT14700S`,
        },
    ])("$description", ({ type, callback, expectedValue }) => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");

            const typeDefs = /* GraphQL */ `
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
                        callback: ${type}! @populatedBy(operations: [CREATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: expectedValue },
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

            const typeDefs = /* GraphQL */ `
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
                        callback: ${type}! @populatedBy(operations: [UPDATE], callback: "callback")
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

            const movieId = "movie_id";

            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: expectedValue },
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

        test(`should throw an error if string is not a ${type}`, async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");

            const callback = () => Promise.resolve("banana");

            const typeDefs = /* GraphQL */ `
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
                        callback: ${type}! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: `Value must be formatted as ${type}: banana`,
                }),
            ]);
        });
    });

    describe.each<{
        description: string;
        type: string;
        callback: () => Promise<string>;
        expectedValue: string;
    }>([
        {
            description: "@populatedBy - DateTime",
            type: "DateTime",
            callback: () => Promise.resolve(date.toISOString()),
            expectedValue: date.toISOString(),
        },
        {
            description: "@populatedBy - Date",
            type: "Date",
            callback: () => Promise.resolve(date.toISOString()),
            expectedValue: `${date.toISOString().split("T")[0]}`,
        },
    ])("$description", ({ type, callback, expectedValue }) => {
        test("Should use on CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");

            const typeDefs = /* GraphQL */ `
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
                        callback: ${type}! @populatedBy(operations: [CREATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: expectedValue },
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

            const typeDefs = /* GraphQL */ `
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
                        callback: ${type}! @populatedBy(operations: [UPDATE], callback: "callback")
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

            const movieId = "movie_id";

            const genreId = "genre_id";
            const relId = "relationship_id";

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
                                        properties: { callback: expectedValue },
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

        test(`should throw an error if the callback result is not a ${type}`, async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");

            const callback = () => Promise.resolve("banana");

            const typeDefs = /* GraphQL */ `
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
                        callback: ${type}! @populatedBy(operations: [CREATE, UPDATE], callback: "callback")
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

            const movieId = "movie_id";
            const genreId = "genre_id";
            const relId = "relationship_id";

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

            expect(result.errors).toEqual([
                expect.objectContaining({
                    message: `${type} cannot represent non temporal value: banana`,
                }),
            ]);
        });
    });

    describe("@populatedBy - Misc", () => {
        test("should have access to parent in callback function for CREATE", async () => {
            const testMovie = testHelper.createUniqueType("Movie");
            const testGenre = testHelper.createUniqueType("Genre");
            const callback = (parent) => `${parent.title}-slug`;

            const typeDefs = /* GraphQL */ `
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

            const movieId = "movie_id";
            const movieTitle = generate({
                charset: "alphabetic",
            });
            const genreId = "genre_id";
            const relId = "relationship_id";

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

            const typeDefs = /* GraphQL */ `
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

            const movieId = "movie_id";
            const movieTitle = generate({
                charset: "alphabetic",
            });
            const genreId = "genre_id";
            const relId = "relationship_id";

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
