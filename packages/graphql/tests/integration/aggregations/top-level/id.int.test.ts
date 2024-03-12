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

describe("aggregations-top_level-id", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let Movie: UniqueType;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        Movie = new UniqueType("Movie");
        const typeDefs = `
        type ${Movie} {
            testId: ID
            id: ID
        }
        `;

        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return the shortest of node properties", async () => {
        const session = await neo4j.getSession();

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Movie} {testId: $id, id: "1"})
                    CREATE (:${Movie} {testId: $id, id: "22"})
                    CREATE (:${Movie} {testId: $id, id: "333"})
                    CREATE (:${Movie} {testId: $id, id: "4444"})
                `,
                {
                    id,
                }
            );

            const query = `
                {
                    ${Movie.operations.aggregate}(where: {testId: "${id}"}) {
                        id {
                            shortest
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
                id: {
                    shortest: "1",
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the longest of node properties", async () => {
        const session = await neo4j.getSession();

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Movie} {testId: $id, id: "1"})
                    CREATE (:${Movie} {testId: $id, id: "22"})
                    CREATE (:${Movie} {testId: $id, id: "333"})
                    CREATE (:${Movie} {testId: $id, id: "4444"})
                `,
                {
                    id,
                }
            );

            const query = `
                {
                    ${Movie.operations.aggregate}(where: {testId: "${id}"}) {
                        id {
                            longest
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
                id: {
                    longest: "4444",
                },
            });
        } finally {
            await session.close();
        }
    });

    test("should return the shortest and longest of node properties", async () => {
        const session = await neo4j.getSession();

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Movie} {testId: $id, id: "1"})
                    CREATE (:${Movie} {testId: $id, id: "22"})
                    CREATE (:${Movie} {testId: $id, id: "333"})
                    CREATE (:${Movie} {testId: $id, id: "4444"})
                `,
                {
                    id,
                }
            );

            const query = `
                {
                    ${Movie.operations.aggregate}(where: {testId: "${id}"}) {
                        id {
                            shortest
                            longest
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
                id: {
                    shortest: "1",
                    longest: "4444",
                },
            });
        } finally {
            await session.close();
        }
    });
});
