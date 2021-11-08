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

describe("https://github.com/neo4j/graphql/issues/567", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should not throw when only returning info on update", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                id: ID!
                title: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const existingTitle = generate({
            charset: "alphabetic",
        });

        const newTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                updateMovies(where: { id: "${movieId}" }, update: { title: "${newTitle}" }) {
                    info {
                        nodesCreated
                        nodesDeleted
                    }
                }
            }
        `;

        try {
            await session.run(`
                CREATE (:Movie { id: "${movieId}", title: "${existingTitle}" })
            `);

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

            if (result.errors) {
                console.log(JSON.stringify(result.errors, null, 2));
            }

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                updateMovies: {
                    info: {
                        nodesCreated: 0,
                        nodesDeleted: 0,
                    },
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should not throw when only returning info on create", async () => {
        const session = driver.session();

        const typeDefs = gql`
            type Movie {
                id: ID!
                title: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const movieId = generate({
            charset: "alphabetic",
        });

        const existingTitle = generate({
            charset: "alphabetic",
        });

        const query = `
            mutation {
                createMovies(input: [{ id: "${movieId}", title: "${existingTitle}" }]) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        try {
            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver },
            });

            if (result.errors) {
                console.log(JSON.stringify(result.errors, null, 2));
            }

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                createMovies: {
                    info: {
                        nodesCreated: 1,
                    },
                },
            });
        } finally {
            await session.close();
        }
    });
});
