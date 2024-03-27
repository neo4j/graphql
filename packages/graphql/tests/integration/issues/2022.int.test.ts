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

describe("https://github.com/neo4j/graphql/issues/2022", () => {
    const testHelper = new TestHelper();

    let ArtPiece: UniqueType;
    let AuctionItem: UniqueType;
    let Organization: UniqueType;

    beforeAll(async () => {
        ArtPiece = testHelper.createUniqueType("ArtItem");
        AuctionItem = testHelper.createUniqueType("Auction");
        Organization = testHelper.createUniqueType("Organization");

        const typeDefs = `
            type ${ArtPiece} {
                dbId: ID! @id @unique @relayId @alias(property: "id")
                title: String!
                auction: ${AuctionItem}! @relationship(type: "SOLD_AT_AUCTION_AS", direction: OUT)
                owner: ${Organization}! @relationship(type: "OWNED_BY", direction: OUT)
            }

            type ${AuctionItem} {
                dbId: ID! @id @unique @relayId @alias(property: "id")
                auctionName: String!
                lotNumber: Int!

                item: ${ArtPiece}! @relationship(type: "SOLD_AT_AUCTION_AS", direction: IN)
                buyer: ${Organization}! @relationship(type: "BOUGHT_ITEM_AT_AUCTION", direction: IN)
                seller: ${Organization}! @relationship(type: "SOLD_ITEM_AT_AUCTION", direction: IN)
            }

            type ${Organization} {
                dbId: ID! @id @unique @relayId @alias(property: "id")
                name: String!

                artCollection: [${ArtPiece}!]! @relationship(type: "OWNED_BY", direction: IN)
                itemsSoldAtAuction: [${AuctionItem}!]! @relationship(type: "SOLD_ITEM_AT_AUCTION", direction: OUT)
                itemsBoughtAtAuction: [${AuctionItem}!]! @relationship(type: "BOUGHT_ITEM_AT_AUCTION", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
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

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
    });
});
