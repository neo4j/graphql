/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import neo4jDriver from "neo4j-driver";
import { generate } from "randomstring";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("aggregations-top_level-duration", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;
    let typeDefs: string;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                testString: String
                runningTime: Duration
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return the min of node properties", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const months = 1;
        const days = 1;
        const minDuration = new neo4jDriver.types.Duration(months, days, 0, 0);
        const maxDuration = new neo4jDriver.types.Duration(months + 1, days, 0, 0);
        const otherDuration = new neo4jDriver.types.Duration(months + 2, days, 0, 0);

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {testString: $testString, runningTime: $minDuration})
                    CREATE (:${Movie} {testString: $testString, runningTime: $maxDuration})
                    CREATE (:${Movie} {testString: "different-string", runningTime: $otherDuration})
                `,
            {
                testString,
                minDuration,
                maxDuration,
                otherDuration,
            }
        );

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate {
                        node {
                            runningTime {
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
            [Movie.operations.connection]: {
                aggregate: {
                    node: {
                        runningTime: {
                            min: minDuration.toString(),
                        },
                    },
                },
            },
        });
    });

    test("should return the max of node properties", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const months = 1;
        const days = 1;
        const minDuration = new neo4jDriver.types.Duration(months, days, 0, 0);
        const maxDuration = new neo4jDriver.types.Duration(months + 1, days, 0, 0);
        const otherDuration = new neo4jDriver.types.Duration(months + 2, days, 0, 0);

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {testString: $testString, runningTime: $minDuration})
                    CREATE (:${Movie} {testString: $testString, runningTime: $maxDuration})
                    CREATE (:${Movie} {testString: "different-string", runningTime: $otherDuration})
                `,
            {
                testString,
                minDuration,
                maxDuration,
                otherDuration,
            }
        );

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate {
                        node {
                            runningTime {
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
            [Movie.operations.connection]: {
                aggregate: {
                    node: {
                        runningTime: {
                            max: maxDuration.toString(),
                        },
                    },
                },
            },
        });
    });

    test("should return the min and max of node properties", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const months = 1;
        const days = 1;
        const minDuration = new neo4jDriver.types.Duration(months, days, 0, 0);
        const maxDuration = new neo4jDriver.types.Duration(months + 1, days, 0, 0);
        const otherDuration = new neo4jDriver.types.Duration(months + 2, days, 0, 0);

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {testString: $testString, runningTime: $minDuration})
                    CREATE (:${Movie} {testString: $testString, runningTime: $maxDuration})
                    CREATE (:${Movie} {testString: "different-string", runningTime: $otherDuration})
                `,
            {
                testString,
                minDuration,
                maxDuration,
                otherDuration,
            }
        );

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate {
                        node {
                            runningTime {
                                min
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
            [Movie.operations.connection]: {
                aggregate: {
                    node: {
                        runningTime: {
                            min: minDuration.toString(),
                            max: maxDuration.toString(),
                        },
                    },
                },
            },
        });
    });
});
