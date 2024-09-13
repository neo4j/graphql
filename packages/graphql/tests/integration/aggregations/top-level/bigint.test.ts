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
import { TestHelper } from "../../../utils/tests-helper";

describe("aggregations-top_level-bigint", () => {
    const testHelper = new TestHelper();

    const bigInt = "2147483647";

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return the min of node properties", async () => {
        const movieType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${movieType.name} {
                testString: String
                imdbRatingBigInt: BigInt
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}1})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}2})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}3})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}4})
                `,
            {
                testString,
            }
        );

        const query = `
                {
                    ${movieType.operations.aggregate}(where: {testString: "${testString}"}) {
                        imdbRatingBigInt {
                            min
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[movieType.operations.aggregate]).toEqual({
            imdbRatingBigInt: {
                min: `${bigInt}1`,
            },
        });
    });

    test("should return the max of node properties", async () => {
        const movieType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${movieType.name} {
                testString: String
                imdbRatingBigInt: BigInt
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}1})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}2})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}3})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}4})
                `,
            {
                testString,
            }
        );

        const query = `
                {
                    ${movieType.operations.aggregate}(where: {testString: "${testString}"}) {
                        imdbRatingBigInt {
                            max
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[movieType.operations.aggregate]).toEqual({
            imdbRatingBigInt: {
                max: `${bigInt}4`,
            },
        });
    });

    test("should return the average of node properties", async () => {
        const movieType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${movieType.name}  {
                testString: String
                imdbRatingBigInt: BigInt
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}1})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}2})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}3})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}4})
                `,
            {
                testString,
            }
        );

        const query = `
                {
                    ${movieType.operations.aggregate}(where: {testString: "${testString}"}) {
                        imdbRatingBigInt {
                            average
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[movieType.operations.aggregate]).toEqual({
            imdbRatingBigInt: {
                average: `${bigInt}2.5`,
            },
        });
    });

    test("should return the sum of node properties", async () => {
        const movieType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${movieType.name} {
                testString: String
                imdbRatingBigInt: BigInt
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}1})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}2})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}3})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}4})
                `,
            {
                testString,
            }
        );

        const query = `
                {
                    ${movieType.operations.aggregate}(where: {testString: "${testString}"}) {
                        imdbRatingBigInt {
                            sum
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[movieType.operations.aggregate]).toEqual({
            imdbRatingBigInt: {
                sum: "85899345890",
            },
        });
    });

    test("should return the min, max, sum and average of node properties", async () => {
        const movieType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${movieType.name} {
                testString: String
                imdbRatingBigInt: BigInt
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}1})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}2})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}3})
                    CREATE (:${movieType.name} {testString: $testString, imdbRatingBigInt: ${bigInt}4})
                `,
            {
                testString,
            }
        );

        const query = `
                {
                    ${movieType.operations.aggregate}(where: {testString: "${testString}"}) {
                        imdbRatingBigInt {
                            min
                            max
                            average
                            sum
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[movieType.operations.aggregate]).toEqual({
            imdbRatingBigInt: {
                min: `${bigInt}1`,
                max: `${bigInt}4`,
                average: `${bigInt}2.5`,
                sum: "85899345890",
            },
        });
    });
});
