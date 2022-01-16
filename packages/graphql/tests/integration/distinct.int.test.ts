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

import { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { gql } from "apollo-server";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("distinct", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("primitive fields", () => {
        test("should get distinct values for a list of nodes", async () => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID
                            number: Int
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieIds = [
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                    ].map((x) => `"${x}"`);

                    const query = `
                        query {
                            movies(
                                where: { id_IN: [${movieIds.join(",")}] },
                                options: { distinct: true }
                            ) {
                               number
                            }
                        }
                    `;

                    try {
                        await session.run(`
                            CREATE (:Movie {id: ${movieIds[0]}, number: 1})
                            CREATE (:Movie {id: ${movieIds[1]}, number: 1})
                            CREATE (:Movie {id: ${movieIds[2]}, number: 2})
                        `);

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        const { movies } = gqlResult.data as any;

                        /* eslint-disable jest/no-conditional-expect */
                        
                        expect(movies).toHaveLength(2);
                        expect(movies[0].number).not.toEqual(movies[1].number);
                        
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
        });

        test("should get distinct values in nested relationships", async () => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID
                            genres: [Genre] @relationship(type: "HAS_GENRE", direction: OUT)
                        }

                        type Genre {
                            id: ID
                            number: Int
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = generate({
                        charset: "alphabetic",
                    });

                    const query = `
                        query {
                            movies(where: { id: "${movieId}" }) {
                                genres(options: { distinct: true }) {
                                    number
                                }
                            }
                        }
                    `;

                    try {
                        await session.run(`
                            CREATE (m:Movie {id: "${movieId}"})
                            CREATE (g1:Genre {id: "1", number: 1})
                            CREATE (g2:Genre {id: "2", number: 1})
                            CREATE (g3:Genre {id: "3", number: 2})
                            MERGE (m)-[:HAS_GENRE]->(g1)
                            MERGE (m)-[:HAS_GENRE]->(g2)
                            MERGE (m)-[:HAS_GENRE]->(g3)
                        `);

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        const { genres } = (gqlResult.data as any).movies[0];

                        /* eslint-disable jest/no-conditional-expect */
                        expect(genres).toHaveLength(2);
                        expect(genres[0].number).not.toEqual(genres[1].number);
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
        });
        
        test("should get the right distinct values after sorting a list of nodes", async () => {
            await Promise.all(
                ["ASC", "DESC"].map(async (type) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID
                            number: Int
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieIds = [
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                    ].map((x) => `"${x}"`);

                    const query = `
                        query {
                            movies(
                                where: { id_IN: [${movieIds.join(",")}] },
                                options: { distinct: true, sort: [{ number: ${type} }] }
                            ) {
                               number
                            }
                        }
                    `;

                    try {
                        await session.run(`
                            CREATE (:Movie {id: ${movieIds[0]}, number: 1})
                            CREATE (:Movie {id: ${movieIds[1]}, number: 2})
                            CREATE (:Movie {id: ${movieIds[2]}, number: 2})
                            CREATE (:Movie {id: ${movieIds[3]}, number: 3})
                            CREATE (:Movie {id: ${movieIds[4]}, number: 3})
                        `);

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        const { movies } = gqlResult.data as any;

                        /* eslint-disable jest/no-conditional-expect */
                        expect(movies).toHaveLength(3);

                        if (type === "ASC") {
                            expect(movies[0].number).toBe(1);
                            expect(movies[1].number).toBe(2);
                            expect(movies[2].number).toBe(3);
                        }

                        if (type === "DESC") {
                            expect(movies[0].number).toBe(3);
                            expect(movies[1].number).toBe(2);
                            expect(movies[2].number).toBe(1);
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should get the right distinct values after sorting nested relationships", async () => {
            await Promise.all(
                ["ASC", "DESC"].map(async (type) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID
                            genres: [Genre] @relationship(type: "HAS_GENRE", direction: OUT)
                        }

                        type Genre {
                            id: ID
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = generate({
                        charset: "alphabetic",
                    });

                    const query = `
                        query {
                            movies(where: { id: "${movieId}" }) {
                                genres(options: { distinct: true, sort: [{ id: ${type} }] }) {
                                    id
                                }
                            }
                        }
                    `;

                    try {
                        await session.run(`
                            CREATE (m:Movie {id: "${movieId}"})
                            CREATE (g1:Genre {id: "1"})
                            CREATE (g2:Genre {id: "2"})
                            CREATE (g3:Genre {id: "2"})
                            CREATE (g4:Genre {id: "3"})
                            MERGE (m)-[:HAS_GENRE]->(g1)
                            MERGE (m)-[:HAS_GENRE]->(g2)
                            MERGE (m)-[:HAS_GENRE]->(g3)
                            MERGE (m)-[:HAS_GENRE]->(g4)
                        `);

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        const { genres } = (gqlResult.data as any).movies[0];

                        /* eslint-disable jest/no-conditional-expect */
                        expect(genres).toHaveLength(3);
                        if (type === "ASC") {
                            expect(genres[0].id).toBe("1");
                            expect(genres[1].id).toBe("2");
                            expect(genres[2].id).toBe("3");
                        }

                        if (type === "DESC") {
                            expect(genres[0].id).toBe("3");
                            expect(genres[1].id).toBe("2");
                            expect(genres[2].id).toBe("1");
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            );
        });
        
        test("should get the right distinct values after sorting a list of nodes with offset", async () => {
            await Promise.all(
                ["ASC", "DESC"].map(async (type) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID
                            number: Int
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieIds = [
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                        generate({
                            charset: "alphabetic",
                        }),
                    ].map((x) => `"${x}"`);

                    const query = `
                        query {
                            movies(
                                where: { id_IN: [${movieIds.join(",")}] },
                                options: { limit: 2, distinct: true, sort: [{ number: ${type} }] }
                            ) {
                               number
                            }
                        }
                    `;

                    try {
                        await session.run(`
                            CREATE (:Movie {id: ${movieIds[0]}, number: 1})
                            CREATE (:Movie {id: ${movieIds[1]}, number: 2})
                            CREATE (:Movie {id: ${movieIds[2]}, number: 2})
                            CREATE (:Movie {id: ${movieIds[3]}, number: 3})
                            CREATE (:Movie {id: ${movieIds[4]}, number: 3})
                        `);

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        const { movies } = gqlResult.data as any;

                        /* eslint-disable jest/no-conditional-expect */
                        expect(movies).toHaveLength(2);

                        if (type === "ASC") {
                            expect(movies[0].number).toBe(1);
                            expect(movies[1].number).toBe(2);
                        }

                        if (type === "DESC") {
                            expect(movies[0].number).toBe(3);
                            expect(movies[1].number).toBe(2);
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            );
        });

        test("should get the right distinct values after sorting nested relationships with offset", async () => {
            await Promise.all(
                ["ASC", "DESC"].map(async (type) => {
                    const session = driver.session();

                    const typeDefs = `
                        type Movie {
                            id: ID
                            genres: [Genre] @relationship(type: "HAS_GENRE", direction: OUT)
                        }

                        type Genre {
                            id: ID
                        }
                    `;

                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const movieId = generate({
                        charset: "alphabetic",
                    });

                    const query = `
                        query {
                            movies(where: { id: "${movieId}" }) {
                                genres(options: { limit: 2, distinct: true, sort: [{ id: ${type} }] }) {
                                    id
                                }
                            }
                        }
                    `;

                    try {
                        await session.run(`
                            CREATE (m:Movie {id: "${movieId}"})
                            CREATE (g1:Genre {id: "1"})
                            CREATE (g2:Genre {id: "2"})
                            CREATE (g3:Genre {id: "2"})
                            CREATE (g4:Genre {id: "3"})
                            MERGE (m)-[:HAS_GENRE]->(g1)
                            MERGE (m)-[:HAS_GENRE]->(g2)
                            MERGE (m)-[:HAS_GENRE]->(g3)
                            MERGE (m)-[:HAS_GENRE]->(g4)
                        `);

                        const gqlResult = await graphql({
                            schema: neoSchema.schema,
                            source: query,
                            contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
                        });

                        expect(gqlResult.errors).toBeUndefined();

                        const { genres } = (gqlResult.data as any).movies[0];

                        /* eslint-disable jest/no-conditional-expect */
                        expect(genres).toHaveLength(2);
                        if (type === "ASC") {
                            expect(genres[0].id).toBe("1");
                            expect(genres[1].id).toBe("2");
                        }

                        if (type === "DESC") {
                            expect(genres[0].id).toBe("3");
                            expect(genres[1].id).toBe("2");
                        }
                        /* eslint-enable jest/no-conditional-expect */
                    } finally {
                        await session.close();
                    }
                })
            );
        });
    });
});
