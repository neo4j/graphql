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

describe("aggregations-top_level-bigint", () => {
    let driver: Driver;

    const bigInt = "2147483647";

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
                imdbRatingBigInt: BigInt
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.1})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.2})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.3})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.4})
                `,
                {
                    testString,
                }
            );

            const query = `
                {
                    moviesAggregate(where: {testString: "${testString}"}) {
                        imdbRatingBigInt {
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
                imdbRatingBigInt: {
                    min: `${bigInt}.1`,
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
                imdbRatingBigInt: BigInt
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.1})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.2})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.3})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.4})
                `,
                {
                    testString,
                }
            );

            const query = `
                {
                    moviesAggregate(where: {testString: "${testString}"}) {
                        imdbRatingBigInt {
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
                imdbRatingBigInt: {
                    max: `${bigInt}.4`,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the average of node properties", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                testString: String
                imdbRatingBigInt: BigInt
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.1})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.2})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.3})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.4})
                `,
                {
                    testString,
                }
            );

            const query = `
                {
                    moviesAggregate(where: {testString: "${testString}"}) {
                        imdbRatingBigInt {
                            average
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
                imdbRatingBigInt: {
                    average: `${bigInt}.25`,
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the sum of node properties", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                testString: String
                imdbRatingBigInt: BigInt
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.1})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.2})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.3})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.4})
                `,
                {
                    testString,
                }
            );

            const query = `
                {
                    moviesAggregate(where: {testString: "${testString}"}) {
                        imdbRatingBigInt {
                            sum
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
                imdbRatingBigInt: {
                    sum: "8589934589",
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the min, max, sum and average of node properties", async () => {
        const session = driver.session();

        const typeDefs = `
            type Movie {
                testString: String
                imdbRatingBigInt: BigInt
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.1})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.2})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.3})
                    CREATE (:Movie {testString: $testString, imdbRatingBigInt: ${bigInt}.4})
                `,
                {
                    testString,
                }
            );

            const query = `
                {
                    moviesAggregate(where: {testString: "${testString}"}) {
                        imdbRatingBigInt {
                            min
                            max
                            average
                            sum
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
                imdbRatingBigInt: {
                    min: `${bigInt}.1`,
                    max: `${bigInt}.4`,
                    average: `${bigInt}.25`,
                    sum: "8589934589",
                },
            });
        } finally {
            await session.close();
        }
    });
});
