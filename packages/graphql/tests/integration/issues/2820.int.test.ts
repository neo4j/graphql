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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2820", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Series: UniqueType;
    let Actor: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");
        Actor = testHelper.createUniqueType("Actor");

        const typeDefs = `
            interface Production {
                title: String!
            }

            type ${Movie} implements Production {
                title: String!
            }

            type ${Series} implements Production {
                title: String!
            }

            union ProductionUnion = ${Movie} | ${Series}

            type ${Actor} {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
                actedInUnion: [ProductionUnion!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
            CREATE (a:${Actor} { name: "Actor" })
            CREATE (a)-[:ACTED_IN]->(:${Movie} { title: "House" })
            CREATE (a)-[:ACTED_IN]->(:${Series} { title: "House" })
            CREATE (a)-[:ACTED_IN]->(:${Movie} { title: "Friends" })
            CREATE (a)-[:ACTED_IN]->(:${Series} { title: "Friends" })
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("interface count and amount should be correct", () => {
        test("should return total count 4", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInConnection {
                        totalCount
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInConnection.totalCount).toBe(4);
        });

        test("should return interface members in Connection", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInConnection {
                        totalCount
                        edges {
                            node {
                                __typename
                                title
                            }
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInConnection).toEqual({
                totalCount: 4,
                edges: expect.toIncludeAllMembers([
                    {
                        node: {
                            __typename: Movie.name,
                            title: "House",
                        },
                    },
                    {
                        node: {
                            __typename: Series.name,
                            title: "House",
                        },
                    },
                    {
                        node: {
                            __typename: Movie.name,
                            title: "Friends",
                        },
                    },
                    {
                        node: {
                            __typename: Series.name,
                            title: "Friends",
                        },
                    },
                ]),
            });
        });

        test("should return interface members in Connection without querying title", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInConnection {
                        totalCount
                        edges {
                            node {
                                __typename
                            }
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInConnection).toEqual({
                totalCount: 4,
                edges: expect.toIncludeAllMembers([
                    {
                        node: {
                            __typename: Movie.name,
                        },
                    },
                    {
                        node: {
                            __typename: Series.name,
                        },
                    },
                    {
                        node: {
                            __typename: Movie.name,
                        },
                    },
                    {
                        node: {
                            __typename: Series.name,
                        },
                    },
                ]),
            });
        });

        test("should return interface members in normal field", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedIn {
                        __typename
                        title
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedIn).toIncludeAllMembers([
                {
                    __typename: Movie.name,
                    title: "House",
                },
                {
                    __typename: Series.name,
                    title: "House",
                },
                {
                    __typename: Movie.name,
                    title: "Friends",
                },
                {
                    __typename: Series.name,
                    title: "Friends",
                },
            ]);
        });

        test("should return interface members in normal field without querying title", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedIn {
                        __typename
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedIn).toIncludeAllMembers([
                {
                    __typename: Movie.name,
                },
                {
                    __typename: Series.name,
                },
                {
                    __typename: Movie.name,
                },
                {
                    __typename: Series.name,
                },
            ]);
        });
    });

    describe("union count and amount should be correct", () => {
        test("should return total count 4", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInUnionConnection {
                        totalCount
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInUnionConnection.totalCount).toBe(4);
        });

        test("should return interface members in Connection", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInUnionConnection {
                        totalCount
                        edges {
                            node {
                                __typename
                                ... on ${Movie} {
                                    title
                                }
                                ... on ${Series} {
                                    title
                                }
                            }
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInUnionConnection).toEqual({
                totalCount: 4,
                edges: expect.toIncludeAllMembers([
                    {
                        node: {
                            __typename: Movie.name,
                            title: "House",
                        },
                    },
                    {
                        node: {
                            __typename: Series.name,
                            title: "House",
                        },
                    },
                    {
                        node: {
                            __typename: Movie.name,
                            title: "Friends",
                        },
                    },
                    {
                        node: {
                            __typename: Series.name,
                            title: "Friends",
                        },
                    },
                ]),
            });
        });

        test("should return interface members in Connection without querying title", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInUnionConnection {
                        totalCount
                        edges {
                            node {
                                __typename
                            }
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInUnionConnection).toEqual({
                totalCount: 4,
                edges: expect.toIncludeAllMembers([
                    {
                        node: {
                            __typename: Movie.name,
                        },
                    },
                    {
                        node: {
                            __typename: Series.name,
                        },
                    },
                    {
                        node: {
                            __typename: Movie.name,
                        },
                    },
                    {
                        node: {
                            __typename: Series.name,
                        },
                    },
                ]),
            });
        });

        test("should return interface members in normal field", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInUnion {
                        __typename
                        ... on ${Movie} {
                            title
                        }
                        ... on ${Series} {
                            title
                        }
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInUnion).toIncludeAllMembers([
                {
                    __typename: Movie.name,
                    title: "House",
                },
                {
                    __typename: Series.name,
                    title: "House",
                },
                {
                    __typename: Movie.name,
                    title: "Friends",
                },
                {
                    __typename: Series.name,
                    title: "Friends",
                },
            ]);
        });

        test("should return interface members in normal field without querying title", async () => {
            const query = `
            {
                ${Actor.plural} {
                    actedInUnion {
                        __typename
                    }
                }
            }
        `;

            const result = await testHelper.executeGraphQL(query);

            expect(result.errors).toBeFalsy();

            expect((result.data?.[Actor.plural] as any)[0].actedInUnion).toIncludeAllMembers([
                {
                    __typename: Movie.name,
                },
                {
                    __typename: Series.name,
                },
                {
                    __typename: Movie.name,
                },
                {
                    __typename: Series.name,
                },
            ]);
        });
    });
});
