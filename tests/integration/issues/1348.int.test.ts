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

            type ${Series} implements Product {
                productTitle: String!
                relatedTo: [Product!]!  @relationship(type: "RELATES_TO", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)

                seasons: [${Season}!]!
            }

            type ${Season} implements Product {
                productTitle: String!
                relatedTo: [Product!]!  @relationship(type: "RELATES_TO", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)

                seasonNumber: Int
                episodes: [${ProgrammeItem}!]!
            }

            type ${ProgrammeItem} implements Product {
                productTitle: String!
                relatedTo: [Product!]!  @relationship(type: "RELATES_TO", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)

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
                    info {
                        bookmark
                    }
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
                    where: { productTitle: "TestFilm1" }
                    connect: { relatedTo: { where: { node: { productTitle: "TestEpisode1" } } } }
                ) {
                    info {
                        bookmark
                    }
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
