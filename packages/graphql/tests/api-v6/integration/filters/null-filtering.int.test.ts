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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Null filtering", () => {
    const testHelper = new TestHelper({ v6Api: true });

    let Movie: UniqueType;
    beforeAll(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                id: String!
                optional: String
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${Movie} { id: "id-1"})
            CREATE (:${Movie} { id: "id-2", optional: "My Option"})
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("equals null query", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: {
                        node: { optional: { equals: null } }
                    }
                ) {
                    connection {
                        edges {
                            node {
                                id
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
                                id: "id-1",
                            },
                        },
                    ],
                },
            },
        });
    });

    test("equals null query with NOT", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: {
                        node: { optional: { NOT: { equals: null } } }
                    }
                ) {
                    connection {
                        edges {
                            node {
                                id
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
                                id: "id-2",
                            },
                        },
                    ],
                },
            },
        });
    });

    test("null filter without operator should be ignored", async () => {
        const query = /* GraphQL */ `
            query {
                ${Movie.plural}(
                    where: {
                        node: { optional: null }
                    }
                ) {
                    connection {
                        edges {
                            node {
                                id
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
                                id: "id-1",
                            },
                        },
                        {
                            node: {
                                id: "id-2",
                            },
                        },
                    ]),
                },
            },
        });
    });
});
