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
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("enums", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a movie (with a custom enum)", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            enum Status {
                ACTIVE
            }

            type Movie {
              id: ID
              status: Status
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{id: "${id}", status: ACTIVE}]) {
                    movies {
                        id
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .status} as m
            `);

            expect((result.records[0]?.toObject() as any).m).toEqual({ id, status: "ACTIVE" });
        } finally {
            await session.close();
        }
    });

    test("should create a movie (with a default enum)", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            enum Status {
                ACTIVE
                INACTIVE
                EATING
            }

            type Movie {
              id: ID
              status: Status @default(value: ACTIVE)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{id: "${id}"}]) {
                    movies {
                        id
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .status} as m
            `);

            expect((result.records[0]?.toObject() as any).m).toEqual({ id, status: "ACTIVE" });
        } finally {
            await session.close();
        }
    });

    test("should create a movie (with custom enum and resolver)", async () => {
        const session = await neo4j.getSession();

        const statusResolver = {
            ACTIVE: "active",
        };

        const typeDefs = `
            enum Status {
                ACTIVE
            }

            type Movie {
              id: ID
              status: Status
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers: { Status: statusResolver } });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{id: "${id}", status: ACTIVE}]) {
                    movies {
                        id
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .status} as m
            `);

            expect((result.records[0]?.toObject() as any).m).toEqual({ id, status: "active" });
        } finally {
            await session.close();
        }
    });

    test("should create a movie (with a default enum and custom resolver)", async () => {
        const session = await neo4j.getSession();

        const statusResolver = {
            ACTIVE: "active",
        };

        const typeDefs = `
            enum Status {
                ACTIVE
                INACTIVE
                EATING
            }

            type Movie {
              id: ID
              status: Status @default(value: ACTIVE)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers: { Status: statusResolver } });

        const id = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation {
                createMovies(input:[{id: "${id}"}]) {
                    movies {
                        id
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeFalsy();

            const result = await session.run(`
                MATCH (m:Movie {id: "${id}"})
                RETURN m {.id, .status} as m
            `);

            expect((result.records[0]?.toObject() as any).m).toEqual({ id, status: "active" });
        } finally {
            await session.close();
        }
    });
});
