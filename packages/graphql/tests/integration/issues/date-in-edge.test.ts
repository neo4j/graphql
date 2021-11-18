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

describe("587: Dates in edges can cause wrongly generated cypher", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not throw when returning a date in an edge", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Genre {
                id: ID!
                movies: [Movie!]! @relationship(type: "MOVIE", direction: OUT)
            }

            type Movie {
                title: String!
                actors: [Actor]! @relationship(type: "ACTOR", direction: OUT)
            }

            type Actor {
                name: String!
                birthday: DateTime!
                movie: Movie @relationship(type: "ACTOR", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const genreId = generate({
            charset: "alphabetic",
        });

        const title = generate({
            charset: "alphabetic",
        });

        const name = generate({
            charset: "alphabetic",
        });

        const query = `
        query {
            genres(where: { id: "${genreId}" }) {
                movies {
                    actorsConnection {
                        edges {
                            node {
                                birthday
                            }
                        }
                    }
                }
            }
        }
        `;

        try {
            await session.run(`
                CREATE (genre:Genre { id: "${genreId}" })
                CREATE (movie:Movie { title: "${title}" })
                CREATE (actor:Actor { name: "${name}", birthday: datetime("2021-11-16T10:53:20.200000000Z")})
                CREATE (genre)-[:MOVIE]->(movie)-[:ACTOR { role: "Name" }]->(actor)
                RETURN actor
            `);

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

            expect(result.errors).toBeFalsy();
        } finally {
            await session.close();
        }
    });
});
