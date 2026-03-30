/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { TestHelper } from "../../../utils/tests-helper";

describe("aggregations-top_level-basic", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("should count nodes", async () => {
        const randomType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} @node {
                str: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${randomType.name} {str: "asd"})
            CREATE (:${randomType.name} {str: "asd3"})
        `);

        const query = /* GraphQL */ `
                {
                    ${randomType.operations.connection} {
                        aggregate {
                            count {
                                nodes
                            }
                            node {
                                str {
                                    longest 
                                }
                            }
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [randomType.operations.connection]: {
                aggregate: {
                    count: {
                        nodes: 2,
                    },
                    node: {
                        str: {
                            longest: "asd3",
                        },
                    },
                },
            },
        });
    });

    test("should return 0 if no nodes exist", async () => {
        const randomType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} @node {
                id: ID
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
                {
                    ${randomType.operations.connection} {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [randomType.operations.connection]: {
                aggregate: {
                    count: {
                        nodes: 0,
                    },
                },
            },
        });
    });
});
