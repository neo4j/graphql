/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("@groupBy directive top level", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            type ${Movie} @node {
                title: String!
                year: Int! @groupBy
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${Person} @node {
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("groupBy in top level query with nested relationship in groupBy", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Movie} {title: "The Matrix", year: 1999})
            CREATE (:${Movie} {title: "The Matrix Reloaded", year: 2001})
            CREATE (:${Movie} {title: "Another Movie", year: 1999})<-[:ACTED_IN]-(:${Person} { name: "Another Keanu" })
        `);

        const query = /* GraphQL */ `
            query {
                ${Movie.operations.connection} {
                    groupBy(fields: {year: true}) {
                        edges {
                            node {
                                title
                                actors {
                                    name
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
                        edges: expect.toIncludeSameMembers([
                            {
                                node: {
                                    title: "The Matrix",
                                    actors: [],
                                },
                            },
                            {
                                node: {
                                    title: "Another Movie",
                                    actors: [
                                        {
                                            name: "Another Keanu",
                                        },
                                    ],
                                },
                            },
                        ]),
                    },
                    {
                        edges: [
                            {
                                node: {
                                    title: "The Matrix Reloaded",
                                    actors: [],
                                },
                            },
                        ],
                    },
                ]),
            },
        });
    });
});
