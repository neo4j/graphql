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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../src";
import { createJwtRequest } from "../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";

describe("Cypher Projection", () => {
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
                location: Point
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret: "secret",
                }),
            },
        });
    });

    test("Multi Create With Projection", async () => {
        const query = gql`
            mutation {
                createProducts(input: [{ id: "1" }, { id: "2" }]) {
                    products {
                        id
                        photos(where: { url: "url.com" }) {
                            url
                            location {
                                latitude
                                longitude
                                height
                            }
                        }
                        colors(where: { id: 123 }) {
                            id
                        }
                        sizes(where: { name: "small" }) {
                            name
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param3 AS create_var4
            CALL {
                WITH create_var4
                CREATE (create_this3:\`Product\`)
                SET
                    create_this3.id = create_var4.id
                RETURN create_this3
            }
            CALL {
                WITH create_this3
                MATCH (create_this3)-[create_this0:HAS_PHOTO]->(create_this3_photos:\`Photo\`)
                WHERE create_this3_photos.url = $create_param0
                WITH create_this3_photos { .url, location: (CASE
                    WHEN create_this3_photos.location IS NOT NULL THEN { point: create_this3_photos.location }
                    ELSE NULL
                END) } AS create_this3_photos
                RETURN collect(create_this3_photos) AS create_this3_photos
            }
            CALL {
                WITH create_this3
                MATCH (create_this3)-[create_this1:HAS_COLOR]->(create_this3_colors:\`Color\`)
                WHERE create_this3_colors.id = $create_param1
                WITH create_this3_colors { .id } AS create_this3_colors
                RETURN collect(create_this3_colors) AS create_this3_colors
            }
            CALL {
                WITH create_this3
                MATCH (create_this3)-[create_this2:HAS_SIZE]->(create_this3_sizes:\`Size\`)
                WHERE create_this3_sizes.name = $create_param2
                WITH create_this3_sizes { .name } AS create_this3_sizes
                RETURN collect(create_this3_sizes) AS create_this3_sizes
            }
            RETURN collect(create_this3 { .id, photos: create_this3_photos, colors: create_this3_colors, sizes: create_this3_sizes }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"url.com\\",
                \\"create_param1\\": \\"123\\",
                \\"create_param2\\": \\"small\\",
                \\"create_param3\\": [
                    {
                        \\"id\\": \\"1\\"
                    },
                    {
                        \\"id\\": \\"2\\"
                    }
                ],
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
