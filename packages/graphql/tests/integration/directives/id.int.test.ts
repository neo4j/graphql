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

import { graphql } from "graphql";
import isUUID from "is-uuid";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import Neo4jHelper from "../neo4j";

describe("@id directive", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a movie with autogenerate id", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Movie {
              id: ID! @id @unique
              name: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const create = `
            mutation {
                createMovies(input:[{name: "dan"}]) {
                    movies {
                        id
                        name
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

            const { id, name } = (gqlResult.data as any).createMovies.movies[0];

            expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](id))).toBe(true);
            expect(name).toBe("dan");
        } finally {
            await session.close();
        }
    });

    test("should create a movie with autogenerate id when field inherited from interface", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            interface MovieInterface {
                id: ID!
            }

            type Movie implements MovieInterface {
              id: ID! @id
              name: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const create = `
            mutation {
                createMovies(input:[{name: "dan"}]) {
                    movies {
                        id
                        name
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

            const { id, name } = (gqlResult.data as any).createMovies.movies[0];

            expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](id))).toBe(true);
            expect(name).toBe("dan");
        } finally {
            await session.close();
        }
    });

    test("should create a movie with autogenerate id and a nested genre with autogenerate id", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Genre {
                id: ID! @id @unique
                name: String!
            }

            type Movie {
                id: ID! @id @unique
                name: String!
                genres: [Genre!]! @relationship(type: "HAS_GENRE", direction: OUT)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const create = `
            mutation {
                createMovies(input:
                    [
                        {
                            name: "dan",
                            genres: {
                                create: [{node: {name: "Comedy"}}]
                            }
                        }
                    ]
                ) {
                    movies {
                        id
                        name
                        genres {
                            id
                        }
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

            const { id, name, genres } = (gqlResult.data as any).createMovies.movies[0];

            expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](id))).toBe(true);
            expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](genres[0].id))).toBe(true);
            expect(name).toBe("dan");
        } finally {
            await session.close();
        }
    });

    test("should autogenerate an ID for a relationship property", async () => {
        const session = await neo4j.getSession();

        const typeDefs = `
            type Actor {
                id: ID! @id @unique
                name: String!
            }

            type ActedIn @relationshipProperties {
                id: ID! @id
                screenTime: Int!
            }

            type Movie {
                id: ID! @id @unique
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const title = generate({
            charset: "alphabetic",
        });
        const name = generate({
            charset: "alphabetic",
        });

        const create = /* GraphQL */ `
            mutation ($title: String!, $name: String!) {
                createMovies(
                    input: [
                        { title: $title, actors: { create: [{ node: { name: $name }, edge: { screenTime: 60 } }] } }
                    ]
                ) {
                    movies {
                        actorsConnection {
                            edges {
                                properties {
                                    id
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: create,
                contextValue: neo4j.getContextValues(),
                variableValues: { title, name },
            });

            expect(result.errors).toBeFalsy();

            const { actorsConnection } = (result.data as any).createMovies.movies[0];

            expect(["v1", "v2", "v3", "v4", "v5"].some((t) => isUUID[t](actorsConnection.edges[0].properties.id))).toBe(
                true
            );
        } finally {
            await session.close();
        }
    });
});
