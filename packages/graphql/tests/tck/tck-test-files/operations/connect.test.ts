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
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher Connect", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Product {
                id: ID!
                name: String
                sizes: [Size] @relationship(type: "HAS_SIZE", direction: OUT)
                colors: [Color] @relationship(type: "HAS_COLOR", direction: OUT)
                photos: [Photo] @relationship(type: "HAS_PHOTO", direction: OUT)
            }

            type Size {
                id: ID!
                name: String!
            }

            type Color {
                id: ID!
                name: String!
                photos: [Photo] @relationship(type: "OF_COLOR", direction: IN)
            }

            type Photo {
                id: ID!
                description: String!
                url: String!
                color: Color @relationship(type: "OF_COLOR", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
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
            WITH this0, [ metaVal IN [{type: 'Created', name: 'Product', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL {
            WITH this0, this0_mutateMeta
            	OPTIONAL MATCH (this0_colors_connect0_node:Color)
            	WHERE this0_colors_connect0_node.name = $this0_colors_connect0_node_name
            CALL apoc.do.when(this0_colors_connect0_node IS NOT NULL AND this0 IS NOT NULL, \\"
            			MERGE (this0)-[:HAS_COLOR]->(this0_colors_connect0_node)
            RETURN this0, this0_colors_connect0_node, [ metaVal IN [{type: 'Connected', name: 'Product', relationshipName: 'HAS_COLOR', toName: 'Color', id: id(this0), toID: id(this0_colors_connect0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_colors_connect0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_colors_connect0_node:this0_colors_connect0_node})
            YIELD value
            WITH this0, this0_colors_connect0_node, value.this0_colors_connect0_node_mutateMeta as this0_colors_connect_mutateMeta
            WITH this0, this0_colors_connect0_node, this0_colors_connect_mutateMeta
            CALL {
            WITH this0, this0_colors_connect0_node, this0_colors_connect_mutateMeta
            	OPTIONAL MATCH (this0_colors_connect0_node_photos0_node:Photo)
            	WHERE this0_colors_connect0_node_photos0_node.id = $this0_colors_connect0_node_photos0_node_id
            CALL apoc.do.when(this0_colors_connect0_node_photos0_node IS NOT NULL AND this0_colors_connect0_node IS NOT NULL, \\"
            			MERGE (this0_colors_connect0_node)<-[:OF_COLOR]-(this0_colors_connect0_node_photos0_node)
            RETURN this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node, [ metaVal IN [{type: 'Connected', name: 'Color', relationshipName: 'OF_COLOR', toName: 'Photo', id: id(this0_colors_connect0_node), toID: id(this0_colors_connect0_node_photos0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_colors_connect0_node_photos0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_colors_connect0_node:this0_colors_connect0_node, this0_colors_connect0_node_photos0_node:this0_colors_connect0_node_photos0_node})
            YIELD value
            WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node, value.this0_colors_connect0_node_photos0_node_mutateMeta as this0_colors_connect0_node_photos_mutateMeta
            WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node, this0_colors_connect0_node_photos_mutateMeta
            CALL {
            WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node, this0_colors_connect0_node_photos_mutateMeta
            	OPTIONAL MATCH (this0_colors_connect0_node_photos0_node_color0_node:Color)
            	WHERE this0_colors_connect0_node_photos0_node_color0_node.id = $this0_colors_connect0_node_photos0_node_color0_node_id
            CALL apoc.do.when(this0_colors_connect0_node_photos0_node_color0_node IS NOT NULL AND this0_colors_connect0_node_photos0_node IS NOT NULL, \\"
            			MERGE (this0_colors_connect0_node_photos0_node)-[:OF_COLOR]->(this0_colors_connect0_node_photos0_node_color0_node)
            RETURN this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node, this0_colors_connect0_node_photos0_node_color0_node, [ metaVal IN [{type: 'Connected', name: 'Photo', relationshipName: 'OF_COLOR', toName: 'Color', id: id(this0_colors_connect0_node_photos0_node), toID: id(this0_colors_connect0_node_photos0_node_color0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_colors_connect0_node_photos0_node_color0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_colors_connect0_node:this0_colors_connect0_node, this0_colors_connect0_node_photos0_node:this0_colors_connect0_node_photos0_node, this0_colors_connect0_node_photos0_node_color0_node:this0_colors_connect0_node_photos0_node_color0_node})
            YIELD value
            WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node, this0_colors_connect0_node_photos0_node_color0_node, value.this0_colors_connect0_node_photos0_node_color0_node_mutateMeta as this0_colors_connect0_node_photos0_node_color_mutateMeta
            RETURN REDUCE(tmp1_this0_colors_connect0_node_photos0_node_color_mutateMeta = [], tmp2_this0_colors_connect0_node_photos0_node_color_mutateMeta IN COLLECT(this0_colors_connect0_node_photos0_node_color_mutateMeta) | tmp1_this0_colors_connect0_node_photos0_node_color_mutateMeta + tmp2_this0_colors_connect0_node_photos0_node_color_mutateMeta) as this0_colors_connect0_node_photos0_node_color_mutateMeta
            }
            WITH this0, this0_colors_connect0_node, this0_colors_connect0_node_photos0_node, this0_colors_connect0_node_photos_mutateMeta + this0_colors_connect0_node_photos0_node_color_mutateMeta as this0_colors_connect0_node_photos_mutateMeta
            RETURN REDUCE(tmp1_this0_colors_connect0_node_photos_mutateMeta = [], tmp2_this0_colors_connect0_node_photos_mutateMeta IN COLLECT(this0_colors_connect0_node_photos_mutateMeta) | tmp1_this0_colors_connect0_node_photos_mutateMeta + tmp2_this0_colors_connect0_node_photos_mutateMeta) as this0_colors_connect0_node_photos_mutateMeta
            }
            WITH this0, this0_colors_connect0_node, this0_colors_connect_mutateMeta + this0_colors_connect0_node_photos_mutateMeta as this0_colors_connect_mutateMeta
            RETURN REDUCE(tmp1_this0_colors_connect_mutateMeta = [], tmp2_this0_colors_connect_mutateMeta IN COLLECT(this0_colors_connect_mutateMeta) | tmp1_this0_colors_connect_mutateMeta + tmp2_this0_colors_connect_mutateMeta) as this0_colors_connect_mutateMeta
            }
            WITH this0, this0_mutateMeta + this0_colors_connect_mutateMeta as this0_mutateMeta
            WITH this0, this0_mutateMeta
            CALL {
            WITH this0, this0_mutateMeta
            	OPTIONAL MATCH (this0_photos_connect0_node:Photo)
            	WHERE this0_photos_connect0_node.id = $this0_photos_connect0_node_id
            CALL apoc.do.when(this0_photos_connect0_node IS NOT NULL AND this0 IS NOT NULL, \\"
            			MERGE (this0)-[:HAS_PHOTO]->(this0_photos_connect0_node)
            RETURN this0, this0_photos_connect0_node, [ metaVal IN [{type: 'Connected', name: 'Product', relationshipName: 'HAS_PHOTO', toName: 'Photo', id: id(this0), toID: id(this0_photos_connect0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_photos_connect0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_photos_connect0_node:this0_photos_connect0_node})
            YIELD value
            WITH this0, this0_photos_connect0_node, value.this0_photos_connect0_node_mutateMeta as this0_photos_connect_mutateMeta
            WITH this0, this0_photos_connect0_node, this0_photos_connect_mutateMeta
            CALL {
            WITH this0, this0_photos_connect0_node, this0_photos_connect_mutateMeta
            	OPTIONAL MATCH (this0_photos_connect0_node_color0_node:Color)
            	WHERE this0_photos_connect0_node_color0_node.name = $this0_photos_connect0_node_color0_node_name
            CALL apoc.do.when(this0_photos_connect0_node_color0_node IS NOT NULL AND this0_photos_connect0_node IS NOT NULL, \\"
            			MERGE (this0_photos_connect0_node)-[:OF_COLOR]->(this0_photos_connect0_node_color0_node)
            RETURN this0, this0_photos_connect0_node, this0_photos_connect0_node_color0_node, [ metaVal IN [{type: 'Connected', name: 'Photo', relationshipName: 'OF_COLOR', toName: 'Color', id: id(this0_photos_connect0_node), toID: id(this0_photos_connect0_node_color0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_photos_connect0_node_color0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_photos_connect0_node:this0_photos_connect0_node, this0_photos_connect0_node_color0_node:this0_photos_connect0_node_color0_node})
            YIELD value
            WITH this0, this0_photos_connect0_node, this0_photos_connect0_node_color0_node, value.this0_photos_connect0_node_color0_node_mutateMeta as this0_photos_connect0_node_color_mutateMeta
            RETURN REDUCE(tmp1_this0_photos_connect0_node_color_mutateMeta = [], tmp2_this0_photos_connect0_node_color_mutateMeta IN COLLECT(this0_photos_connect0_node_color_mutateMeta) | tmp1_this0_photos_connect0_node_color_mutateMeta + tmp2_this0_photos_connect0_node_color_mutateMeta) as this0_photos_connect0_node_color_mutateMeta
            }
            WITH this0, this0_photos_connect0_node, this0_photos_connect_mutateMeta + this0_photos_connect0_node_color_mutateMeta as this0_photos_connect_mutateMeta
            RETURN REDUCE(tmp1_this0_photos_connect_mutateMeta = [], tmp2_this0_photos_connect_mutateMeta IN COLLECT(this0_photos_connect_mutateMeta) | tmp1_this0_photos_connect_mutateMeta + tmp2_this0_photos_connect_mutateMeta) as this0_photos_connect_mutateMeta
            }
            WITH this0, this0_mutateMeta + this0_photos_connect_mutateMeta as this0_mutateMeta
            WITH this0, this0_mutateMeta
            CALL {
            WITH this0, this0_mutateMeta
            	OPTIONAL MATCH (this0_photos_connect1_node:Photo)
            	WHERE this0_photos_connect1_node.id = $this0_photos_connect1_node_id
            CALL apoc.do.when(this0_photos_connect1_node IS NOT NULL AND this0 IS NOT NULL, \\"
            			MERGE (this0)-[:HAS_PHOTO]->(this0_photos_connect1_node)
            RETURN this0, this0_photos_connect1_node, [ metaVal IN [{type: 'Connected', name: 'Product', relationshipName: 'HAS_PHOTO', toName: 'Photo', id: id(this0), toID: id(this0_photos_connect1_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_photos_connect1_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_photos_connect1_node:this0_photos_connect1_node})
            YIELD value
            WITH this0, this0_photos_connect1_node, value.this0_photos_connect1_node_mutateMeta as this0_photos_connect_mutateMeta
            WITH this0, this0_photos_connect1_node, this0_photos_connect_mutateMeta
            CALL {
            WITH this0, this0_photos_connect1_node, this0_photos_connect_mutateMeta
            	OPTIONAL MATCH (this0_photos_connect1_node_color0_node:Color)
            	WHERE this0_photos_connect1_node_color0_node.name = $this0_photos_connect1_node_color0_node_name
            CALL apoc.do.when(this0_photos_connect1_node_color0_node IS NOT NULL AND this0_photos_connect1_node IS NOT NULL, \\"
            			MERGE (this0_photos_connect1_node)-[:OF_COLOR]->(this0_photos_connect1_node_color0_node)
            RETURN this0, this0_photos_connect1_node, this0_photos_connect1_node_color0_node, [ metaVal IN [{type: 'Connected', name: 'Photo', relationshipName: 'OF_COLOR', toName: 'Color', id: id(this0_photos_connect1_node), toID: id(this0_photos_connect1_node_color0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_photos_connect1_node_color0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_photos_connect1_node:this0_photos_connect1_node, this0_photos_connect1_node_color0_node:this0_photos_connect1_node_color0_node})
            YIELD value
            WITH this0, this0_photos_connect1_node, this0_photos_connect1_node_color0_node, value.this0_photos_connect1_node_color0_node_mutateMeta as this0_photos_connect1_node_color_mutateMeta
            RETURN REDUCE(tmp1_this0_photos_connect1_node_color_mutateMeta = [], tmp2_this0_photos_connect1_node_color_mutateMeta IN COLLECT(this0_photos_connect1_node_color_mutateMeta) | tmp1_this0_photos_connect1_node_color_mutateMeta + tmp2_this0_photos_connect1_node_color_mutateMeta) as this0_photos_connect1_node_color_mutateMeta
            }
            WITH this0, this0_photos_connect1_node, this0_photos_connect_mutateMeta + this0_photos_connect1_node_color_mutateMeta as this0_photos_connect_mutateMeta
            RETURN REDUCE(tmp1_this0_photos_connect_mutateMeta = [], tmp2_this0_photos_connect_mutateMeta IN COLLECT(this0_photos_connect_mutateMeta) | tmp1_this0_photos_connect_mutateMeta + tmp2_this0_photos_connect_mutateMeta) as this0_photos_connect_mutateMeta
            }
            WITH this0, this0_mutateMeta + this0_photos_connect_mutateMeta as this0_mutateMeta
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"123\\",
                \\"this0_name\\": \\"Nested Connect\\",
                \\"this0_colors_connect0_node_name\\": \\"Red\\",
                \\"this0_colors_connect0_node_photos0_node_id\\": \\"123\\",
                \\"this0_colors_connect0_node_photos0_node_color0_node_id\\": \\"134\\",
                \\"this0_photos_connect0_node_id\\": \\"321\\",
                \\"this0_photos_connect0_node_color0_node_name\\": \\"Green\\",
                \\"this0_photos_connect1_node_id\\": \\"33211\\",
                \\"this0_photos_connect1_node_color0_node_name\\": \\"Red\\"
            }"
        `);
    });
});
