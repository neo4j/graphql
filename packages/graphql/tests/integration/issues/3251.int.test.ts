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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodesUsingSession } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/3251", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Movie: UniqueType;
    let Genre: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Movie = new UniqueType("Movie");
        Genre = new UniqueType("Genre");

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

        await session.run(`
            CREATE (a:${Genre} { name: "Action" })
            CREATE (:${Genre} { name: "Thriller" })
            CREATE (:${Movie} { name: "TestMovie1" })-[:HAS_GENRE]->(a)
        `);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodesUsingSession(session, [Movie, Genre]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
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

        const schema = await neoSchema.getSchema();

        const mutationResult = await graphql({
            schema,
            source: mutation,
            contextValue: neo4j.getContextValues(),
        });

        expect(mutationResult.errors).toHaveLength(1);
        expect((mutationResult.errors as any)[0]?.message).toBe(`${Movie}.genre required exactly once`);
    });
});
