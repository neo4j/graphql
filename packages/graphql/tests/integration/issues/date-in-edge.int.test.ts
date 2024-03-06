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
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("587: Dates in edges can cause wrongly generated cypher", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let typeDefs: string;
    let Genre: UniqueType;
    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Genre = new UniqueType("Genre");
        Movie = new UniqueType("Movie");
        Actor = new UniqueType("Actor");
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not throw when returning a date in an edge", async () => {
        const session = await neo4j.getSession();

        typeDefs = `
            type ${Genre} {
                id: ID!
                movies: [${Movie}!]! @relationship(type: "MOVIE", direction: OUT)
            }

            type ${Movie} {
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTOR", direction: OUT)
            }

            type ${Actor} {
                name: String!
                birthday: DateTime!
                movie: ${Movie}! @relationship(type: "ACTOR", direction: IN)
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
            ${Genre.plural}(where: { id: "${genreId}" }) {
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
                CREATE (genre:${Genre} { id: "${genreId}" })
                CREATE (movie:${Movie} { title: "${title}" })
                CREATE (actor:${Actor} { name: "${name}", birthday: datetime("2021-11-16T10:53:20.200000000Z")})
                CREATE (genre)-[:${Movie}]->(movie)-[:${Actor} { role: "Name" }]->(actor)
                RETURN actor
            `);

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            expect(result.errors).toBeFalsy();
        } finally {
            await session.close();
        }
    });
});
