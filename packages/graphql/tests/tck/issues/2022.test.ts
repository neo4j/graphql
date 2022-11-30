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

import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2022", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type ArtPiece {
                dbId: ID! @id(global: true) @alias(property: "id")
                title: String!
                auction: AuctionItem! @relationship(type: "SOLD_AT_AUCTION_AS", direction: OUT)
                owner: Organization! @relationship(type: "OWNED_BY", direction: OUT)
            }

            type AuctionItem {
                dbId: ID! @id(global: true) @alias(property: "id")
                auctionName: String!
                lotNumber: Int!

                item: ArtPiece! @relationship(type: "SOLD_AT_AUCTION_AS", direction: IN)
                buyer: Organization! @relationship(type: "BOUGHT_ITEM_AT_AUCTION", direction: IN)
                seller: Organization! @relationship(type: "SOLD_ITEM_AT_AUCTION", direction: IN)
            }

            type Organization {
                dbId: ID! @id(global: true) @alias(property: "id")
                name: String!

                artCollection: [ArtPiece!]! @relationship(type: "OWNED_BY", direction: IN)
                itemsSoldAtAuction: [AuctionItem!]! @relationship(type: "SOLD_ITEM_AT_AUCTION", direction: OUT)
                itemsBoughtAtAuction: [AuctionItem!]! @relationship(type: "BOUGHT_ITEM_AT_AUCTION", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("query nested relations under a root connection field", async () => {
        const query = gql`
            query {
                artPiecesConnection {
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
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`ArtPiece\`)
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            CALL {
                WITH this
                MATCH (this)-[this0:SOLD_AT_AUCTION_AS]->(this_auction:\`AuctionItem\`)
                CALL {
                    WITH this_auction
                    MATCH (this_auction_buyer:\`Organization\`)-[this1:BOUGHT_ITEM_AT_AUCTION]->(this_auction)
                    WITH this_auction_buyer { .name, dbId: this_auction_buyer.id } AS this_auction_buyer
                    RETURN head(collect(this_auction_buyer)) AS this_auction_buyer
                }
                WITH this_auction { .auctionName, .lotNumber, buyer: this_auction_buyer, dbId: this_auction.id } AS this_auction
                RETURN head(collect(this_auction)) AS this_auction
            }
            CALL {
                WITH this
                MATCH (this)-[this2:OWNED_BY]->(this_owner:\`Organization\`)
                WITH this_owner { .name, dbId: this_owner.id } AS this_owner
                RETURN head(collect(this_owner)) AS this_owner
            }
            WITH { node: this { .title, auction: this_auction, owner: this_owner, dbId: this.id } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
