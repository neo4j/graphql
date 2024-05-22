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

describe("Cypher Projection", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
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
        });
    });

    test("Multi Create With Projection", async () => {
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:Product)
                SET
                    create_this1.id = create_var0.id
                RETURN create_this1
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)-[create_this2:HAS_PHOTO]->(create_this3:Photo)
                WHERE create_this3.url = $create_param1
                WITH create_this3 { .url, location: CASE
                    WHEN create_this3.location IS NOT NULL THEN { point: create_this3.location }
                    ELSE NULL
                END } AS create_this3
                RETURN collect(create_this3) AS create_var4
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)-[create_this5:HAS_COLOR]->(create_this6:Color)
                WHERE create_this6.id = $create_param2
                WITH create_this6 { .id } AS create_this6
                RETURN collect(create_this6) AS create_var7
            }
            CALL {
                WITH create_this1
                MATCH (create_this1)-[create_this8:HAS_SIZE]->(create_this9:Size)
                WHERE create_this9.name = $create_param3
                WITH create_this9 { .name } AS create_this9
                RETURN collect(create_this9) AS create_var10
            }
            RETURN collect(create_this1 { .id, photos: create_var4, colors: create_var7, sizes: create_var10 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\"
                    },
                    {
                        \\"id\\": \\"2\\"
                    }
                ],
                \\"create_param1\\": \\"url.com\\",
                \\"create_param2\\": \\"123\\",
                \\"create_param3\\": \\"small\\"
            }"
        `);
    });
});
