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
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1348", () => {
    const testSeries = new UniqueType("Series");
    const testSeason = new UniqueType("Season");
    const testProgrammeItem = new UniqueType("ProgrammeItem");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    async function graphqlQuery(query: string, bookmark?: string) {
        return graphql({
            schema,
            source: query,
            contextValue: bookmark ? neo4j.getContextValuesWithBookmarks([bookmark]) : neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = `
            interface Product {
                productTitle: String!
                releatsTo: [Product!]!
            }

            type ${testSeries} implements Product {
                productTitle: String!
                releatsTo: [Product!]!  @relationship(type: "RELATES_TO", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)

                seasons: [${testSeason}!]!
            }

            type ${testSeason} implements Product {
                productTitle: String!
                releatsTo: [Product!]!  @relationship(type: "RELATES_TO", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)

                seasonNumber: Int
                episodes: [${testProgrammeItem}!]!
            }

            type ${testProgrammeItem} implements Product {
                productTitle: String!
                releatsTo: [Product!]!  @relationship(type: "RELATES_TO", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)

                episodeNumber: Int
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.run(`MATCH (s:${testSeries}) DETACH DELETE s`);
        await session.run(`MATCH (s:${testSeason}) DETACH DELETE s`);
        await session.run(`MATCH (p:${testProgrammeItem}) DETACH DELETE p`);

        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should also return node with no relationship in result set", async () => {
        const createProgrammeItems = `
            mutation {
                ${testProgrammeItem.operations.create}(input: [
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
                    ${testProgrammeItem.plural} {
                        productTitle
                        episodeNumber
                    }
                }
            }
        `;
        const updateProgrammeItems = `
            mutation {
                ${testProgrammeItem.operations.update}(
                    where: { productTitle: "TestFilm1" }
                    connect: { releatsTo: { where: { node: { productTitle: "TestEpisode1" } } } }
                ) {
                    info {
                        bookmark
                    }
                    ${testProgrammeItem.plural} {
                        productTitle
                        episodeNumber
                        releatsTo {
                            __typename
                            productTitle
                        }
                    }
                }
            }
        `;
        const createProgrammeItemsResults = await graphqlQuery(createProgrammeItems);
        expect(createProgrammeItemsResults.errors).toBeUndefined();

        const updateProgrammeItemsResults = await graphqlQuery(
            updateProgrammeItems,
            (createProgrammeItemsResults.data?.[testProgrammeItem.operations.create] as any).info.bookmark as
                | string
                | undefined,
        );
        expect(updateProgrammeItemsResults.errors).toBeUndefined();

        const query = `
            query {
                ${testProgrammeItem.plural} {
                    productTitle
                    episodeNumber
                    releatsTo {
                        __typename
                        productTitle
                    }
                }
            }
        `;
        const queryResults = await graphqlQuery(
            query,
            (updateProgrammeItemsResults.data?.[testProgrammeItem.operations.update] as any).info.bookmark as
                | string
                | undefined,
        );
        expect(queryResults.errors).toBeUndefined();
        expect(queryResults.data as any).toEqual({
            [testProgrammeItem.plural]: expect.toIncludeSameMembers([
                {
                    productTitle: "TestEpisode2",
                    episodeNumber: 2,
                    releatsTo: [],
                },
                {
                    productTitle: "TestEpisode1",
                    episodeNumber: 1,
                    releatsTo: [
                        {
                            __typename: testProgrammeItem.name,
                            productTitle: "TestFilm1",
                        },
                    ],
                },
                {
                    productTitle: "TestFilm1",
                    episodeNumber: null,
                    releatsTo: [
                        {
                            __typename: testProgrammeItem.name,
                            productTitle: "TestEpisode1",
                        },
                    ],
                },
            ]),
        });
    });
});
