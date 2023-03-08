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

describe("https://github.com/neo4j/graphql/issues/1348", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Product {
                productTitle: String!
                releatsTo: [Product!]!
            }

            type Series implements Product {
                productTitle: String!
                releatsTo: [Product!]!
                    @relationship(type: "RELATES_TO", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)

                seasons: [Season!]!
            }

            type Season implements Product {
                productTitle: String!
                releatsTo: [Product!]!
                    @relationship(type: "RELATES_TO", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)

                seasonNumber: Int
                episodes: [ProgrammeItem!]!
            }

            type ProgrammeItem implements Product {
                productTitle: String!
                releatsTo: [Product!]!
                    @relationship(type: "RELATES_TO", direction: OUT, queryDirection: DEFAULT_UNDIRECTED)

                episodeNumber: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should also return node with no relationship in result set", async () => {
        const query = gql`
            query {
                programmeItems {
                    productTitle
                    episodeNumber
                    releatsTo {
                        __typename
                        productTitle
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`ProgrammeItem\`)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:RELATES_TO]-(this1:\`Series\`)
                    WITH this1 { __resolveType: \\"Series\\", __id: id(this), .productTitle } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:RELATES_TO]-(this4:\`Season\`)
                    WITH this4 { __resolveType: \\"Season\\", __id: id(this), .productTitle } AS this4
                    RETURN this4 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this5:RELATES_TO]-(this6:\`ProgrammeItem\`)
                    WITH this6 { __resolveType: \\"ProgrammeItem\\", __id: id(this), .productTitle } AS this6
                    RETURN this6 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { .productTitle, .episodeNumber, releatsTo: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should return node with no relationship (edge) in result set, as Relay connection", async () => {
        const query = gql`
            query {
                programmeItems {
                    productTitle
                    episodeNumber
                    releatsToConnection {
                        edges {
                            node {
                                ... on ProgrammeItem {
                                    productTitle
                                }
                                ... on Season {
                                    productTitle
                                }
                                ... on Series {
                                    productTitle
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`ProgrammeItem\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:RELATES_TO]-(this1:\`Series\`)
                    WITH { node: { __resolveType: \\"Series\\", __id: id(this1), productTitle: this1.productTitle } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:RELATES_TO]-(this3:\`Season\`)
                    WITH { node: { __resolveType: \\"Season\\", __id: id(this3), productTitle: this3.productTitle } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this4:RELATES_TO]-(this5:\`ProgrammeItem\`)
                    WITH { node: { __resolveType: \\"ProgrammeItem\\", __id: id(this5), productTitle: this5.productTitle } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var6
            }
            RETURN this { .productTitle, .episodeNumber, releatsToConnection: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
