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

describe("aggregations-top_level-string", () => {
    const testHelper = new TestHelper();
    let typeMovie: UniqueType;

    const titles = [10, 11, 12, 13, 14].map((length) =>
        generate({
            charset: "alphabetic",
            readable: true,
            length,
        })
    );

    beforeEach(() => {
        typeMovie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return the shortest of node properties", async () => {
        const typeDefs = `
            type ${typeMovie} {
                testId: ID
                title: String
            }
        `;

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[0]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[1]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[2]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[3]}"})
                `,
            {
                id,
            }
        );

        const query = `
                {
                    ${typeMovie.operations.aggregate}(where: {testId: "${id}"}) {
                        title {
                            shortest
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.aggregate]).toEqual({
            title: {
                shortest: titles[0],
            },
        });
    });

    test("should return the longest of node properties", async () => {
        const typeDefs = `
            type ${typeMovie} {
                testId: ID
                title: String
            }
        `;

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                CREATE (:${typeMovie} {testId: $id, title: "${titles[0]}"})
                CREATE (:${typeMovie} {testId: $id, title: "${titles[1]}"})
                CREATE (:${typeMovie} {testId: $id, title: "${titles[2]}"})
                CREATE (:${typeMovie} {testId: $id, title: "${titles[3]}"})
            `,
            {
                id,
            }
        );

        const query = `
                {
                    ${typeMovie.operations.aggregate}(where: {testId: "${id}"}) {
                        title {
                            longest
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.aggregate]).toEqual({
            title: {
                longest: titles[3],
            },
        });
    });

    test("should return the shortest and longest of node properties", async () => {
        const typeDefs = `
            type ${typeMovie} {
                testId: ID
                title: String
            }
        `;

        const id = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[0]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[1]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[2]}"})
                    CREATE (:${typeMovie} {testId: $id, title: "${titles[3]}"})
                `,
            {
                id,
            }
        );

        const query = `
                {
                    ${typeMovie.operations.aggregate}(where: {testId: "${id}"}) {
                        title {
                            shortest
                            longest
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.aggregate]).toEqual({
            title: {
                shortest: titles[0],
                longest: titles[3],
            },
        });
    });
});
