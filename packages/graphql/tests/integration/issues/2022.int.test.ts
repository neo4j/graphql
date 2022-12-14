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
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/2022", () => {
    let schema: GraphQLSchema;
    let neo4j: Neo4j;
    let driver: Driver;
    let session: Session;

    const ArtPiece = generateUniqueType("ArtItem");
    const AuctionItem = generateUniqueType("Auction");
    const Organization = generateUniqueType("Organization");

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = `
            type ${ArtPiece} {
                dbId: ID! @id(global: true) @alias(property: "id")
                title: String!
                auction: ${AuctionItem}! @relationship(type: "SOLD_AT_AUCTION_AS", direction: OUT)
                owner: ${Organization}! @relationship(type: "OWNED_BY", direction: OUT)
            }

            type ${AuctionItem} {
                dbId: ID! @id(global: true) @alias(property: "id")
                auctionName: String!
                lotNumber: Int!

                item: ${ArtPiece}! @relationship(type: "SOLD_AT_AUCTION_AS", direction: IN)
                buyer: ${Organization}! @relationship(type: "BOUGHT_ITEM_AT_AUCTION", direction: IN)
                seller: ${Organization}! @relationship(type: "SOLD_ITEM_AT_AUCTION", direction: IN)
            }

            type ${Organization} {
                dbId: ID! @id(global: true) @alias(property: "id")
                name: String!

                artCollection: [${ArtPiece}!]! @relationship(type: "OWNED_BY", direction: IN)
                itemsSoldAtAuction: [${AuctionItem}!]! @relationship(type: "SOLD_ITEM_AT_AUCTION", direction: OUT)
                itemsBoughtAtAuction: [${AuctionItem}!]! @relationship(type: "BOUGHT_ITEM_AT_AUCTION", direction: OUT)
            }
        `;

        session = await neo4j.getSession();

        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
    });

    test("should not throw error when querying nested relations under a root connection field", async () => {
        const query = `
            query {
                ${ArtPiece.operations.connection} {
                    totalCount
                    edges {
                        node {
                            id
                            title
                            auction {
                                id
                                auctionName
                                lotNumber
                                buyer {
                                    id
                                    name
                                }
                            }
                            owner {
                                id
                                name
                            }
                        }
                    }
                }
            }
        `;

        const queryResult = await graphqlQuery(query);
        expect(queryResult.errors).toBeUndefined();
    });
});
