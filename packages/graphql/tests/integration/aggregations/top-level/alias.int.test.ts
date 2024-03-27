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

describe("aggregations-top_level-alias", () => {
    const testHelper = new TestHelper();
    let typeMovie: UniqueType;

    beforeEach(() => {
        typeMovie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should perform many aggregations while aliasing each field and return correct data", async () => {
        const typeDefs = `
            type ${typeMovie} {
                testString: ID!
                id: ID!
                title: String!
                imdbRating: Int!
                createdAt: DateTime
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const minDate = new Date();

        const maxDate = new Date();
        maxDate.setDate(maxDate.getDate() + 1);

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${typeMovie} {testString: "${testString}", id: "1", title: "1", imdbRating: 1, createdAt: datetime("${minDate.toISOString()}")})
                    CREATE (:${typeMovie} {testString: "${testString}", id: "22", title: "22", imdbRating: 2, createdAt: datetime()})
                    CREATE (:${typeMovie} {testString: "${testString}", id: "333", title: "333", imdbRating: 3, createdAt: datetime()})
                    CREATE (:${typeMovie} {testString: "${testString}", id: "4444", title: "4444", imdbRating: 4, createdAt: datetime("${maxDate.toISOString()}")})
                `
        );

        const query = /* GraphQL */ `
                {
                    ${typeMovie.operations.aggregate}(where: { testString: "${testString}" }) {
                        _count: count
                        _id: id {
                            _shortest: shortest
                            _longest: longest
                        }
                        _title: title {
                            _shortest: shortest
                            _longest: longest
                        }
                        _imdbRating: imdbRating {
                            _min: min
                            _max: max
                            _average: average
                        }
                        _createdAt: createdAt {
                            _min: min
                            _max: max
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[typeMovie.operations.aggregate]).toEqual({
            _count: 4,
            _id: {
                _shortest: "1",
                _longest: "4444",
            },
            _title: {
                _shortest: "1",
                _longest: "4444",
            },
            _imdbRating: {
                _min: 1,
                _max: 4,
                _average: 2.5,
            },
            _createdAt: {
                _min: minDate.toISOString(),
                _max: maxDate.toISOString(),
            },
        });
    });
});
