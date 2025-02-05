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
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("aggregations-top_level-int", () => {
    const testHelper = new TestHelper();
    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                testString: String
                imdbRating: Int
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

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {testString: $testString, imdbRating: 1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 2})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 3})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 4})
                    CREATE (:${Movie} {testString: "different-string", imdbRating: 5})
                `,
            {
                testString,
            }
        );

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate {
                        node {
                            imdbRating {
                                min
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [Movie.operations.connection]: {
                aggregate: {
                    node: {
                        imdbRating: {
                            min: 1,
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

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {testString: $testString, imdbRating: 1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 2})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 3})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 4})
                    CREATE (:${Movie} {testString: "different-string", imdbRating: 5})
                `,
            {
                testString,
            }
        );

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate {
                        node {
                            imdbRating {
                                max
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [Movie.operations.connection]: {
                aggregate: {
                    node: {
                        imdbRating: {
                            max: 4,
                        },
                    },
                },
            },
        });
    });

    test("should return the average of node properties", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {testString: $testString, imdbRating: 1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 2})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 3})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 4})
                    CREATE (:${Movie} {testString: "different-string", imdbRating: 5})
                `,
            {
                testString,
            }
        );

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate {
                        node {
                            imdbRating {
                                average
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [Movie.operations.connection]: {
                aggregate: {
                    node: {
                        imdbRating: {
                            average: 2.5,
                        },
                    },
                },
            },
        });
    });

    test("should return the sum of node properties", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {testString: $testString, imdbRating: 1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 2})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 3})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 4})
                    CREATE (:${Movie} {testString: "different-string", imdbRating: 5})
                `,
            {
                testString,
            }
        );

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate {
                        node {
                            imdbRating {
                                sum
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [Movie.operations.connection]: {
                aggregate: {
                    node: {
                        imdbRating: {
                            sum: 10,
                        },
                    },
                },
            },
        });
    });

    test("should return the min, max, sum and average of node properties", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Movie} {testString: $testString, imdbRating: 1})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 2})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 3})
                    CREATE (:${Movie} {testString: $testString, imdbRating: 4})
                    CREATE (:${Movie} {testString: "different-string", imdbRating: 5})
                `,
            {
                testString,
            }
        );

        const query = /* GraphQL */ `
            {
                ${Movie.operations.connection}(where: { testString: { eq: "${testString}" } }) {
                    aggregate {
                        node {
                            imdbRating {
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

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [Movie.operations.connection]: {
                aggregate: {
                    node: {
                        imdbRating: {
                            min: 1,
                            max: 4,
                            average: 2.5,
                            sum: 10,
                        },
                    },
                },
            },
        });
    });
});
