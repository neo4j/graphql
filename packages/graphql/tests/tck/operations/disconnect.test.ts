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

describe("Cypher Disconnect", () => {
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

    test("Recursive Disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateProducts(
                    update: {
                        id_SET: "123"
                        name_SET: "Nested Connect"
                        colors: {
                            disconnect: [
                                {
                                    where: { node: { name: { eq: "Red" } } }
                                    disconnect: {
                                        photos: [
                                            {
                                                where: { node: { id: { eq: "123" } } }
                                                disconnect: { color: { where: { node: { id: { eq: "134" } } } } }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                        photos: {
                            disconnect: [
                                {
                                    where: { node: { id: { eq: "321" } } }
                                    disconnect: { color: { where: { node: { name: { eq: "Green" } } } } }
                                }
                                {
                                    where: { node: { id: { eq: "33211" } } }
                                    disconnect: { color: { where: { node: { name: { eq: "Red" } } } } }
                                }
                            ]
                        }
                    }
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
            MATCH (this:Product)
            WITH *
            SET
                this.id = $param0,
                this.name = $param1
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)-[this0:HAS_COLOR]->(this1:Color)
                    WHERE this1.name = $param2
                    CALL (this1) {
                        CALL (this1) {
                            OPTIONAL MATCH (this1)<-[this2:OF_COLOR]-(this3:Photo)
                            WHERE this3.id = $param3
                            CALL (this3) {
                                CALL (this3) {
                                    OPTIONAL MATCH (this3)-[this4:OF_COLOR]->(this5:Color)
                                    WHERE this5.id = $param4
                                    WITH *
                                    DELETE this4
                                }
                            }
                            WITH *
                            DELETE this2
                        }
                    }
                    WITH *
                    DELETE this0
                }
            }
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)-[this6:HAS_PHOTO]->(this7:Photo)
                    WHERE this7.id = $param5
                    CALL (this7) {
                        CALL (this7) {
                            OPTIONAL MATCH (this7)-[this8:OF_COLOR]->(this9:Color)
                            WHERE this9.name = $param6
                            WITH *
                            DELETE this8
                        }
                    }
                    WITH *
                    DELETE this6
                }
            }
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)-[this10:HAS_PHOTO]->(this11:Photo)
                    WHERE this11.id = $param7
                    CALL (this11) {
                        CALL (this11) {
                            OPTIONAL MATCH (this11)-[this12:OF_COLOR]->(this13:Color)
                            WHERE this13.name = $param8
                            WITH *
                            DELETE this12
                        }
                    }
                    WITH *
                    DELETE this10
                }
            }
            WITH this
            RETURN this { .id } AS this"
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
