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

import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe.each(["ID", "String"] as const)("%s Filtering - 'in'", (type) => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                value: ${type}
            }

        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Movie} {value: "The Matrix"})
            CREATE (:${Movie} {value: "The Matrix 2"})
            CREATE (:${Movie} {value: "Bill And Ted"})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("filter by 'in'", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { edges: { node: { value: { in: ["The Matrix", "The Matrix 2"] } } } }) {
                    connection {
                        edges {
                            node {
                                value
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    edges: expect.toIncludeSameMembers([
                        {
                            node: {
                                value: "The Matrix",
                            },
                        },
                        {
                            node: {
                                value: "The Matrix 2",
                            },
                        },
                    ]),
                },
            },
        });
    });

    test("filter by NOT 'in'", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(where: { edges: { NOT: { node: { value: { in: ["The Matrix", "The Matrix 2"] } } } } }) {
                    connection {
                        edges {
                            node {
                                value
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Movie.plural]: {
                connection: {
                    edges: [
                        {
                            node: {
                                value: "Bill And Ted",
                            },
                        },
                    ],
                },
            },
        });
    });
});
