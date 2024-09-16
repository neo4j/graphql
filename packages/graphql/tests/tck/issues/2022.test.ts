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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2022", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type ArtPiece @node {
                dbId: ID! @id @unique @relayId @alias(property: "id")
                title: String!
                auction: AuctionItem! @relationship(type: "SOLD_AT_AUCTION_AS", direction: OUT)
                owner: Organization! @relationship(type: "OWNED_BY", direction: OUT)
            }

            type AuctionItem @node {
                dbId: ID! @id @unique @relayId @alias(property: "id")
                auctionName: String!
                lotNumber: Int!

                item: ArtPiece! @relationship(type: "SOLD_AT_AUCTION_AS", direction: IN)
                buyer: Organization! @relationship(type: "BOUGHT_ITEM_AT_AUCTION", direction: IN)
                seller: Organization! @relationship(type: "SOLD_ITEM_AT_AUCTION", direction: IN)
            }

            type Organization @node {
                dbId: ID! @id @unique @relayId @alias(property: "id")
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
        const query = /* GraphQL */ `
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
            "MATCH (this0:ArtPiece)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:SOLD_AT_AUCTION_AS]->(this2:AuctionItem)
                    CALL {
                        WITH this2
                        MATCH (this2)<-[this3:BOUGHT_ITEM_AT_AUCTION]-(this4:Organization)
                        WITH this4 { .name, dbId: this4.id } AS this4
                        RETURN head(collect(this4)) AS var5
                    }
                    WITH this2 { .auctionName, .lotNumber, dbId: this2.id, buyer: var5 } AS this2
                    RETURN head(collect(this2)) AS var6
                }
                CALL {
                    WITH this0
                    MATCH (this0)-[this7:OWNED_BY]->(this8:Organization)
                    WITH this8 { .name, dbId: this8.id } AS this8
                    RETURN head(collect(this8)) AS var9
                }
                RETURN collect({ node: { dbId: this0.id, title: this0.title, auction: var6, owner: var9, __resolveType: \\"ArtPiece\\" } }) AS var10
            }
            RETURN { edges: var10, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
