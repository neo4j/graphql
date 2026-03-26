/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("@groupBy directive top level with @customResolver directive", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String! @customResolver
                year: Int! @groupBy
                rating: Int @groupBy 
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            resolvers: {
                [Movie.toString()]: {
                    title() {
                        return "A title";
                    },
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("groupBy in top level query grouped by cypher directive field", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} { year: 1999})
            CREATE (:${Movie} { year: 2001})
            CREATE (:${Movie} { year: 1999})
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: {year: true}) {
                        edges {
                            node {
                                title
                                year
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
                                    title: "A title",
                                    year: 1999,
                                },
                            },
                            {
                                node: {
                                    title: "A title",
                                    year: 1999,
                                },
                            },
                        ]),
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "A title",
                                    year: 2001,
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });
});
