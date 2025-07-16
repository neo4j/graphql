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

describe("Cypher Connect", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Product @node {
                id: ID!
                name: String
                sizes: [Size!]! @relationship(type: "HAS_SIZE", direction: OUT)
                colors: [Color!]! @relationship(type: "HAS_COLOR", direction: OUT)
                photos: [Photo!]! @relationship(type: "HAS_PHOTO", direction: OUT)
            }

            type Size @node {
                id: ID!
                name: String!
            }

            type Color @node {
                id: ID!
                name: String!
                photos: [Photo!]! @relationship(type: "OF_COLOR", direction: IN)
            }

            type Photo @node {
                id: ID!
                description: String!
                url: String!
                color: [Color!]! @relationship(type: "OF_COLOR", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Recursive Connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                createProducts(
                    input: [
                        {
                            id: "123"
                            name: "Nested Connect"
                            colors: {
                                connect: [
                                    {
                                        where: { node: { name: { eq: "Red" } } }
                                        connect: {
                                            photos: [
                                                {
                                                    where: { node: { id: { eq: "123" } } }
                                                    connect: { color: { where: { node: { id: { eq: "134" } } } } }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                            photos: {
                                connect: [
                                    {
                                        where: { node: { id: { eq: "321" } } }
                                        connect: { color: { where: { node: { name: { eq: "Green" } } } } }
                                    }
                                    {
                                        where: { node: { id: { eq: "33211" } } }
                                        connect: { color: { where: { node: { name: { eq: "Red" } } } } }
                                    }
                                ]
                            }
                        }
                    ]
                ) {
                    products {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Product)
                SET
                    this0.id = $param0,
                    this0.name = $param1
                WITH *
                CALL (this0) {
                    MATCH (this1:Color)
                    WHERE this1.name = $param2
                    CALL (this1) {
                        MATCH (this2:Photo)
                        WHERE this2.id = $param3
                        CALL (this2) {
                            MATCH (this3:Color)
                            WHERE this3.id = $param4
                            CREATE (this2)-[this4:OF_COLOR]->(this3)
                        }
                        CREATE (this1)<-[this5:OF_COLOR]-(this2)
                    }
                    CREATE (this0)-[this6:HAS_COLOR]->(this1)
                }
                WITH *
                CALL (this0) {
                    MATCH (this7:Photo)
                    WHERE this7.id = $param5
                    CALL (this7) {
                        MATCH (this8:Color)
                        WHERE this8.name = $param6
                        CREATE (this7)-[this9:OF_COLOR]->(this8)
                    }
                    CREATE (this0)-[this10:HAS_PHOTO]->(this7)
                }
                WITH *
                CALL (this0) {
                    MATCH (this11:Photo)
                    WHERE this11.id = $param7
                    CALL (this11) {
                        MATCH (this12:Color)
                        WHERE this12.name = $param8
                        CREATE (this11)-[this13:OF_COLOR]->(this12)
                    }
                    CREATE (this0)-[this14:HAS_PHOTO]->(this11)
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var15
            }
            RETURN collect(var15) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"param1\\": \\"Nested Connect\\",
                \\"param2\\": \\"Red\\",
                \\"param3\\": \\"123\\",
                \\"param4\\": \\"134\\",
                \\"param5\\": \\"321\\",
                \\"param6\\": \\"Green\\",
                \\"param7\\": \\"33211\\",
                \\"param8\\": \\"Red\\"
            }"
        `);
    });
});
