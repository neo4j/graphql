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
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("Enum Relationship Properties", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create a movie and an actor, with an enum as a relationship property", async () => {
        const session = driver.session();

        const roleTypeResolver = {
            LEADING: "Leading",
            SUPPORTING: "Supporting",
        };

        const typeDefs = `
            type Actor {
                name: String!
                movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type Movie {
                title: String!
                actors: [Actor]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            enum RoleType {
                LEADING
                SUPPORTING
            }

            interface ActedIn {
                roleType: RoleType!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            resolvers: { RoleType: roleTypeResolver },
        });

        const title = generate({
            charset: "alphabetic",
        });

        const name = generate({
            charset: "alphabetic",
        });

        const create = `
            mutation CreateMovies($title: String!, $name: String!) {
                createMovies(
                    input: [
                        {
                            title: $title
                            actors: {
                                create: [
                                    {
                                        edge: { roleType: LEADING }
                                        node: { name: $name }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    movies {
                        title
                        actorsConnection {
                            edges {
                                roleType
                                node {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: create,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                variableValues: { title, name },
            });

            expect(gqlResult.errors).toBeFalsy();

            expect(gqlResult.data).toEqual({
                createMovies: {
                    movies: [{ title, actorsConnection: { edges: [{ roleType: "LEADING", node: { name } }] } }],
                },
            });

            const result = await session.run(`
                MATCH (m:Movie)<-[ai:ACTED_IN]-(a:Actor)
                WHERE m.title = "${title}" AND a.name = "${name}"
                RETURN ai
            `);

            expect((result.records[0].toObject() as any).ai.properties).toEqual({ roleType: "Leading" });
        } finally {
            await session.close();
        }
    });
});
