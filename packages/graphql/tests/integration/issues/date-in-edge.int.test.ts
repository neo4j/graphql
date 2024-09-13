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

import { generate } from "randomstring";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("587: Dates in edges can cause wrongly generated cypher", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    let Genre: UniqueType;
    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeEach(() => {
        Genre = testHelper.createUniqueType("Genre");
        Movie = testHelper.createUniqueType("Movie");
        Actor = testHelper.createUniqueType("Actor");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not throw when returning a date in an edge", async () => {
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

        await testHelper.initNeo4jGraphQL({ typeDefs });

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

        await testHelper.executeCypher(`
                CREATE (genre:${Genre} { id: "${genreId}" })
                CREATE (movie:${Movie} { title: "${title}" })
                CREATE (actor:${Actor} { name: "${name}", birthday: datetime("2021-11-16T10:53:20.200000000Z")})
                CREATE (genre)-[:${Movie}]->(movie)-[:${Actor} { role: "Name" }]->(actor)
                RETURN actor
            `);

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
    });
});
