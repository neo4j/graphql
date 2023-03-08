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
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher Connect", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Product {
                id: ID!
                name: String
                sizes: [Size!]! @relationship(type: "HAS_SIZE", direction: OUT)
                colors: [Color!]! @relationship(type: "HAS_COLOR", direction: OUT)
                photos: [Photo!]! @relationship(type: "HAS_PHOTO", direction: OUT)
            }

            type Size {
                id: ID!
                name: String!
            }

            type Color {
                id: ID!
                name: String!
                photos: [Photo!]! @relationship(type: "OF_COLOR", direction: IN)
            }

            type Photo {
                id: ID!
                description: String!
                url: String!
                color: Color! @relationship(type: "OF_COLOR", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Recursive Connect", async () => {
        const query = gql`
            mutation {
                createProducts(
                    input: [
                        {
                            id: "123"
                            name: "Nested Connect"
                            colors: {
                                connect: [
                                    {
                                        where: { node: { name: "Red" } }
                                        connect: {
                                            photos: [
                                                {
                                                    where: { node: { id: "123" } }
                                                    connect: { color: { where: { node: { id: "134" } } } }
                                                }
                                            ]
                                        }
                                    }
                                ]
                            }
                            photos: {
                                connect: [
                                    {
                                        where: { node: { id: "321" } }
                                        connect: { color: { where: { node: { name: "Green" } } } }
                                    }
                                    {
                                        where: { node: { id: "33211" } }
                                        connect: { color: { where: { node: { name: "Red" } } } }
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Product)
            SET this0.id = $this0_id
            SET this0.name = $this0_name
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_colors_connect0_node:Color)
            	WHERE this0_colors_connect0_node.name = $this0_colors_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_colors_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_colors_connect0_node
            			MERGE (this0)-[:HAS_COLOR]->(this0_colors_connect0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this0, this0_colors_connect0_node
            CALL {
            	WITH this0, this0_colors_connect0_node
            	OPTIONAL MATCH (this0_colors_connect0_node_photos0_node:Photo)
            	WHERE this0_colors_connect0_node_photos0_node.id = $this0_colors_connect0_node_photos0_node_param0
            	CALL {
            		WITH *
            		WITH this0, collect(this0_colors_connect0_node_photos0_node) as connectedNodes, collect(this0_colors_connect0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0_colors_connect0_node
            			UNWIND connectedNodes as this0_colors_connect0_node_photos0_node
            			MERGE (this0_colors_connect0_node)<-[:OF_COLOR]-(this0_colors_connect0_node_photos0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            	WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node
            CALL {
            	WITH this0_colors_connect0_node_photos0_node
            	MATCH (this0_colors_connect0_node_photos0_node)-[this0_colors_connect0_node_photos0_node_color_Color_unique:OF_COLOR]->(:Color)
            	WITH count(this0_colors_connect0_node_photos0_node_color_Color_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPhoto.color required exactly once', [0])
            	RETURN c AS this0_colors_connect0_node_photos0_node_color_Color_unique_ignored
            }
            WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node
            CALL {
            	WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node
            	OPTIONAL MATCH (this0_colors_connect0_node_photos0_node_color0_node:Color)
            	WHERE this0_colors_connect0_node_photos0_node_color0_node.id = $this0_colors_connect0_node_photos0_node_color0_node_param0
            	CALL {
            		WITH *
            		WITH this0, this0_colors_connect0_node, collect(this0_colors_connect0_node_photos0_node_color0_node) as connectedNodes, collect(this0_colors_connect0_node_photos0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0_colors_connect0_node_photos0_node
            			UNWIND connectedNodes as this0_colors_connect0_node_photos0_node_color0_node
            			MERGE (this0_colors_connect0_node_photos0_node)-[:OF_COLOR]->(this0_colors_connect0_node_photos0_node_color0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            	WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node, this0_colors_connect0_node_photos0_node_color0_node
            CALL {
            	WITH this0_colors_connect0_node_photos0_node
            	MATCH (this0_colors_connect0_node_photos0_node)-[this0_colors_connect0_node_photos0_node_color_Color_unique:OF_COLOR]->(:Color)
            	WITH count(this0_colors_connect0_node_photos0_node_color_Color_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPhoto.color required exactly once', [0])
            	RETURN c AS this0_colors_connect0_node_photos0_node_color_Color_unique_ignored
            }
            WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node, this0_colors_connect0_node_photos0_node_color0_node
            	RETURN count(*) AS connect_this0_colors_connect0_node_photos0_node_color_Color
            }
            	RETURN count(*) AS connect_this0_colors_connect0_node_photos_Photo
            }
            	RETURN count(*) AS connect_this0_colors_connect_Color
            }
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_photos_connect0_node:Photo)
            	WHERE this0_photos_connect0_node.id = $this0_photos_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_photos_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_photos_connect0_node
            			MERGE (this0)-[:HAS_PHOTO]->(this0_photos_connect0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this0, this0_photos_connect0_node
            CALL {
            	WITH this0, this0_photos_connect0_node
            	OPTIONAL MATCH (this0_photos_connect0_node_color0_node:Color)
            	WHERE this0_photos_connect0_node_color0_node.name = $this0_photos_connect0_node_color0_node_param0
            	CALL {
            		WITH *
            		WITH this0, collect(this0_photos_connect0_node_color0_node) as connectedNodes, collect(this0_photos_connect0_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0_photos_connect0_node
            			UNWIND connectedNodes as this0_photos_connect0_node_color0_node
            			MERGE (this0_photos_connect0_node)-[:OF_COLOR]->(this0_photos_connect0_node_color0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            	WITH this0, this0_photos_connect0_node, this0_photos_connect0_node_color0_node
            CALL {
            	WITH this0_photos_connect0_node
            	MATCH (this0_photos_connect0_node)-[this0_photos_connect0_node_color_Color_unique:OF_COLOR]->(:Color)
            	WITH count(this0_photos_connect0_node_color_Color_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPhoto.color required exactly once', [0])
            	RETURN c AS this0_photos_connect0_node_color_Color_unique_ignored
            }
            WITH this0, this0_photos_connect0_node, this0_photos_connect0_node_color0_node
            	RETURN count(*) AS connect_this0_photos_connect0_node_color_Color
            }
            	RETURN count(*) AS connect_this0_photos_connect_Photo
            }
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_photos_connect1_node:Photo)
            	WHERE this0_photos_connect1_node.id = $this0_photos_connect1_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_photos_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_photos_connect1_node
            			MERGE (this0)-[:HAS_PHOTO]->(this0_photos_connect1_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this0, this0_photos_connect1_node
            CALL {
            	WITH this0, this0_photos_connect1_node
            	OPTIONAL MATCH (this0_photos_connect1_node_color0_node:Color)
            	WHERE this0_photos_connect1_node_color0_node.name = $this0_photos_connect1_node_color0_node_param0
            	CALL {
            		WITH *
            		WITH this0, collect(this0_photos_connect1_node_color0_node) as connectedNodes, collect(this0_photos_connect1_node) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0_photos_connect1_node
            			UNWIND connectedNodes as this0_photos_connect1_node_color0_node
            			MERGE (this0_photos_connect1_node)-[:OF_COLOR]->(this0_photos_connect1_node_color0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            	WITH this0, this0_photos_connect1_node, this0_photos_connect1_node_color0_node
            CALL {
            	WITH this0_photos_connect1_node
            	MATCH (this0_photos_connect1_node)-[this0_photos_connect1_node_color_Color_unique:OF_COLOR]->(:Color)
            	WITH count(this0_photos_connect1_node_color_Color_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPhoto.color required exactly once', [0])
            	RETURN c AS this0_photos_connect1_node_color_Color_unique_ignored
            }
            WITH this0, this0_photos_connect1_node, this0_photos_connect1_node_color0_node
            	RETURN count(*) AS connect_this0_photos_connect1_node_color_Color
            }
            	RETURN count(*) AS connect_this0_photos_connect_Photo
            }
            RETURN this0
            }
            RETURN [ this0 { .id } ] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"123\\",
                \\"this0_name\\": \\"Nested Connect\\",
                \\"this0_colors_connect0_node_param0\\": \\"Red\\",
                \\"this0_colors_connect0_node_photos0_node_param0\\": \\"123\\",
                \\"this0_colors_connect0_node_photos0_node_color0_node_param0\\": \\"134\\",
                \\"this0_photos_connect0_node_param0\\": \\"321\\",
                \\"this0_photos_connect0_node_color0_node_param0\\": \\"Green\\",
                \\"this0_photos_connect1_node_param0\\": \\"33211\\",
                \\"this0_photos_connect1_node_color0_node_param0\\": \\"Red\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
