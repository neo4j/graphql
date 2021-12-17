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
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";

describe("aggregations-top_level-string", () => {
    let driver: Driver;

    const titles = [10, 11, 12, 13, 14].map((length) =>
        generate({
            charset: "alphabetic",
            readable: true,
            length,
        })
    );

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return the shortest of node properties", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                testId: ID
                title: String
            }
        `;

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Movie {testId: $id, title: "${titles[0]}"})
                    CREATE (:Movie {testId: $id, title: "${titles[1]}"})
                    CREATE (:Movie {testId: $id, title: "${titles[2]}"})
                    CREATE (:Movie {testId: $id, title: "${titles[3]}"})
                `,
                {
                    id,
                }
            );

            const query = `
                {
                    moviesAggregate(where: {testId: "${id}"}) {
                        title {
                            shortest
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).moviesAggregate).toEqual({
                title: {
                    shortest: titles[0],
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the longest of node properties", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                testId: ID
                title: String
            }
        `;

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                CREATE (:Movie {testId: $id, title: "${titles[0]}"})
                CREATE (:Movie {testId: $id, title: "${titles[1]}"})
                CREATE (:Movie {testId: $id, title: "${titles[2]}"})
                CREATE (:Movie {testId: $id, title: "${titles[3]}"})
            `,
                {
                    id,
                }
            );

            const query = `
                {
                    moviesAggregate(where: {testId: "${id}"}) {
                        title {
                            longest
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).moviesAggregate).toEqual({
                title: {
                    longest: titles[3],
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the shortest and longest of node properties", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                testId: ID
                title: String
            }
        `;

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Movie {testId: $id, title: "${titles[0]}"})
                    CREATE (:Movie {testId: $id, title: "${titles[1]}"})
                    CREATE (:Movie {testId: $id, title: "${titles[2]}"})
                    CREATE (:Movie {testId: $id, title: "${titles[3]}"})
                `,
                {
                    id,
                }
            );

            const query = `
                {
                    moviesAggregate(where: {testId: "${id}"}) {
                        title {
                            shortest
                            longest
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).moviesAggregate).toEqual({
                title: {
                    shortest: titles[0],
                    longest: titles[3],
                },
            });
        } finally {
            await session.close();
        }
    });
});
