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

describe("https://github.com/neo4j/graphql/issues/4532", () => {
    test("connections to interfaces with sort", async () => {
        const typeDefs = /* GraphQL */ `
            type Inventory @node {
                id: ID
                children: [Scenario!]!
                    @relationship(type: "HasChildren", properties: "InventoryChildRelation", direction: OUT)
            }

            interface Scenario {
                id: ID
            }

            type Image implements Scenario @node {
                id: ID
            }

            type Video implements Scenario @node {
                id: ID
            }

            type InventoryChildRelation @relationshipProperties {
                order: Int
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = /* GraphQL */ `
            query {
                inventories {
                    id
                    childrenConnection(sort: { edge: { order: ASC } }) {
                        edges {
                            properties {
                                order
                            }
                            node {
                                id
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Inventory)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:HasChildren]->(this1:Image)
                    WITH { properties: { order: this0.order, __resolveType: \\"InventoryChildRelation\\" }, node: { __resolveType: \\"Image\\", __id: id(this1), id: this1.id } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this2:HasChildren]->(this3:Video)
                    WITH { properties: { order: this2.order, __resolveType: \\"InventoryChildRelation\\" }, node: { __resolveType: \\"Video\\", __id: id(this3), id: this3.id } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge
                    ORDER BY edge.properties.order ASC
                    RETURN collect(edge) AS var4
                }
                RETURN { edges: var4, totalCount: totalCount } AS var5
            }
            RETURN this { .id, childrenConnection: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
