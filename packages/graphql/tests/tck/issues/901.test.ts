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

describe("https://github.com/neo4j/graphql/issues/901", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Series {
                id: ID! @id
                name: String!
                brand: Series @relationship(type: "HAS_BRAND", direction: OUT, properties: "Properties")
                manufacturer: Series @relationship(type: "HAS_MANUFACTURER", direction: OUT, properties: "Properties")
            }

            interface Properties {
                current: Boolean
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("conjuctions", async () => {
        const query = gql`
            query ($where: SeriesWhere) {
                series(where: $where) {
                    name
                    brand {
                        name
                    }
                    manufacturer {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: {
                where: {
                    OR: [
                        {
                            manufacturerConnection: {
                                edge: {
                                    current: true,
                                },
                                node: {
                                    name: "abc",
                                },
                            },
                        },
                        {
                            brandConnection: {
                                edge: {
                                    current: true,
                                },
                                node: {
                                    name: "smart",
                                },
                            },
                        },
                    ],
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Series\`)
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_MANUFACTURER]->(this1:\`Series\`)
                WHERE (this0.current = $param0 AND this1.name = $param1)
                RETURN count(this0) AS var2
            }
            CALL {
                WITH this
                MATCH (this)-[this3:HAS_BRAND]->(this4:\`Series\`)
                WHERE (this3.current = $param2 AND this4.name = $param3)
                RETURN count(this3) AS var5
            }
            WITH *
            WHERE (var2 = 1 OR var5 = 1)
            CALL {
                WITH this
                MATCH (this)-[this6:HAS_BRAND]->(this_brand:\`Series\`)
                WITH this_brand { .name } AS this_brand
                RETURN head(collect(this_brand)) AS this_brand
            }
            CALL {
                WITH this
                MATCH (this)-[this7:HAS_MANUFACTURER]->(this_manufacturer:\`Series\`)
                WITH this_manufacturer { .name } AS this_manufacturer
                RETURN head(collect(this_manufacturer)) AS this_manufacturer
            }
            RETURN this { .name, brand: this_brand, manufacturer: this_manufacturer } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": true,
                \\"param1\\": \\"abc\\",
                \\"param2\\": true,
                \\"param3\\": \\"smart\\"
            }"
        `);
    });
});
