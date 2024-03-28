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

describe("aggregations-top_level-many", () => {
    const testHelper = new TestHelper();
    let typeMovie: UniqueType;

    beforeEach(() => {
        typeMovie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should preform many aggregations and return correct data", async () => {
        const typeDefs = `
            type ${typeMovie} {
                testId: ID!
                id: ID!
                title: String!
                imdbRating: Int!
                createdAt: DateTime
            }
        `;

        const testId = generate({
            charset: "alphabetic",
            readable: true,
        });

        const minDate = new Date();

        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 1);

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${typeMovie} {testId: "${testId}", id: "1", title: "1", imdbRating: 1, createdAt: datetime("${minDate.toISOString()}")})
                    CREATE (:${typeMovie} {testId: "${testId}", id: "22", title: "22", imdbRating: 2, createdAt: datetime()})
                    CREATE (:${typeMovie} {testId: "${testId}", id: "333", title: "333", imdbRating: 3, createdAt: datetime()})
                    CREATE (:${typeMovie} {testId: "${testId}", id: "4444", title: "4444", imdbRating: 4, createdAt: datetime("${maxDate.toISOString()}")})
                `
        );

        const query = `
                {
                    ${typeMovie.operations.aggregate}(where: { testId: "${testId}" }) {
                        id {
                            shortest
                            longest
                        }
                        title {
                            shortest
                            longest
                        }
                        imdbRating {
                            min
                            max
                            average
                        }
                        createdAt {
                            min
                            max
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
            id: {
                shortest: "1",
                longest: "4444",
            },
            title: {
                shortest: "1",
                longest: "4444",
            },
            imdbRating: {
                min: 1,
                max: 4,
                average: 2.5,
            },
            createdAt: {
                min: minDate.toISOString(),
                max: maxDate.toISOString(),
            },
        });
    });
});
