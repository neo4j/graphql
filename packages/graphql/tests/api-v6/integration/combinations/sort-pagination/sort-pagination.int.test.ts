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

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("Sort", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;

    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                ratings: Int!
                description: String
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", description: "DVD edition", ratings: 5})
            CREATE (:${Movie} {title: "The Matrix", description: "Cinema edition", ratings: 4})
            CREATE (:${Movie} {title: "The Matrix 2", ratings: 2})
            CREATE (:${Movie} {title: "The Matrix 3", ratings: 4})
            CREATE (:${Movie} {title: "The Matrix 4", ratings: 3})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should be able to sort by ASC order and limit", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection(sort: { edges: { node: { title: ASC } } }, first: 3) {
                        edges {
                            node {
                                title
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
                                title: "The Matrix",
                            },
                        },
                        {
                            node: {
                                title: "The Matrix",
                            },
                        },
                        {
                            node: {
                                title: "The Matrix 2",
                            },
                        },
                    ],
                },
            },
        });
    });

    test("should be able to sort by DESC order and limit", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    connection(sort: { edges: { node: { title: DESC } } }, first: 3) {
                        edges {
                            node {
                                title
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
                                title: "The Matrix 4",
                            },
                        },
                        {
                            node: {
                                title: "The Matrix 3",
                            },
                        },
                        {
                            node: {
                                title: "The Matrix 2",
                            },
                        },
                    ],
                },
            },
        });
    });
});
