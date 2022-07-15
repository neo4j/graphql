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
import Neo4j from "./neo4j";
import { Neo4jGraphQL } from "../../src/classes";
import { generateUniqueType } from "../utils/graphql-types";

describe("Optional features", () => {
    const movie = generateUniqueType("Movie");

    const typeDefs = gql`
        type ${movie.name} {
            title: String!
        }
    `;

    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const session = await neo4j.getSession();
        await session
            .run(
                `CREATE (:${movie.name} { title: "The Matrix" })
                CREATE (:${movie.name} { title: "The Matrix Reloaded" })
                CREATE (:${movie.name} { title: "The Matrix Revolutions" })`
            )
            .catch((err) => {
                console.error(err);
                throw new Error("Error while adding Matrix movies");
            });
    });

    afterAll(async () => {
        await driver.close();
    });

    test.each(["LT", "LTE", "GT", "GTE"])(
        "string comparator %s should not be present in the schema if not explicitly configured",
        async (comparator) => {
            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = `
            query {
                ${movie.plural}(where: {
                    title_${comparator}: "The Matrix"
                  }) {
                    title
                }
              }
            `;

            const session = driver.session();

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeDefined();
            const expectedError = expect.stringContaining(
                `"title_${comparator}" is not defined by type "${movie.name}Where".`
            );
            expect(gqlResult.errors?.map((err) => err.message)).toEqual(expect.arrayContaining([expectedError]));
        }
    );

    test.each([
        { comparator: "LT", expectedResult: [{ "title": "The Matrix" }] },
        { comparator: "LTE", expectedResult: [{ "title": "The Matrix" }, { "title": "The Matrix Reloaded" }] },
        { comparator: "GTE", expectedResult: [{ "title": "The Matrix Reloaded" }, { "title": "The Matrix Revolutions" }] },
        { comparator: "GT", expectedResult: [{ "title": "The Matrix Revolutions" }] },
    ])(
        "string comparator $comparator should works if explictly defined",
        async ({ comparator, expectedResult }) => {
            const neoSchema = new Neo4jGraphQL({
                config: {
                    features: {
                        filters: {
                            String: {
                                LT: true,
                                GT: true,
                                LTE: true,
                                GTE: true,
                            },
                        },
                    },
                },
                typeDefs,
            });

            const query = `
            query {
                ${movie.plural}(where: {
                    title_${comparator}: "The Matrix Reloaded"
                  }) {
                    title
                }
              }
            `;

            const session = driver.session();

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
            });

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data?.[movie.plural]).toEqual(expect.arrayContaining(expectedResult));
        }
    );
});
