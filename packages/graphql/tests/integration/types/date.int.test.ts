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

import type { Driver } from "neo4j-driver";
import neo4jDriver from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";

describe("Date", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("create", () => {
        test("should create a movie (with a Date)", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Movie {
                  id: ID
                  date: Date
                }
            `;

            const date = new Date();

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    createMovies(input: [{ id: "${id}", date: "${date.toISOString()}" }]) {
                        movies {
                            date
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
                    RETURN m {.id, .date} as m
                `);

                const movie: {
                    id: string;
                    date: typeof neo4jDriver.types.Date;
                } = (result.records[0]?.toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(movie.date.toString()).toEqual(date.toISOString().split("T")[0]);
            } finally {
                await session.close();
            }
        });

        test("should create a movie (with many Dates)", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Movie {
                  id: ID
                  dates: [Date]
                }
            `;

            const date = new Date();

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            // Try different formats on the input - both ISO strings and yyyy-mm-dd string
            const create = `
                mutation {
                    createMovies(input: [{ id: "${id}", dates: ["${
                date.toISOString().split("T")[0]
            }", "${date.toISOString()}", "${date.toISOString()}"] }]) {
                        movies {
                            dates
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
                    RETURN m {.id, .dates} as m
                `);

                const movie: {
                    id: string;
                    dates: (typeof neo4jDriver.types.Date)[];
                } = (result.records[0]?.toObject() as any).m;

                expect(movie.id).toEqual(id);

                movie.dates.forEach((dt) => {
                    expect(dt.toString()).toEqual(date.toISOString().split("T")[0]);
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("find", () => {
        test("should find a movie (with a Date)", async () => {
            const session = await neo4j.getSession();

            const randomType = new UniqueType("Movie");

            const typeDefs = `
                type ${randomType.name} {
                    date: Date
                }
            `;

            const date = new Date();

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const query = `
                query {
                    ${randomType.plural}(where: { date: "${date.toISOString()}" }) {
                        date
                    }
                }
            `;

            const nDate = neo4jDriver.types.Date.fromStandardDate(date);

            try {
                await session.run(
                    `
                   CREATE (m:${randomType.name})
                   SET m.date = $nDate
               `,
                    { nDate }
                );

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues(),
                });

                expect(gqlResult.errors).toBeFalsy();
                expect((gqlResult.data as any)[randomType.plural][0]).toEqual({
                    date: date.toISOString().split("T")[0],
                });
            } finally {
                await session.close();
            }
        });
    });

    describe("update", () => {
        test("should update a movie (with a Date)", async () => {
            const session = await neo4j.getSession();

            const typeDefs = `
                type Movie {
                  id: ID
                  date: Date
                }
            `;

            const date = new Date();

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
            });

            const id = generate({
                charset: "alphabetic",
            });

            const create = `
                mutation {
                    updateMovies(where: {id: "${id}"}, update: {date: "${date.toISOString()}"}) {
                        movies {
                            id
                            date
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
                    RETURN m {.id, .date} as m
                `);

                const movie: {
                    id: string;
                    date: typeof neo4jDriver.types.Date;
                } = (result.records[0]?.toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(movie.date.toString()).toEqual(date.toISOString().split("T")[0]);
            } finally {
                await session.close();
            }
        });
    });
});
