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
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";
import Neo4jHelper from "../../neo4j";

describe("aggregations-top_level-float", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let Movie: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Movie = new UniqueType("Movie");
        const typeDefs = `
            type ${Movie} {
                testString: String
                imdbRating: Float
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return the min of node properties", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Movie} {testString: $testString, imdbRating: 1.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 2.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 3.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 4.1})
                `,
                {
                    testString,
                }
            );

            const query = `
                {
                    ${Movie.operations.aggregate}(where: {testString: "${testString}"}) {
                        imdbRating {
                            min
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Movie.operations.aggregate]).toEqual({
                imdbRating: {
                    min: expect.closeTo(1.1),
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the max of node properties", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Movie} {testString: $testString, imdbRating: 1.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 2.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 3.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 4.1})
                `,
                {
                    testString,
                }
            );

            const query = `
                {
                    ${Movie.operations.aggregate}(where: {testString: "${testString}"}) {
                        imdbRating {
                            max
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Movie.operations.aggregate]).toEqual({
                imdbRating: {
                    max: expect.closeTo(4.1),
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the average of node properties", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Movie} {testString: $testString, imdbRating: 1.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 2.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 3.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 4.1})
                `,
                {
                    testString,
                }
            );

            const query = `
                {
                    ${Movie.operations.aggregate}(where: {testString: "${testString}"}) {
                        imdbRating {
                            average
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Movie.operations.aggregate]).toEqual({
                imdbRating: {
                    average: expect.closeTo(2.6),
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the sum of node properties", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Movie} {testString: $testString, imdbRating: 1.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 2.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 3.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 4.1})
                `,
                {
                    testString,
                }
            );

            const query = `
                {
                ${Movie.operations.aggregate}(where: {testString: "${testString}"}) {
                        imdbRating {
                            sum
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Movie.operations.aggregate]).toEqual({
                imdbRating: {
                    sum: expect.closeTo(10.4),
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the min, max, sum and average of node properties", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Movie} {testString: $testString, imdbRating: 1.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 2.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 3.1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 4.1})
                `,
                {
                    testString,
                }
            );

            const query = `
                {
                    ${Movie.operations.aggregate}(where: {testString: "${testString}"}) {
                        imdbRating {
                            min
                            max
                            average
                            sum
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Movie.operations.aggregate]).toEqual({
                imdbRating: {
                    min: expect.closeTo(1.1),
                    max: expect.closeTo(4.1),
                    average: expect.closeTo(2.6),
                    sum: expect.closeTo(10.4),
                },
            });
        } finally {
            await session.close();
        }
    });
});
