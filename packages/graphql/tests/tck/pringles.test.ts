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

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Cypher Create Pringles", () => {
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

    test("Create Pringles", async () => {
        const query = /* GraphQL */ `
            mutation {
                createProducts(
                    input: [
                        {
                            id: 1
                            name: "Pringles"
                            sizes: {
                                create: [{ node: { id: 103, name: "Small" } }, { node: { id: 104, name: "Large" } }]
                            }
                            colors: {
                                create: [{ node: { id: 100, name: "Red" } }, { node: { id: 102, name: "Green" } }]
                            }
                            photos: {
                                create: [
                                    { node: { id: 105, description: "Outdoor photo", url: "outdoor.png" } }
                                    {
                                        node: {
                                            id: 106
                                            description: "Green photo"
                                            url: "g.png"
                                            color: { connect: { where: { node: { id: { eq: "102" } } } } }
                                        }
                                    }
                                    {
                                        node: {
                                            id: 107
                                            description: "Red photo"
                                            url: "r.png"
                                            color: { connect: { where: { node: { id: { eq: "100" } } } } }
                                        }
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
                CREATE (this1:Size)
                MERGE (this0)-[this2:HAS_SIZE]->(this1)
                SET
                    this1.id = $param2,
                    this1.name = $param3
                WITH *
                CREATE (this3:Size)
                MERGE (this0)-[this4:HAS_SIZE]->(this3)
                SET
                    this3.id = $param4,
                    this3.name = $param5
                WITH *
                CREATE (this5:Color)
                MERGE (this0)-[this6:HAS_COLOR]->(this5)
                SET
                    this5.id = $param6,
                    this5.name = $param7
                WITH *
                CREATE (this7:Color)
                MERGE (this0)-[this8:HAS_COLOR]->(this7)
                SET
                    this7.id = $param8,
                    this7.name = $param9
                WITH *
                CREATE (this9:Photo)
                MERGE (this0)-[this10:HAS_PHOTO]->(this9)
                SET
                    this9.id = $param10,
                    this9.description = $param11,
                    this9.url = $param12
                WITH *
                CREATE (this11:Photo)
                WITH *
                CALL (this11) {
                    MATCH (this12:Color)
                    WHERE this12.id = $param13
                    CREATE (this11)-[this13:OF_COLOR]->(this12)
                }
                MERGE (this0)-[this14:HAS_PHOTO]->(this11)
                SET
                    this11.id = $param14,
                    this11.description = $param15,
                    this11.url = $param16
                WITH *
                CREATE (this15:Photo)
                WITH *
                CALL (this15) {
                    MATCH (this16:Color)
                    WHERE this16.id = $param17
                    CREATE (this15)-[this17:OF_COLOR]->(this16)
                }
                MERGE (this0)-[this18:HAS_PHOTO]->(this15)
                SET
                    this15.id = $param18,
                    this15.description = $param19,
                    this15.url = $param20
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var19
            }
            RETURN collect(var19) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"Pringles\\",
                \\"param2\\": \\"103\\",
                \\"param3\\": \\"Small\\",
                \\"param4\\": \\"104\\",
                \\"param5\\": \\"Large\\",
                \\"param6\\": \\"100\\",
                \\"param7\\": \\"Red\\",
                \\"param8\\": \\"102\\",
                \\"param9\\": \\"Green\\",
                \\"param10\\": \\"105\\",
                \\"param11\\": \\"Outdoor photo\\",
                \\"param12\\": \\"outdoor.png\\",
                \\"param13\\": \\"102\\",
                \\"param14\\": \\"106\\",
                \\"param15\\": \\"Green photo\\",
                \\"param16\\": \\"g.png\\",
                \\"param17\\": \\"100\\",
                \\"param18\\": \\"107\\",
                \\"param19\\": \\"Red photo\\",
                \\"param20\\": \\"r.png\\"
            }"
        `);
    });

    test("Update Pringles Color", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateProducts(
                    where: { name: { eq: "Pringles" } }
                    update: {
                        photos: [
                            {
                                update: {
                                    where: { node: { description: { eq: "Green Photo" } } }
                                    node: {
                                        description_SET: "Light Green Photo"
                                        color: {
                                            connect: { where: { node: { name: { eq: "Light Green" } } } }
                                            disconnect: { where: { node: { name: { eq: "Green" } } } }
                                        }
                                    }
                                }
                            }
                        ]
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
            WHERE this.name = $param0
            WITH this
            CALL(*) {
            	WITH this
            	MATCH (this)-[this_has_photo0_relationship:HAS_PHOTO]->(this_photos0:Photo)
            	WHERE this_photos0.description = $updateProducts_args_update_photos0_where_this_photos0param0
            	SET this_photos0.description = $this_update_photos0_description_SET
            	WITH this, this_photos0
            	CALL(*) {
            	WITH this, this_photos0
            	OPTIONAL MATCH (this_photos0)-[this_photos0_color0_disconnect0_rel:OF_COLOR]->(this_photos0_color0_disconnect0:Color)
            	WHERE this_photos0_color0_disconnect0.name = $updateProducts_args_update_photos0_update_node_color0_disconnect0_where_Color_this_photos0_color0_disconnect0param0
            	CALL (this_photos0_color0_disconnect0, this_photos0_color0_disconnect0_rel, this_photos0) {
            		WITH collect(this_photos0_color0_disconnect0) as this_photos0_color0_disconnect0_x, this_photos0_color0_disconnect0_rel, this_photos0
            		UNWIND this_photos0_color0_disconnect0_x as x
            		DELETE this_photos0_color0_disconnect0_rel
            	}
            	RETURN count(*) AS disconnect_this_photos0_color0_disconnect_Color
            	}
            	WITH *
            	CALL(*) {
            		WITH this, this_photos0
            		OPTIONAL MATCH (this_photos0_color0_connect0_node:Color)
            		WHERE this_photos0_color0_connect0_node.name = $this_photos0_color0_connect0_node_param0
            		CALL(*) {
            			WITH this, collect(this_photos0_color0_connect0_node) as connectedNodes, collect(this_photos0) as parentNodes
            			CALL(connectedNodes, parentNodes) {
            				UNWIND parentNodes as this_photos0
            				UNWIND connectedNodes as this_photos0_color0_connect0_node
            				CREATE (this_photos0)-[:OF_COLOR]->(this_photos0_color0_connect0_node)
            			}
            		}
            	WITH this, this_photos0, this_photos0_color0_connect0_node
            		RETURN count(*) AS connect_this_photos0_color0_connect_Color0
            	}
            	RETURN count(*) AS update_this_photos0
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Pringles\\",
                \\"updateProducts_args_update_photos0_where_this_photos0param0\\": \\"Green Photo\\",
                \\"this_update_photos0_description_SET\\": \\"Light Green Photo\\",
                \\"updateProducts_args_update_photos0_update_node_color0_disconnect0_where_Color_this_photos0_color0_disconnect0param0\\": \\"Green\\",
                \\"this_photos0_color0_connect0_node_param0\\": \\"Light Green\\",
                \\"updateProducts\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"photos\\": [
                                {
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"description_SET\\": \\"Light Green Photo\\",
                                            \\"color\\": [
                                                {
                                                    \\"connect\\": [
                                                        {
                                                            \\"where\\": {
                                                                \\"node\\": {
                                                                    \\"name\\": {
                                                                        \\"eq\\": \\"Light Green\\"
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    ],
                                                    \\"disconnect\\": [
                                                        {
                                                            \\"where\\": {
                                                                \\"node\\": {
                                                                    \\"name\\": {
                                                                        \\"eq\\": \\"Green\\"
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        },
                                        \\"where\\": {
                                            \\"node\\": {
                                                \\"description\\": {
                                                    \\"eq\\": \\"Green Photo\\"
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
