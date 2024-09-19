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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/901", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Series @node {
                id: ID! @id @unique
                name: String!
                brand: Series @relationship(type: "HAS_BRAND", direction: OUT, properties: "Properties")
                manufacturer: Series @relationship(type: "HAS_MANUFACTURER", direction: OUT, properties: "Properties")
            }

            type Properties @relationshipProperties {
                current: Boolean
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("conjuctions", async () => {
        const query = /* GraphQL */ `
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

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                where: {
                    OR: [
                        {
                            manufacturerConnection: {
                                edge: {
                                    current_EQ: true,
                                },
                                node: {
                                    name_EQ: "abc",
                                },
                            },
                        },
                        {
                            brandConnection: {
                                edge: {
                                    current_EQ: true,
                                },
                                node: {
                                    name_EQ: "smart",
                                },
                            },
                        },
                    ],
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Series)
            WHERE (single(this0 IN [(this)-[this1:HAS_MANUFACTURER]->(this0:Series) WHERE (this0.name = $param0 AND this1.current = $param1) | 1] WHERE true) OR single(this2 IN [(this)-[this3:HAS_BRAND]->(this2:Series) WHERE (this2.name = $param2 AND this3.current = $param3) | 1] WHERE true))
            CALL {
                WITH this
                MATCH (this)-[this4:HAS_BRAND]->(this5:Series)
                WITH this5 { .name } AS this5
                RETURN head(collect(this5)) AS var6
            }
            CALL {
                WITH this
                MATCH (this)-[this7:HAS_MANUFACTURER]->(this8:Series)
                WITH this8 { .name } AS this8
                RETURN head(collect(this8)) AS var9
            }
            RETURN this { .name, brand: var6, manufacturer: var9 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"abc\\",
                \\"param1\\": true,
                \\"param2\\": \\"smart\\",
                \\"param3\\": true
            }"
        `);
    });
});
