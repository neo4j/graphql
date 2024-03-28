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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/3251", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Genre: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Genre = testHelper.createUniqueType("Genre");

        const typeDefs = `#graphql
            type ${Movie} {
                name: String!
                genre: ${Genre}! @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type ${Genre} {
                name: String! @unique
                movies: [${Movie}!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        await testHelper.executeCypher(`
            CREATE (a:${Genre} { name: "Action" })
            CREATE (:${Genre} { name: "Thriller" })
            CREATE (:${Movie} { name: "TestMovie1" })-[:HAS_GENRE]->(a)
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Mutation which would violate 1:1 should throw error", async () => {
        const mutation = `#graphql
            mutation UpdateMovieWithConnectAndUpdate {
                ${Movie.operations.update}(
                    where: { name: "TestMovie1" }
                    update: { name: "TestMovie1" }
                    connect: { genre: { where: { node: { name: "Thriller" } } } }
                ) {
                    ${Movie.plural} {
                        name
                        genre {
                            name
                        }
                    }
                }
            }
        `;

        const mutationResult = await testHelper.executeGraphQL(mutation);

        expect(mutationResult.errors).toHaveLength(1);
        expect((mutationResult.errors as any)[0]?.message).toBe(`${Movie}.genre required exactly once`);
    });
});
