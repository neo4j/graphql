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

describe("info", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return info from a create mutation", async () => {
        const session = await neo4j.getSession();

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
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { title, name },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(typeof (gqlResult?.data as any)?.createMovies.info.bookmark).toBe("string");
            expect((gqlResult?.data as any)?.createMovies.info.nodesCreated).toBe(2);
            expect((gqlResult?.data as any)?.createMovies.info.relationshipsCreated).toBe(1);
            expect((gqlResult?.data as any)?.createMovies.movies).toEqual([{ title, actors: [{ name }] }]);
        } finally {
            await session.close();
        }
    });

    test("should return info from a delete mutation", async () => {
        const session = await neo4j.getSession();

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
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(typeof (gqlResult?.data as any)?.deleteMovies.bookmark).toBe("string");
        } finally {
            await session.close();
        }
    });

    test("should return info from an update mutation", async () => {
        const session = await neo4j.getSession();

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
                schema: await neoSchema.getSchema(),
                source: query,
                variableValues: { id },
                contextValue: neo4j.getContextValues(),
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(typeof (gqlResult?.data as any)?.updateMovies.info.bookmark).toBe("string");
        } finally {
            await session.close();
        }
    });
});
