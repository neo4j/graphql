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

import neo4jDriver, { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";

describe("aggregations-top_level-duration", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return the min of node properties", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                testString: String
                runningTime: Duration
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const months = 1;
        const days = 1;
        const minDuration = new neo4jDriver.types.Duration(months, days, 0, 0);
        const maxDuration = new neo4jDriver.types.Duration(months + 1, days, 0, 0);

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Movie {testString: $testString, runningTime: $minDuration})
                    CREATE (:Movie {testString: $testString, runningTime: $maxDuration})
                `,
                {
                    testString,
                    minDuration,
                    maxDuration,
                }
            );

            const query = `
                {
                    moviesAggregate(where: {testString: "${testString}"}) {
                        runningTime {
                            min
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
                runningTime: {
                    min: minDuration.toString(),
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the max of node properties", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                testString: String
                runningTime: Duration
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const months = 1;
        const days = 1;
        const minDuration = new neo4jDriver.types.Duration(months, days, 0, 0);
        const maxDuration = new neo4jDriver.types.Duration(months + 1, days, 0, 0);

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Movie {testString: $testString, runningTime: $minDuration})
                    CREATE (:Movie {testString: $testString, runningTime: $maxDuration})
                `,
                {
                    testString,
                    minDuration,
                    maxDuration,
                }
            );

            const query = `
                {
                    moviesAggregate(where: {testString: "${testString}"}) {
                        runningTime {
                            max
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
                runningTime: {
                    max: maxDuration.toString(),
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the min and max of node properties", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                testString: String
                runningTime: Duration
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const months = 1;
        const days = 1;
        const minDuration = new neo4jDriver.types.Duration(months, days, 0, 0);
        const maxDuration = new neo4jDriver.types.Duration(months + 1, days, 0, 0);

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Movie {testString: $testString, runningTime: $minDuration})
                    CREATE (:Movie {testString: $testString, runningTime: $maxDuration})
                `,
                {
                    testString,
                    minDuration,
                    maxDuration,
                }
            );

            const query = `
                {
                    moviesAggregate(where: {testString: "${testString}"}) {
                        runningTime {
                            min
                            max
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
                runningTime: {
                    min: minDuration.toString(),
                    max: maxDuration.toString(),
                },
            });
        } finally {
            await session.close();
        }
    });
});
