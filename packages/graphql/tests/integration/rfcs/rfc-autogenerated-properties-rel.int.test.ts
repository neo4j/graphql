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
import { generate } from "randomstring";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../utils/graphql-types";

describe("integration/rfc/autogenerate-properties-rel", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("Callback - String", () => {
        test("should insert callback on CREATE", async () => {
            const testMovie = generateUniqueType("Movie");
            const testGenre = generateUniqueType("Genre");
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

                interface RelProperties {
                    id: ID!
                    callback: String! @callback(operations: [CREATE], name: "callback")
                }

                type ${testGenre.name} {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: {
                    callbacks: {
                        callback,
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
                                    callback
                                    node {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            genresConnection: {
                                edges: [
                                    {
                                        callback: string1,
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

        test("should insert callback on UPDATE", async () => {
            const testMovie = generateUniqueType("Movie");
            const testGenre = generateUniqueType("Genre");
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

                interface RelProperties {
                    id: ID!
                    callback: String! @callback(operations: [UPDATE], name: "callback")
                }

                type ${testGenre.name} {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: {
                    callbacks: {
                        callback,
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
                                    callback
                                    node {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const session = driver.session();

            try {
                await session.run(`
                    CREATE (:${testMovie.name} { id: "${movieId}" })-[:IN_GENRE { id: "${relId}" }]->(:${testGenre.name} { id: "${genreId}" })
                `);
            } finally {
                await session.close();
            }

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            genresConnection: {
                                edges: [
                                    {
                                        callback: string1,
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

        test("should insert callback on CREATE and UPDATE", async () => {
            const testMovie = generateUniqueType("Movie");
            const testGenre = generateUniqueType("Genre");
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

                interface RelProperties {
                    id: ID!
                    callback: String! @callback(operations: [CREATE, UPDATE], name: "callback")
                }

                type ${testGenre.name} {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: {
                    callbacks: {
                        callback,
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
                                    callback
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
                                    callback
                                    node {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            genresConnection: {
                                edges: [
                                    {
                                        callback: string1,
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
                                        callback: string2,
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

    describe("Callback - Int", () => {
        test("should insert callback on CREATE", async () => {
            const testMovie = generateUniqueType("Movie");
            const testGenre = generateUniqueType("Genre");
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

                interface RelProperties {
                    id: ID!
                    callback: Int! @callback(operations: [CREATE], name: "callback")
                }

                type ${testGenre.name} {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: {
                    callbacks: {
                        callback,
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
                                    callback
                                    node {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            genresConnection: {
                                edges: [
                                    {
                                        callback: int1,
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

        test("should insert callback on UPDATE", async () => {
            const testMovie = generateUniqueType("Movie");
            const testGenre = generateUniqueType("Genre");
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

                interface RelProperties {
                    id: ID!
                    callback: Int! @callback(operations: [UPDATE], name: "callback")
                }

                type ${testGenre.name} {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: {
                    callbacks: {
                        callback,
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
                                    callback
                                    node {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const session = driver.session();

            try {
                await session.run(`
                    CREATE (:${testMovie.name} { id: "${movieId}" })-[:IN_GENRE { id: "${relId}" }]->(:${testGenre.name} { id: "${genreId}" })
                `);
            } finally {
                await session.close();
            }

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            genresConnection: {
                                edges: [
                                    {
                                        callback: int1,
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

        test("should insert callback on CREATE and UPDATE", async () => {
            const testMovie = generateUniqueType("Movie");
            const testGenre = generateUniqueType("Genre");
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

                interface RelProperties {
                    id: ID!
                    callback: Int! @callback(operations: [CREATE, UPDATE], name: "callback")
                }

                type ${testGenre.name} {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: {
                    callbacks: {
                        callback,
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
                                    callback
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
                                    callback
                                    node {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            genresConnection: {
                                edges: [
                                    {
                                        callback: int1,
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
                                        callback: int2,
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

    describe("Callback - Misc", () => {
        test("should have access to parent in callback function for CREATE", async () => {
            const testMovie = generateUniqueType("Movie");
            const testGenre = generateUniqueType("Genre");
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

                interface RelProperties {
                    id: ID!
                    title: String!
                    slug: String! @callback(operations: [CREATE], name: "callback")
                }

                type ${testGenre.name} {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: {
                    callbacks: {
                        callback,
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
                                    title
                                    slug
                                    node {
                                        id
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.create]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            genresConnection: {
                                edges: [
                                    {
                                        title: movieTitle,
                                        slug: `${movieTitle}-slug`,
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
            const testMovie = generateUniqueType("Movie");
            const testGenre = generateUniqueType("Genre");
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

                interface RelProperties {
                    id: ID!
                    title: String!
                    slug: String! @callback(operations: [UPDATE], name: "callback")
                }

                type ${testGenre.name} {
                    id: ID!
                }
            `;

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: {
                    callbacks: {
                        callback,
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
                                title
                                slug
                                node {
                                    id
                                }
                            }
                        }
                    }
                }
            }
        `;

            const session = driver.session();

            try {
                await session.run(`
                CREATE (:${testMovie.name} { id: "${movieId}" })-[:IN_GENRE { id: "${relId}" }]->(:${testGenre.name} { id: "${genreId}" })
            `);
            } finally {
                await session.close();
            }

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeUndefined();
            expect(result.data as any).toMatchObject({
                [testMovie.operations.update]: {
                    [testMovie.plural]: [
                        {
                            id: movieId,
                            genresConnection: {
                                edges: [
                                    {
                                        title: movieTitle,
                                        slug: `${movieTitle}-slug`,
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
