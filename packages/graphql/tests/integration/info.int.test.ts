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
import { generate } from "randomstring";
import neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";

describe("info", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return info from a create mutation", async () => {
        const session = driver.session();

        const typeDefs = `
            type Actor {
                name: String!
            }

            type Movie {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const title = generate({
            charset: "alphabetic",
        });
        const name = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation($title: String!, $name: String!) {
                createMovies(input: [{ title: $title, actors: { create: [{ node: { name: $name } }] } }]) {
                    info {
                        bookmark
                        nodesCreated
                        relationshipsCreated
                    }
                    movies {
                        title
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { title, name },
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(typeof gqlResult?.data?.createMovies.info.bookmark).toBe("string");
            expect(gqlResult?.data?.createMovies.info.nodesCreated).toBe(2);
            expect(gqlResult?.data?.createMovies.info.relationshipsCreated).toBe(1);
            expect(gqlResult?.data?.createMovies.movies).toEqual([{ title, actors: [{ name }] }]);
        } finally {
            await session.close();
        }
    });

    test("should return info from a delete mutation", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation($id: ID!) {
                deleteMovies(where: { id: $id }) {
                    bookmark
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(typeof gqlResult?.data?.deleteMovies.bookmark).toBe("string");
        } finally {
            await session.close();
        }
    });

    test("should return info from an update mutation", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation($id: ID!) {
                updateMovies(where: { id: $id }) {
                    info {
                        bookmark
                    }
                    movies {
                        id
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: { id },
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(typeof gqlResult?.data?.updateMovies.info.bookmark).toBe("string");
        } finally {
            await session.close();
        }
    });
});
