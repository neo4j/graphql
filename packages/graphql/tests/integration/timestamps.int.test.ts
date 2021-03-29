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

import { Driver, DateTime } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("TimeStamps", () => {
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
                  createdAt: DateTime @autogenerate(operations: ["create"])
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
                    schema: neoSchema.schema,
                    source: create,
                    contextValue: { driver },
                });

                expect(gqlResult.errors).toBeFalsy();

                const result = await session.run(`
                    MATCH (m:Movie {id: "${id}"})
                    RETURN m {.id, .createdAt} as m
                `);

                const movie: {
                    id: string;
                    createdAt: DateTime;
                } = (result.records[0].toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.createdAt.toString())).toBeInstanceOf(Date);
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
                  updatedAt: DateTime @autogenerate(operations: ["update"])
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
                    schema: neoSchema.schema,
                    source: create,
                    contextValue: { driver },
                });

                expect(gqlResult.errors).toBeFalsy();

                const result = await session.run(`
                    MATCH (m:Movie {id: "${id}"})
                    RETURN m {.id, .updatedAt} as m
                `);

                const movie: {
                    id: string;
                    updatedAt: DateTime;
                } = (result.records[0].toObject() as any).m;

                expect(movie.id).toEqual(id);
                expect(new Date(movie.updatedAt.toString())).toBeInstanceOf(Date);
            } finally {
                await session.close();
            }
        });
    });
});
