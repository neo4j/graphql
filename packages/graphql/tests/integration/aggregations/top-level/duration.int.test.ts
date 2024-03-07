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
import neo4jDriver from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../src/classes";
import { UniqueType } from "../../../utils/graphql-types";
import Neo4jHelper from "../../neo4j";

describe("aggregations-top_level-duration", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let Movie: UniqueType;
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Movie = new UniqueType("Movie");
        typeDefs = `
            type ${Movie} {
                testString: String
                runningTime: Duration
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

        const months = 1;
        const days = 1;
        const minDuration = new neo4jDriver.types.Duration(months, days, 0, 0);
        const maxDuration = new neo4jDriver.types.Duration(months + 1, days, 0, 0);

        try {
            await session.run(
                `
                    CREATE (:${Movie} {testString: $testString, runningTime: $minDuration})
                    CREATE (:${Movie} {testString: $testString, runningTime: $maxDuration})
                `,
                {
                    testString,
                    minDuration,
                    maxDuration,
                }
            );

            const query = `
                {
                    ${Movie.operations.aggregate}(where: {testString: "${testString}"}) {
                        runningTime {
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
                runningTime: {
                    min: minDuration.toString(),
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

        const months = 1;
        const days = 1;
        const minDuration = new neo4jDriver.types.Duration(months, days, 0, 0);
        const maxDuration = new neo4jDriver.types.Duration(months + 1, days, 0, 0);

        try {
            await session.run(
                `
                    CREATE (:${Movie} {testString: $testString, runningTime: $minDuration})
                    CREATE (:${Movie} {testString: $testString, runningTime: $maxDuration})
                `,
                {
                    testString,
                    minDuration,
                    maxDuration,
                }
            );

            const query = `
                {
                    ${Movie.operations.aggregate}(where: {testString: "${testString}"}) {
                        runningTime {
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
                runningTime: {
                    max: maxDuration.toString(),
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the min and max of node properties", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const months = 1;
        const days = 1;
        const minDuration = new neo4jDriver.types.Duration(months, days, 0, 0);
        const maxDuration = new neo4jDriver.types.Duration(months + 1, days, 0, 0);

        try {
            await session.run(
                `
                    CREATE (:${Movie} {testString: $testString, runningTime: $minDuration})
                    CREATE (:${Movie} {testString: $testString, runningTime: $maxDuration})
                `,
                {
                    testString,
                    minDuration,
                    maxDuration,
                }
            );

            const query = `
                {
                    ${Movie.operations.aggregate}(where: {testString: "${testString}"}) {
                        runningTime {
                            min
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
