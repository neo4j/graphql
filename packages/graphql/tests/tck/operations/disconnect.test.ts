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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher Disconnect", () => {
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
        });
    });

    test("Recursive Disconnect", async () => {
        const query = gql`
            mutation {
                updateProducts(
                    update: {
                        id: "123"
                        name: "Nested Connect"
                        colors: {
                            disconnect: [
                                {
                                    where: { node: { name: "Red" } }
                                    disconnect: {
                                        photos: [
                                            {
                                                where: { node: { id: "123" } }
                                                disconnect: { color: { where: { node: { id: "134" } } } }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                        photos: {
                            disconnect: [
                                {
                                    where: { node: { id: "321" } }
                                    disconnect: { color: { where: { node: { name: "Green" } } } }
                                }
                                {
                                    where: { node: { id: "33211" } }
                                    disconnect: { color: { where: { node: { name: "Red" } } } }
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Product\`)
            SET this.id = $this_update_id
            SET this.name = $this_update_name
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_colors0_disconnect0_rel:\`HAS_COLOR\`]->(this_colors0_disconnect0:Color)
            WHERE this_colors0_disconnect0.name = $updateProducts_args_update_colors0_disconnect0_where_Color_this_colors0_disconnect0param0
            CALL {
            	WITH this_colors0_disconnect0, this_colors0_disconnect0_rel, this
            	WITH collect(this_colors0_disconnect0) as this_colors0_disconnect0, this_colors0_disconnect0_rel, this
            	UNWIND this_colors0_disconnect0 as x
            	DELETE this_colors0_disconnect0_rel
            }
            CALL {
            WITH this, this_colors0_disconnect0
            OPTIONAL MATCH (this_colors0_disconnect0)<-[this_colors0_disconnect0_photos0_rel:\`OF_COLOR\`]-(this_colors0_disconnect0_photos0:Photo)
            WHERE this_colors0_disconnect0_photos0.id = $updateProducts_args_update_colors0_disconnect0_disconnect_photos0_where_Photo_this_colors0_disconnect0_photos0param0
            CALL {
            	WITH this_colors0_disconnect0_photos0, this_colors0_disconnect0_photos0_rel, this_colors0_disconnect0
            	WITH collect(this_colors0_disconnect0_photos0) as this_colors0_disconnect0_photos0, this_colors0_disconnect0_photos0_rel, this_colors0_disconnect0
            	UNWIND this_colors0_disconnect0_photos0 as x
            	DELETE this_colors0_disconnect0_photos0_rel
            }
            CALL {
            WITH this, this_colors0_disconnect0, this_colors0_disconnect0_photos0
            OPTIONAL MATCH (this_colors0_disconnect0_photos0)-[this_colors0_disconnect0_photos0_color0_rel:\`OF_COLOR\`]->(this_colors0_disconnect0_photos0_color0:Color)
            WHERE this_colors0_disconnect0_photos0_color0.id = $updateProducts_args_update_colors0_disconnect0_disconnect_photos_disconnect_color_where_Color_this_colors0_disconnect0_photos0_color0param0
            CALL {
            	WITH this_colors0_disconnect0_photos0_color0, this_colors0_disconnect0_photos0_color0_rel, this_colors0_disconnect0_photos0
            	WITH collect(this_colors0_disconnect0_photos0_color0) as this_colors0_disconnect0_photos0_color0, this_colors0_disconnect0_photos0_color0_rel, this_colors0_disconnect0_photos0
            	UNWIND this_colors0_disconnect0_photos0_color0 as x
            	DELETE this_colors0_disconnect0_photos0_color0_rel
            }
            RETURN count(*) AS disconnect_this_colors0_disconnect0_photos0_color_Color
            }
            RETURN count(*) AS disconnect_this_colors0_disconnect0_photos_Photo
            }
            RETURN count(*) AS disconnect_this_colors0_disconnect_Color
            }
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_photos0_disconnect0_rel:\`HAS_PHOTO\`]->(this_photos0_disconnect0:Photo)
            WHERE this_photos0_disconnect0.id = $updateProducts_args_update_photos0_disconnect0_where_Photo_this_photos0_disconnect0param0
            CALL {
            	WITH this_photos0_disconnect0, this_photos0_disconnect0_rel, this
            	WITH collect(this_photos0_disconnect0) as this_photos0_disconnect0, this_photos0_disconnect0_rel, this
            	UNWIND this_photos0_disconnect0 as x
            	DELETE this_photos0_disconnect0_rel
            }
            CALL {
            WITH this, this_photos0_disconnect0
            OPTIONAL MATCH (this_photos0_disconnect0)-[this_photos0_disconnect0_color0_rel:\`OF_COLOR\`]->(this_photos0_disconnect0_color0:Color)
            WHERE this_photos0_disconnect0_color0.name = $updateProducts_args_update_photos0_disconnect_disconnect_color_where_Color_this_photos0_disconnect0_color0param0
            CALL {
            	WITH this_photos0_disconnect0_color0, this_photos0_disconnect0_color0_rel, this_photos0_disconnect0
            	WITH collect(this_photos0_disconnect0_color0) as this_photos0_disconnect0_color0, this_photos0_disconnect0_color0_rel, this_photos0_disconnect0
            	UNWIND this_photos0_disconnect0_color0 as x
            	DELETE this_photos0_disconnect0_color0_rel
            }
            RETURN count(*) AS disconnect_this_photos0_disconnect0_color_Color
            }
            RETURN count(*) AS disconnect_this_photos0_disconnect_Photo
            }
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_photos0_disconnect1_rel:\`HAS_PHOTO\`]->(this_photos0_disconnect1:Photo)
            WHERE this_photos0_disconnect1.id = $updateProducts_args_update_photos0_disconnect1_where_Photo_this_photos0_disconnect1param0
            CALL {
            	WITH this_photos0_disconnect1, this_photos0_disconnect1_rel, this
            	WITH collect(this_photos0_disconnect1) as this_photos0_disconnect1, this_photos0_disconnect1_rel, this
            	UNWIND this_photos0_disconnect1 as x
            	DELETE this_photos0_disconnect1_rel
            }
            CALL {
            WITH this, this_photos0_disconnect1
            OPTIONAL MATCH (this_photos0_disconnect1)-[this_photos0_disconnect1_color0_rel:\`OF_COLOR\`]->(this_photos0_disconnect1_color0:Color)
            WHERE this_photos0_disconnect1_color0.name = $updateProducts_args_update_photos0_disconnect_disconnect_color_where_Color_this_photos0_disconnect1_color0param0
            CALL {
            	WITH this_photos0_disconnect1_color0, this_photos0_disconnect1_color0_rel, this_photos0_disconnect1
            	WITH collect(this_photos0_disconnect1_color0) as this_photos0_disconnect1_color0, this_photos0_disconnect1_color0_rel, this_photos0_disconnect1
            	UNWIND this_photos0_disconnect1_color0 as x
            	DELETE this_photos0_disconnect1_color0_rel
            }
            RETURN count(*) AS disconnect_this_photos0_disconnect1_color_Color
            }
            RETURN count(*) AS disconnect_this_photos0_disconnect_Photo
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_id\\": \\"123\\",
                \\"this_update_name\\": \\"Nested Connect\\",
                \\"updateProducts_args_update_colors0_disconnect0_where_Color_this_colors0_disconnect0param0\\": \\"Red\\",
                \\"updateProducts_args_update_colors0_disconnect0_disconnect_photos0_where_Photo_this_colors0_disconnect0_photos0param0\\": \\"123\\",
                \\"updateProducts_args_update_colors0_disconnect0_disconnect_photos_disconnect_color_where_Color_this_colors0_disconnect0_photos0_color0param0\\": \\"134\\",
                \\"updateProducts_args_update_photos0_disconnect0_where_Photo_this_photos0_disconnect0param0\\": \\"321\\",
                \\"updateProducts_args_update_photos0_disconnect_disconnect_color_where_Color_this_photos0_disconnect0_color0param0\\": \\"Green\\",
                \\"updateProducts_args_update_photos0_disconnect1_where_Photo_this_photos0_disconnect1param0\\": \\"33211\\",
                \\"updateProducts_args_update_photos0_disconnect_disconnect_color_where_Color_this_photos0_disconnect1_color0param0\\": \\"Red\\",
                \\"updateProducts\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"id\\": \\"123\\",
                            \\"name\\": \\"Nested Connect\\",
                            \\"colors\\": [
                                {
                                    \\"disconnect\\": [
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"name\\": \\"Red\\"
                                                }
                                            },
                                            \\"disconnect\\": {
                                                \\"photos\\": [
                                                    {
                                                        \\"where\\": {
                                                            \\"node\\": {
                                                                \\"id\\": \\"123\\"
                                                            }
                                                        },
                                                        \\"disconnect\\": {
                                                            \\"color\\": {
                                                                \\"where\\": {
                                                                    \\"node\\": {
                                                                        \\"id\\": \\"134\\"
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                ]
                                            }
                                        }
                                    ]
                                }
                            ],
                            \\"photos\\": [
                                {
                                    \\"disconnect\\": [
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"id\\": \\"321\\"
                                                }
                                            },
                                            \\"disconnect\\": {
                                                \\"color\\": {
                                                    \\"where\\": {
                                                        \\"node\\": {
                                                            \\"name\\": \\"Green\\"
                                                        }
                                                    }
                                                }
                                            }
                                        },
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"id\\": \\"33211\\"
                                                }
                                            },
                                            \\"disconnect\\": {
                                                \\"color\\": {
                                                    \\"where\\": {
                                                        \\"node\\": {
                                                            \\"name\\": \\"Red\\"
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    ]
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
