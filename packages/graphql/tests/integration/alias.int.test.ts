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

const testLabel = generate({ charset: "alphabetic" });

describe("Alias", () => {
    let driver: Driver;
    let bookmarks: string[];

    const typeDefs = `
        type Movie {
          id: ID!
          budget: Int!
          boxOffice: Float!
        }
    `;

    const { schema } = new Neo4jGraphQL({ typeDefs });

    const id = generate({ readable: false });
    const budget = 63;
    const boxOffice = 465.3;

    beforeAll(async () => {
        driver = await neo4j();
        const session = driver.session();
        try {
            await session.run(
                `
                    CREATE (movie:Movie)
                    SET movie:${testLabel}
                    SET movie += $properties
                `,
                {
                    properties: {
                        id,
                        boxOffice,
                        budget,
                    },
                }
            );
            bookmarks = session.lastBookmark();
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = driver.session();
        try {
            await session.run(
                `
                  MATCH(node:${testLabel})
                  DETACH DELETE node
              `
            );
        } finally {
            await session.close();
            await driver.close();
        }
    });

    test("should correctly alias an ID field", async () => {
        const query = `
            query ($id: ID!) {
                movies(where: { id: $id }) {
                    aliased: id
                    budget
                    boxOffice
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks } },
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data?.movies[0]).toEqual({
            aliased: id,
            budget,
            boxOffice,
        });
    });

    test("should correctly alias an Int field", async () => {
        const query = `
            query ($id: ID!) {
                movies(where: { id: $id }) {
                    id
                    aliased: budget
                    boxOffice
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks } },
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data?.movies[0]).toEqual({
            id,
            aliased: budget,
            boxOffice,
        });
    });

    test("should correctly alias an Float field", async () => {
        const query = `
            query ($id: ID!) {
                movies(where: { id: $id }) {
                    id
                    budget
                    aliased: boxOffice
                }
            }
        `;

        const gqlResult = await graphql({
            schema,
            source: query,
            contextValue: { driver, driverConfig: { bookmarks } },
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult?.data?.movies[0]).toEqual({
            id,
            budget,
            aliased: boxOffice,
        });
    });
});
