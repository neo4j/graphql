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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/1348", () => {
    const Series = new UniqueType("Series");
    const Season = new UniqueType("Season");
    const ProgrammeItem = new UniqueType("ProgrammeItem");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4jHelper;

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

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
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    afterEach(async () => {
        await cleanNodes(driver, [Series, Season, ProgrammeItem]);
    });

    afterAll(async () => {
        await driver.close();
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

        const createProgrammeItemsResults = await graphqlQuery(createProgrammeItems);
        expect(createProgrammeItemsResults.errors).toBeUndefined();

        const updateProgrammeItemsResults = await graphqlQuery(updateProgrammeItems);
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
        const queryResults = await graphqlQuery(query);
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
