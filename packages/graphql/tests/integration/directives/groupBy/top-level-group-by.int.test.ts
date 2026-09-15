/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("@groupBy directive top level", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                year: Int! @groupBy 
                rating: Int @groupBy 
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("groupBy in top level query values only", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001})
            CREATE (:${Movie} {title: "Another Movie", year: 1999})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: {year: true}) {
                        values {
                            year
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupBy: expect.toIncludeSameMembers([
                    {
                        values: {
                            year: 1999,
                        },
                    },
                    {
                        values: {
                            year: 2001,
                        },
                    },
                ]),
            },
        });
    });

    test("groupBy in top level query without projection", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001})
            CREATE (:${Movie} {title: "Another Movie", year: 1999})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: {year: true}) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupBy: expect.toIncludeSameMembers([
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "The Matrix",
                                },
                            },
                            {
                                node: {
                                    title: "Another Movie",
                                },
                            },
                        ]),
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });

    test("aliased groupBy in top level query without projection", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999, rating: 10})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001, rating: 7})
            CREATE (:${Movie} {title: "Another Movie", year: 1999, rating: 7})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupByYear: groupBy(fields: {year: true}) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupByYear: expect.toIncludeSameMembers([
                    {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                },
                            },
                        ],
                    },
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "Another Movie",
                                },
                            },
                            {
                                node: {
                                    title: "The Matrix",
                                },
                            },
                        ]),
                    },
                ]),
            },
        });
    });

    test("groupBy in top level query for nullable field", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999, rating: 5})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001, rating: 5})
            CREATE (:${Movie} {title: "Another Movie", year: 1999})
            CREATE (:${Movie} {title: "Another Movie 2", year: 1999})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: {rating: true}) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupBy: expect.toIncludeSameMembers([
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "Another Movie 2",
                                },
                            },
                            {
                                node: {
                                    title: "Another Movie",
                                },
                            },
                        ]),
                    },
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                },
                            },
                            {
                                node: {
                                    title: "The Matrix",
                                },
                            },
                        ]),
                    },
                ]),
            },
        });
    });

    // This is not supported, same issue as in edges: https://github.com/neo4j/graphql/issues/5584
    // eslint-disable-next-line jest/no-disabled-tests
    test.skip("multitple aliased groupBy in top level query without projection", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999, rating: 10})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001, rating: 7})
            CREATE (:${Movie} {title: "Another Movie", year: 1999, rating: 7})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupByYear: groupBy(fields: {year: true}) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                    groupByRating: groupBy(fields: {rating: true}) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupByYear: expect.toIncludeSameMembers([
                    {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                },
                            },
                        ],
                    },
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "Another Movie",
                                },
                            },
                            {
                                node: {
                                    title: "The Matrix",
                                },
                            },
                        ]),
                    },
                ]),
                groupByRating: expect.toIncludeSameMembers([
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "The Matrix",
                                },
                            },
                            {
                                node: {
                                    title: "Another Movie",
                                },
                            },
                        ]),
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });

    test("groupBy in top level query with node projection", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001})
            CREATE (:${Movie} {title: "Another Movie", year: 1999})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    edges {
                        node {
                            title
                        }
                    }
                    groupBy(fields: {year: true}) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            title: "The Matrix",
                        },
                    },
                    {
                        node: {
                            title: "The Matrix Reloaded",
                        },
                    },
                    {
                        node: {
                            title: "Another Movie",
                        },
                    },
                ]),
                groupBy: expect.toIncludeSameMembers([
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "The Matrix",
                                },
                            },
                            {
                                node: {
                                    title: "Another Movie",
                                },
                            },
                        ]),
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });

    test("groupBy in top level query with aggregation projection", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001})
            CREATE (:${Movie} {title: "Another Movie", year: 1999})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    edges {
                        node {
                            title
                        }
                    }
                    aggregate {
                        count {
                            nodes
                        }
                    }
                    groupBy(fields: {year: true}) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                aggregate: {
                    count: {
                        nodes: 3,
                    },
                },
                edges: expect.toIncludeSameMembers([
                    {
                        node: {
                            title: "The Matrix",
                        },
                    },
                    {
                        node: {
                            title: "The Matrix Reloaded",
                        },
                    },
                    {
                        node: {
                            title: "Another Movie",
                        },
                    },
                ]),
                groupBy: expect.toIncludeSameMembers([
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "The Matrix",
                                },
                            },
                            {
                                node: {
                                    title: "Another Movie",
                                },
                            },
                        ]),
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });

    test("groupBy in top level query by multiple fields", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999, rating: 5})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001, rating: 5})
            CREATE (:${Movie} {title: "Another Movie", year: 1999, rating: 6})
            CREATE (:${Movie} {title: "Another Movie 2", year: 1999, rating: 6})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: {rating: true, year: true}) {
                        edges {
                            node {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupBy: expect.toIncludeSameMembers([
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "Another Movie 2",
                                },
                            },
                            {
                                node: {
                                    title: "Another Movie",
                                },
                            },
                        ]),
                    },
                    {
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "The Matrix",
                                },
                            },
                        ]),
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });

    // test("groupBy alongside regular edges with pagination", async () => {
    //     await testHelper.executeCypher(`
    //         CREATE (:${Movie} {title: "The Matrix", year: 1999, rating: 5})
    //         CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001, rating: 7})
    //         CREATE (:${Movie} {title: "Another Movie", year: 1999, rating: 5})
    //     `);

    //     const query = /* GraphQL */ `
    //         query {
    //             ${Movie.operations.connection}(first: 2) {
    //                 groupBy(fields: { year: true, rating: true }) {
    //                     edges {
    //                         node {
    //                             title
    //                         }
    //                     }
    //                 }
    //                 edges {
    //                     node {
    //                         title
    //                     }
    //                     cursor
    //                 }
    //                 pageInfo {
    //                     hasNextPage
    //                     endCursor
    //                 }
    //             }
    //         }
    //     `;

    //     const result = await testHelper.executeGraphQL(query);
    //     expect(result.errors).toBeUndefined();

    //     const connection = result.data?.[Movie.operations.connection];
    //     // Regular edges are limited to 2
    //     expect(connection.edges).toHaveLength(2);
    //     expect(connection.pageInfo.hasNextPage).toBe(true);

    //     // groupBy operates on all results regardless of pagination
    //     expect(connection.groupBy).toIncludeSameMembers([
    //         {
    //             edges: expect.toIncludeSameMembers([
    //                 { node: { title: "The Matrix" } },
    //                 { node: { title: "Another Movie" } },
    //             ]),
    //         },
    //         {
    //             edges: [{ node: { title: "The Matrix Reloaded" } }],
    //         },
    //     ]);
    // });

    test("groupBy with aggregate inside group", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999, rating: 5})
            CREATE (:${Movie} {title: "Toy Story", year: 1999, rating: 5})
            CREATE (:${Movie} {title: "Toy Story 2", year: 2001, rating: 5})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001, rating: 7})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection}(first: 1) {
                    groupBy(fields: { year: true, rating: true }) {
                        values {
                            year
                            rating
                        }
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                title {
                                    longest
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();

        expect(result.data).toEqual({
            [Movie.operations.connection]: {
                groupBy: expect.toIncludeSameMembers([
                    {
                        values: {
                            year: 1999,
                            rating: 5,
                        },
                        aggregate: {
                            count: { nodes: 2 },
                            node: { title: { longest: "The Matrix" } },
                        },
                    },
                    {
                        values: {
                            year: 2001,
                            rating: 7,
                        },
                        aggregate: {
                            count: { nodes: 1 },
                            node: { title: { longest: "The Matrix Reloaded" } },
                        },
                    },
                    {
                        values: {
                            year: 2001,
                            rating: 5,
                        },
                        aggregate: {
                            count: { nodes: 1 },
                            node: { title: { longest: "Toy Story 2" } },
                        },
                    },
                ]),
            },
        });
    });
});
