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
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

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
            "CALL {
            CREATE (this0:Product)
            SET this0.id = $this0_id
            RETURN this0
            }
            CALL {
            CREATE (this1:Product)
            SET this1.id = $this1_id
            RETURN this1
            }
            CALL {
                WITH this0
                MATCH (this0)-[create_this0:HAS_PHOTO]->(this0_photos:\`Photo\`)
                WHERE this0_photos.url = $create_param0
                WITH this0_photos { .url, location: (CASE WHEN this0_photos.location IS NOT NULL THEN { point: this0_photos.location } ELSE NULL END) } AS this0_photos
                RETURN collect(this0_photos) AS this0_photos
            }
            CALL {
                WITH this0
                MATCH (this0)-[create_this1:HAS_COLOR]->(this0_colors:\`Color\`)
                WHERE this0_colors.id = $create_param1
                WITH this0_colors { .id } AS this0_colors
                RETURN collect(this0_colors) AS this0_colors
            }
            CALL {
                WITH this0
                MATCH (this0)-[create_this2:HAS_SIZE]->(this0_sizes:\`Size\`)
                WHERE this0_sizes.name = $create_param2
                WITH this0_sizes { .name } AS this0_sizes
                RETURN collect(this0_sizes) AS this0_sizes
            }
            CALL {
                WITH this1
                MATCH (this1)-[create_this0:HAS_PHOTO]->(this1_photos:\`Photo\`)
                WHERE this1_photos.url = $create_param0
                WITH this1_photos { .url, location: (CASE WHEN this1_photos.location IS NOT NULL THEN { point: this1_photos.location } ELSE NULL END) } AS this1_photos
                RETURN collect(this1_photos) AS this1_photos
            }
            CALL {
                WITH this1
                MATCH (this1)-[create_this1:HAS_COLOR]->(this1_colors:\`Color\`)
                WHERE this1_colors.id = $create_param1
                WITH this1_colors { .id } AS this1_colors
                RETURN collect(this1_colors) AS this1_colors
            }
            CALL {
                WITH this1
                MATCH (this1)-[create_this2:HAS_SIZE]->(this1_sizes:\`Size\`)
                WHERE this1_sizes.name = $create_param2
                WITH this1_sizes { .name } AS this1_sizes
                RETURN collect(this1_sizes) AS this1_sizes
            }
            RETURN [
            this0 { .id, photos: this0_photos, colors: this0_colors, sizes: this0_sizes },
            this1 { .id, photos: this1_photos, colors: this1_colors, sizes: this1_sizes }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": \\"url.com\\",
                \\"create_param1\\": \\"123\\",
                \\"create_param2\\": \\"small\\",
                \\"this0_id\\": \\"1\\",
                \\"this1_id\\": \\"2\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
