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
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher Projection", () => {
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
                location: Point
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
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
            RETURN
            this0 { .id, photos: [ (this0)-[:HAS_PHOTO]->(this0_photos:Photo)  WHERE this0_photos.url = $projection_photos_url | this0_photos { .url, location: apoc.cypher.runFirstColumn('RETURN
            CASE this0_photos.location IS NOT NULL
            	WHEN true THEN { point: this0_photos.location }
            	ELSE NULL
            END AS result',{ this0_photos: this0_photos },false) } ], colors: [ (this0)-[:HAS_COLOR]->(this0_colors:Color)  WHERE this0_colors.id = $projection_colors_id | this0_colors { .id } ], sizes: [ (this0)-[:HAS_SIZE]->(this0_sizes:Size)  WHERE this0_sizes.name = $projection_sizes_name | this0_sizes { .name } ] } AS this0,
            this1 { .id, photos: [ (this1)-[:HAS_PHOTO]->(this1_photos:Photo)  WHERE this1_photos.url = $projection_photos_url | this1_photos { .url, location: apoc.cypher.runFirstColumn('RETURN
            CASE this1_photos.location IS NOT NULL
            	WHEN true THEN { point: this1_photos.location }
            	ELSE NULL
            END AS result',{ this1_photos: this1_photos },false) } ], colors: [ (this1)-[:HAS_COLOR]->(this1_colors:Color)  WHERE this1_colors.id = $projection_colors_id | this1_colors { .id } ], sizes: [ (this1)-[:HAS_SIZE]->(this1_sizes:Size)  WHERE this1_sizes.name = $projection_sizes_name | this1_sizes { .name } ] } AS this1"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this1_id\\": \\"2\\",
                \\"projection_photos_url\\": \\"url.com\\",
                \\"projection_colors_id\\": \\"123\\",
                \\"projection_sizes_name\\": \\"small\\"
            }"
        `);
    });
});
