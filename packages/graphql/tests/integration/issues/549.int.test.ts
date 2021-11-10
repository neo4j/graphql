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

describe("https://github.com/neo4j/graphql/issues/549", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should throw error when creating a node without a (single) relationship", async () => {
        const typeDefs = gql`
            type Director {
                id: ID!
            }

            type Movie {
                id: ID!
                director: Director! @relationship(type: "DIRECTED", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                createMovies(input: [{id: "${movieId}"}]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await graphql({
            schema: neoSchema.schema,
            source: mutation,
            contextValue: { driver },
        });

        expect(result.errors).toBeTruthy();
        expect((result.errors as any[])[0].message).toEqual("Movie.director required");
    });

    test("should throw error when creating a node without a (array) relationship", async () => {
        const typeDefs = gql`
            type Director {
                id: ID!
            }

            type Movie {
                id: ID!
                directors: [Director!] @relationship(type: "DIRECTED", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                createMovies(input: [{id: "${movieId}"}]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await graphql({
            schema: neoSchema.schema,
            source: mutation,
            contextValue: { driver },
        });

        expect(result.errors).toBeTruthy();
        expect((result.errors as any[])[0].message).toEqual("Movie.directors required");
    });

    test("should throw error when updating a node (top level) without a (single) relationship", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Director {
                id: ID!
            }

            type Movie {
                id: ID!
                director: Director! @relationship(type: "DIRECTED", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                updateMovies(where: {id: "${movieId}"}, update: { id: "${movieId}" }) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:Movie {id: "${movieId}"})
            `);

            const result = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeTruthy();
            expect((result.errors as any[])[0].message).toEqual("Movie.director required");
        } finally {
            await session.close();
        }
    });

    test("should throw error when updating a node (top level) without a (array) relationship", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Director {
                id: ID!
            }

            type Movie {
                id: ID!
                directors: [Director!] @relationship(type: "DIRECTED", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                updateMovies(where: {id: "${movieId}"}, update: { id: "${movieId}" }) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:Movie {id: "${movieId}"})
            `);

            const result = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeTruthy();
            expect((result.errors as any[])[0].message).toEqual("Movie.directors required");
        } finally {
            await session.close();
        }
    });

    test("should throw error when updating a node (field level) without a (single) relationship", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Director {
                id: ID!
                directed: [Movie!] @relationship(type: "DIRECTED", direction: OUT)
            }

            type Movie {
                id: ID!
                director: Director! @relationship(type: "DIRECTED", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const directorId = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                updateDirectors(
                    where: { id: "${directorId}" }, 
                    update: { 
                        directed: {
                            update: { ## <---------------------------------------- 👀 The test is making sure the validation gets called here
                                node: {
                                    director: {
                                        disconnect: {
                                            where: {
                                                node: {
                                                    id: "${directorId}"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:Director {id: "${directorId}"})-[:DIRECTED]->(:Movie {id: "${movieId}"})
            `);

            const result = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeTruthy();
            expect((result.errors as any[])[0].message).toEqual("Movie.director required");
        } finally {
            await session.close();
        }
    });

    test("should throw error when updating a node (field level) without a (array) relationship", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Director {
                id: ID!
                directed: [Movie!] @relationship(type: "DIRECTED", direction: OUT)
            }

            type Movie {
                id: ID!
                directors: [Director!]! @relationship(type: "DIRECTED", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const directorId = generate({
            charset: "alphabetic",
        });

        const mutation = `
            mutation {
                updateDirectors(
                    where: { id: "${directorId}" }, 
                    update: { 
                        directed: {
                            update: { ## <---------------------------------------- 👀 The test is making sure the validation gets called here
                                node: {
                                    directors: {
                                        disconnect: {
                                            where: {
                                                node: {
                                                    id: "${directorId}"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:Director {id: "${directorId}"})-[:DIRECTED]->(:Movie {id: "${movieId}"})
            `);

            const result = await graphql({
                schema: neoSchema.schema,
                source: mutation,
                contextValue: { driver },
            });

            expect(result.errors).toBeTruthy();
            expect((result.errors as any[])[0].message).toEqual("Movie.directors required");
        } finally {
            await session.close();
        }
    });
});
