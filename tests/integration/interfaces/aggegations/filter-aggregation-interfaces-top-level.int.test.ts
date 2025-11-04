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

import { createBearerToken } from "../../../utils/create-bearer-token";
import { TestHelper } from "../../../utils/tests-helper";

describe("Top-level filter interface query fields", () => {
    const secret = "the-secret";

    const testHelper = new TestHelper();
    let typeDefs: string;

    const Movie = testHelper.createUniqueType("Movie");
    const Series = testHelper.createUniqueType("Series");

    beforeAll(async () => {
        typeDefs = `
            interface Production {
                title: String!
                cost: Float!
            }

            type ${Movie} implements Production {
                title: String!
                cost: Float!
                runtime: Int
            }

            type ${Series} implements Production {
                title: String!
                cost: Float!
                episodes: Int
            }
        `;

        await testHelper.executeCypher(`
            CREATE(m1:${Movie} {title: "A Movie", cost: 10})
            CREATE(m2:${Movie} {title: "The Matrix is a very interesting movie: The Documentary", cost: 20})
            
            CREATE(s1:${Series} {title: "The Show", cost: 1})
            CREATE(s2:${Series} {title: "A Series 2", cost: 2})
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("top level count", async () => {
        const query = `
            query {
                productionsAggregate(where: { title: "The Show" }) {
                    count
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            productionsAggregate: {
                count: 1,
            },
        });
    });

    test("top level count with logical operator", async () => {
        const query = `
            query {
                productionsAggregate(where: { OR: [{title: "The Show"}, {title: "A Movie"}] }) {
                    count
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            productionsAggregate: {
                count: 2,
            },
        });
    });

    test("top level count and string fields", async () => {
        const query = `
            query {
                productionsAggregate(where: { title_STARTS_WITH: "The" }) {
                    count
                    title {
                        longest
                        shortest
                    }
                }
            }
        `;

        const token = createBearerToken(secret, {});
        const queryResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            productionsAggregate: {
                count: 2,
                title: {
                    longest: "The Matrix is a very interesting movie: The Documentary",
                    shortest: "The Show",
                },
            },
        });
    });
});
