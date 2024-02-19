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

import gql from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/3394", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = `#graphql
        type Employee {
            products: [Product!]! @relationship(type: "CAN_ACCESS", direction: OUT)
        }

        type Product {
            id: String! @alias(property: "fg_item_id")
            description: String!
            partNumber: ID! @alias(property: "fg_item")
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should sort by aliased field", async () => {
        const query = /* GraphQL */ `
            query listProducts {
                products(options: { sort: { partNumber: DESC } }) {
                    id
                    partNumber
                    description
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Product)
            WITH *
            ORDER BY this.fg_item DESC
            RETURN this { .description, id: this.fg_item_id, partNumber: this.fg_item } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("should sort by aliased field in relationship", async () => {
        const query = /* GraphQL */ `
            query listProducts {
                employees {
                    products(options: { sort: { partNumber: DESC } }) {
                        id
                        partNumber
                        description
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Employee)
            CALL {
                WITH this
                MATCH (this)-[this0:CAN_ACCESS]->(this1:Product)
                WITH this1 { .description, id: this1.fg_item_id, partNumber: this1.fg_item } AS this1
                ORDER BY this1.partNumber DESC
                RETURN collect(this1) AS var2
            }
            RETURN this { products: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
    describe("Connection sort", () => {
        test("should sort by aliased field in connection", async () => {
            const query = /* GraphQL */ `
                query listProducts {
                    productsConnection(sort: { partNumber: DESC }) {
                        edges {
                            node {
                                id
                                partNumber
                                description
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this0:Product)
                WITH collect({ node: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this0
                    WITH *
                    ORDER BY this0.fg_item DESC
                    RETURN collect({ node: { id: this0.fg_item_id, partNumber: this0.fg_item, description: this0.description, __resolveType: \\"Product\\" } }) AS var1
                }
                RETURN { edges: var1, totalCount: totalCount } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("should sort by aliased field in nested connection", async () => {
            const query = /* GraphQL */ `
                query listProducts {
                    employees {
                        productsConnection(sort: { node: { partNumber: DESC } }) {
                            edges {
                                node {
                                    id
                                    partNumber
                                    description
                                }
                            }
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Employee)
                CALL {
                    WITH this
                    MATCH (this)-[this0:CAN_ACCESS]->(this1:Product)
                    WITH collect({ node: this1, relationship: this0 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this1, edge.relationship AS this0
                        WITH *
                        ORDER BY this1.fg_item DESC
                        RETURN collect({ node: { id: this1.fg_item_id, partNumber: this1.fg_item, description: this1.description, __resolveType: \\"Product\\" } }) AS var2
                    }
                    RETURN { edges: var2, totalCount: totalCount } AS var3
                }
                RETURN this { productsConnection: var3 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });
});
