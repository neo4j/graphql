/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1348", () => {
    let Series: UniqueType;
    let Season: UniqueType;
    let ProgrammeItem: UniqueType;

    const testHelper = new TestHelper();

    beforeEach(async () => {
        Series = testHelper.createUniqueType("Series");
        Season = testHelper.createUniqueType("Season");
        ProgrammeItem = testHelper.createUniqueType("ProgrammeItem");

        const typeDefs = /* GraphQL */ `
            interface Product {
                productTitle: String!
                relatedTo: [Product!]!
            }

            type ${Series} implements Product @node {
                productTitle: String!
                relatedTo: [Product!]!  @relationship(type: "RELATES_TO", direction: OUT, queryDirection: UNDIRECTED)

                seasons: [${Season}!]!
            }

            type ${Season} implements Product @node {
                productTitle: String!
                relatedTo: [Product!]!  @relationship(type: "RELATES_TO", direction: OUT, queryDirection: UNDIRECTED)

                seasonNumber: Int
                episodes: [${ProgrammeItem}!]!
            }

            type ${ProgrammeItem} implements Product @node {
                productTitle: String!
                relatedTo: [Product!]!  @relationship(type: "RELATES_TO", direction: OUT, queryDirection: UNDIRECTED)

                episodeNumber: Int
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should also return node with no relationship in result set", async () => {
        const createProgrammeItems = /* GraphQL */ `
            mutation {
                ${ProgrammeItem.operations.create}(input: [
                    {
                        productTitle: "TestEpisode1",
                        episodeNumber: 1
                    },
                    {
                        productTitle: "TestEpisode2",
                        episodeNumber: 2
                    },
                    {
                        productTitle: "TestFilm1"
                    }
                ]) {
                    ${ProgrammeItem.plural} {
                        productTitle
                        episodeNumber
                    }
                }
            }
        `;

        const updateProgrammeItems = /* GraphQL */ `
            mutation {
                ${ProgrammeItem.operations.update}(
                    where: { productTitle_EQ: "TestFilm1" }
                    update: {
                        relatedTo: {
                            connect: {
                                 where: { node: { productTitle_EQ: "TestEpisode1" } } 
                            }
                        }
                    }
                ) {
                    ${ProgrammeItem.plural} {
                        productTitle
                        episodeNumber
                        relatedTo {
                            __typename
                            productTitle
                        }
                    }
                }
            }
        `;

        const createProgrammeItemsResults = await testHelper.executeGraphQL(createProgrammeItems);
        expect(createProgrammeItemsResults.errors).toBeUndefined();

        const updateProgrammeItemsResults = await testHelper.executeGraphQL(updateProgrammeItems);
        expect(updateProgrammeItemsResults.errors).toBeUndefined();

        const query = /* GraphQL */ `
            query {
                ${ProgrammeItem.plural} {
                    productTitle
                    episodeNumber
                    relatedTo {
                        __typename
                        productTitle
                    }
                }
            }
        `;
        const queryResults = await testHelper.executeGraphQL(query);
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data).toEqual({
            [ProgrammeItem.plural]: expect.toIncludeSameMembers([
                {
                    productTitle: "TestEpisode2",
                    episodeNumber: 2,
                    relatedTo: [],
                },
                {
                    productTitle: "TestEpisode1",
                    episodeNumber: 1,
                    relatedTo: [
                        {
                            __typename: ProgrammeItem.name,
                            productTitle: "TestFilm1",
                        },
                    ],
                },
                {
                    productTitle: "TestFilm1",
                    episodeNumber: null,
                    relatedTo: [
                        {
                            __typename: ProgrammeItem.name,
                            productTitle: "TestEpisode1",
                        },
                    ],
                },
            ]),
        });
    });
});
