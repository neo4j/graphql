/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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

        const typeDefs = /* GraphQL */ `
            type ${movieType} @node {
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
                    CREATE (:${movieType} {testString: $testString, imdbRatingBigInt: ${bigInt}1})
                    CREATE (:${movieType} {testString: $testString, imdbRatingBigInt: ${bigInt}2})
                    CREATE (:${movieType} {testString: $testString, imdbRatingBigInt: ${bigInt}3})
                    CREATE (:${movieType} {testString: $testString, imdbRatingBigInt: ${bigInt}4})
                    CREATE (:${movieType} {testString: "different-string", imdbRatingBigInt: ${bigInt}5})
                `,
            {
                testString,
            }
        );

        const query = /* GraphQL */ `
            {
                ${movieType.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate {
                        node {
                            imdbRatingBigInt {
                                min
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [movieType.operations.connection]: {
                aggregate: {
                    node: {
                        imdbRatingBigInt: {
                            min: `${bigInt}1`,
                        },
                    },
                },
            },
        });
    });

    test("should return the max of node properties", async () => {
        const movieType = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${movieType.name} @node {
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
                    CREATE (:${movieType.name} {testString: "different-string", imdbRatingBigInt: ${bigInt}5})
                `,
            {
                testString,
            }
        );

        const query = /* GraphQL */ `
            {
                ${movieType.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate { 
                        node {
                            imdbRatingBigInt {
                                max
                            }
                        }
                    }    
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [movieType.operations.connection]: {
                aggregate: {
                    node: {
                        imdbRatingBigInt: {
                            max: `${bigInt}4`,
                        },
                    },
                },
            },
        });
    });

    test("should return the average of node properties", async () => {
        const movieType = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${movieType.name}  @node {
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
                    CREATE (:${movieType.name} {testString: "different-string", imdbRatingBigInt: ${bigInt}5})
                `,
            {
                testString,
            }
        );

        const query = /* GraphQL */ `
            {
                ${movieType.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate { 
                        node {
                            imdbRatingBigInt {
                                average
                            }
                        }
                    }
                }    
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [movieType.operations.connection]: {
                aggregate: {
                    node: {
                        imdbRatingBigInt: {
                            average: `${bigInt}2.5`,
                        },
                    },
                },
            },
        });
    });

    test("should return the sum of node properties", async () => {
        const movieType = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${movieType.name} @node {
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
                    CREATE (:${movieType.name} {testString: "different-string", imdbRatingBigInt: ${bigInt}5})
                `,
            {
                testString,
            }
        );

        const query = /* GraphQL */ `
            {
                ${movieType.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate {
                        node {
                            imdbRatingBigInt {
                                sum
                            }
                        }
                    }    
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [movieType.operations.connection]: {
                aggregate: {
                    node: {
                        imdbRatingBigInt: {
                            sum: "85899345890",
                        },
                    },
                },
            },
        });
    });

    test("should return the min, max, sum and average of node properties", async () => {
        const movieType = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${movieType.name} @node {
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
                    CREATE (:${movieType.name} {testString: "different-string", imdbRatingBigInt: ${bigInt}5})
                `,
            {
                testString,
            }
        );

        const query = /* GraphQL */ `
            {
                ${movieType.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate {
                        node {
                            imdbRatingBigInt {
                                min
                                max
                                average
                                sum
                            }
                        }
                    }    
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [movieType.operations.connection]: {
                aggregate: {
                    node: {
                        imdbRatingBigInt: {
                            min: `${bigInt}1`,
                            max: `${bigInt}4`,
                            average: `${bigInt}2.5`,
                            sum: "85899345890",
                        },
                    },
                },
            },
        });
    });
});
