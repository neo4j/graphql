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

describe("Cypher Disconnect", () => {
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
            "MATCH (this:Product)
            SET this.id = $this_update_id
            SET this.name = $this_update_name
            WITH this
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_colors0_disconnect0_rel:HAS_COLOR]->(this_colors0_disconnect0:Color)
            WHERE this_colors0_disconnect0.name = $updateProducts.args.update.colors[0].disconnect[0].where.node.name
            WITH this, this_colors0_disconnect0, this_colors0_disconnect0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Product', toName: 'Color', relationshipName: 'HAS_COLOR', id: id(this), toID: id(this_colors0_disconnect0), relationshipID: id(this_colors0_disconnect0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_mutateMeta
            FOREACH(_ IN CASE this_colors0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_colors0_disconnect0_rel
            )
            WITH this, this_colors0_disconnect0, this_colors0_disconnect0_rel, this_mutateMeta
            CALL {
            WITH this, this_colors0_disconnect0, this_colors0_disconnect0_rel
            OPTIONAL MATCH (this_colors0_disconnect0)<-[this_colors0_disconnect0_photos0_rel:OF_COLOR]-(this_colors0_disconnect0_photos0:Photo)
            WHERE this_colors0_disconnect0_photos0.id = $updateProducts.args.update.colors[0].disconnect[0].disconnect.photos[0].where.node.id
            WITH this, this_colors0_disconnect0, this_colors0_disconnect0_rel, this_colors0_disconnect0_photos0, this_colors0_disconnect0_photos0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Color', toName: 'Photo', relationshipName: 'OF_COLOR', id: id(this_colors0_disconnect0), toID: id(this_colors0_disconnect0_photos0), relationshipID: id(this_colors0_disconnect0_photos0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_colors0_disconnect0_mutateMeta
            FOREACH(_ IN CASE this_colors0_disconnect0_photos0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_colors0_disconnect0_photos0_rel
            )
            WITH this, this_colors0_disconnect0, this_colors0_disconnect0_rel, this_colors0_disconnect0_photos0, this_colors0_disconnect0_photos0_rel, this_colors0_disconnect0_mutateMeta
            CALL {
            WITH this, this_colors0_disconnect0, this_colors0_disconnect0_rel, this_colors0_disconnect0_photos0, this_colors0_disconnect0_photos0_rel
            OPTIONAL MATCH (this_colors0_disconnect0_photos0)-[this_colors0_disconnect0_photos0_color0_rel:OF_COLOR]->(this_colors0_disconnect0_photos0_color0:Color)
            WHERE this_colors0_disconnect0_photos0_color0.id = $updateProducts.args.update.colors[0].disconnect[0].disconnect.photos.disconnect.color.where.node.id
            WITH this, this_colors0_disconnect0, this_colors0_disconnect0_rel, this_colors0_disconnect0_photos0, this_colors0_disconnect0_photos0_rel, this_colors0_disconnect0_photos0_color0, this_colors0_disconnect0_photos0_color0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Photo', toName: 'Color', relationshipName: 'OF_COLOR', id: id(this_colors0_disconnect0_photos0), toID: id(this_colors0_disconnect0_photos0_color0), relationshipID: id(this_colors0_disconnect0_photos0_color0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_colors0_disconnect0_photos0_mutateMeta
            FOREACH(_ IN CASE this_colors0_disconnect0_photos0_color0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_colors0_disconnect0_photos0_color0_rel
            )
            RETURN REDUCE(tmp1_this_colors0_disconnect0_photos0_mutateMeta = [], tmp2_this_colors0_disconnect0_photos0_mutateMeta IN COLLECT(this_colors0_disconnect0_photos0_mutateMeta) | tmp1_this_colors0_disconnect0_photos0_mutateMeta + tmp2_this_colors0_disconnect0_photos0_mutateMeta) as this_colors0_disconnect0_photos0_mutateMeta
            }
            WITH this, this_colors0_disconnect0, this_colors0_disconnect0_rel, this_colors0_disconnect0_photos0, this_colors0_disconnect0_photos0_rel, this_colors0_disconnect0_mutateMeta + this_colors0_disconnect0_photos0_mutateMeta as this_colors0_disconnect0_mutateMeta
            RETURN REDUCE(tmp1_this_colors0_disconnect0_mutateMeta = [], tmp2_this_colors0_disconnect0_mutateMeta IN COLLECT(this_colors0_disconnect0_mutateMeta) | tmp1_this_colors0_disconnect0_mutateMeta + tmp2_this_colors0_disconnect0_mutateMeta) as this_colors0_disconnect0_mutateMeta
            }
            WITH this, this_colors0_disconnect0, this_colors0_disconnect0_rel, this_mutateMeta + this_colors0_disconnect0_mutateMeta as this_mutateMeta
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            WITH this, mutateMeta
            WITH this, mutateMeta
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_photos0_disconnect0_rel:HAS_PHOTO]->(this_photos0_disconnect0:Photo)
            WHERE this_photos0_disconnect0.id = $updateProducts.args.update.photos[0].disconnect[0].where.node.id
            WITH this, this_photos0_disconnect0, this_photos0_disconnect0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Product', toName: 'Photo', relationshipName: 'HAS_PHOTO', id: id(this), toID: id(this_photos0_disconnect0), relationshipID: id(this_photos0_disconnect0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_mutateMeta
            FOREACH(_ IN CASE this_photos0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_photos0_disconnect0_rel
            )
            WITH this, this_photos0_disconnect0, this_photos0_disconnect0_rel, this_mutateMeta
            CALL {
            WITH this, this_photos0_disconnect0, this_photos0_disconnect0_rel
            OPTIONAL MATCH (this_photos0_disconnect0)-[this_photos0_disconnect0_color0_rel:OF_COLOR]->(this_photos0_disconnect0_color0:Color)
            WHERE this_photos0_disconnect0_color0.name = $updateProducts.args.update.photos[0].disconnect.disconnect.color.where.node.name
            WITH this, this_photos0_disconnect0, this_photos0_disconnect0_rel, this_photos0_disconnect0_color0, this_photos0_disconnect0_color0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Photo', toName: 'Color', relationshipName: 'OF_COLOR', id: id(this_photos0_disconnect0), toID: id(this_photos0_disconnect0_color0), relationshipID: id(this_photos0_disconnect0_color0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_photos0_disconnect0_mutateMeta
            FOREACH(_ IN CASE this_photos0_disconnect0_color0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_photos0_disconnect0_color0_rel
            )
            RETURN REDUCE(tmp1_this_photos0_disconnect0_mutateMeta = [], tmp2_this_photos0_disconnect0_mutateMeta IN COLLECT(this_photos0_disconnect0_mutateMeta) | tmp1_this_photos0_disconnect0_mutateMeta + tmp2_this_photos0_disconnect0_mutateMeta) as this_photos0_disconnect0_mutateMeta
            }
            WITH this, this_photos0_disconnect0, this_photos0_disconnect0_rel, this_mutateMeta + this_photos0_disconnect0_mutateMeta as this_mutateMeta
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, mutateMeta + this_mutateMeta as mutateMeta
            WITH this, mutateMeta
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_photos0_disconnect1_rel:HAS_PHOTO]->(this_photos0_disconnect1:Photo)
            WHERE this_photos0_disconnect1.id = $updateProducts.args.update.photos[0].disconnect[1].where.node.id
            WITH this, this_photos0_disconnect1, this_photos0_disconnect1_rel, [ metaVal IN [{type: 'Disconnected', name: 'Product', toName: 'Photo', relationshipName: 'HAS_PHOTO', id: id(this), toID: id(this_photos0_disconnect1), relationshipID: id(this_photos0_disconnect1_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_mutateMeta
            FOREACH(_ IN CASE this_photos0_disconnect1 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_photos0_disconnect1_rel
            )
            WITH this, this_photos0_disconnect1, this_photos0_disconnect1_rel, this_mutateMeta
            CALL {
            WITH this, this_photos0_disconnect1, this_photos0_disconnect1_rel
            OPTIONAL MATCH (this_photos0_disconnect1)-[this_photos0_disconnect1_color0_rel:OF_COLOR]->(this_photos0_disconnect1_color0:Color)
            WHERE this_photos0_disconnect1_color0.name = $updateProducts.args.update.photos[0].disconnect.disconnect.color.where.node.name
            WITH this, this_photos0_disconnect1, this_photos0_disconnect1_rel, this_photos0_disconnect1_color0, this_photos0_disconnect1_color0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Photo', toName: 'Color', relationshipName: 'OF_COLOR', id: id(this_photos0_disconnect1), toID: id(this_photos0_disconnect1_color0), relationshipID: id(this_photos0_disconnect1_color0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_photos0_disconnect1_mutateMeta
            FOREACH(_ IN CASE this_photos0_disconnect1_color0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_photos0_disconnect1_color0_rel
            )
            RETURN REDUCE(tmp1_this_photos0_disconnect1_mutateMeta = [], tmp2_this_photos0_disconnect1_mutateMeta IN COLLECT(this_photos0_disconnect1_mutateMeta) | tmp1_this_photos0_disconnect1_mutateMeta + tmp2_this_photos0_disconnect1_mutateMeta) as this_photos0_disconnect1_mutateMeta
            }
            WITH this, this_photos0_disconnect1, this_photos0_disconnect1_rel, this_mutateMeta + this_photos0_disconnect1_mutateMeta as this_mutateMeta
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, mutateMeta + this_mutateMeta as mutateMeta
            RETURN mutateMeta + [ metaVal IN [{type: 'Updated', name: 'Product', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_id\\": \\"123\\",
                \\"this_update_name\\": \\"Nested Connect\\",
                \\"this_update\\": {
                    \\"id\\": \\"123\\",
                    \\"name\\": \\"Nested Connect\\"
                },
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
                }
            }"
        `);
    });
});
