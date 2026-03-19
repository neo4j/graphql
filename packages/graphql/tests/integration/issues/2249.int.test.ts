/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2249", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Person: UniqueType;
    let Influencer: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Person = testHelper.createUniqueType("Person");
        Influencer = testHelper.createUniqueType("Influencer");

        const typeDefs = `
            type ${Movie} @node {
                title: String!
                reviewers: [Reviewer!]! @relationship(type: "REVIEWED", properties: "Review", direction: IN)
                imdbId: Int
            }

            type Review @relationshipProperties {
                score: Int!
            }

            type ${Person} implements Reviewer @node {
                name: String!
                reputation: Int!
            }
            type ${Influencer} implements Reviewer @node {
                reputation: Int!
                url: String!
                reviewerId: Int
            }

            interface Reviewer {
                reputation: Int!
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Update with create on an interface type should return valid Cypher", async () => {
        await testHelper.executeCypher(`CREATE (:${Movie} { title: "John Wick" })`);

        const mutation = `
            mutation {
                ${Movie.operations.update}(
                    where: { title_EQ: "John Wick" }
                    update: {
                        reviewers: [
                            { create: [{ edge: { score: 10 }, node: { ${Person}: { reputation: 100, name: "Ana" } } }] }
                        ]
                    }
                ) {
                    ${Movie.plural} {
                        title
                        reviewers {
                            ... on ${Person} {
                              name
                              reputation
                            }
                          }
                    }
                }
            }
        `;

        const mutationResult = await testHelper.executeGraphQL(mutation);

        expect(mutationResult.errors).toBeFalsy();
        expect(mutationResult.data).toEqual({
            [Movie.operations.update]: {
                [Movie.plural]: [
                    {
                        title: "John Wick",
                        reviewers: [
                            {
                                name: "Ana",
                                reputation: 100,
                            },
                        ],
                    },
                ],
            },
        });
    });
});
