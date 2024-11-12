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

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("cypher directive filtering - Auth", () => {
    test("Int cypher field AND String title field", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { special_count_GTE: 1, title_EQ: "CustomType One" }) {
                    special_count
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (m:Movie)
                    RETURN count(m) as c
                }
                WITH c AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE (this.title = $param0 AND var1 >= $param1)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (m:Movie)
                    RETURN count(m) as c
                }
                WITH c AS this2
                RETURN this2 AS var3
            }
            RETURN this { special_count: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"CustomType One\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("unmatched Int cypher field AND String title field", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { special_count_GTE: 1, title_EQ: "CustomType Unknown" }) {
                    special_count
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (m:Movie)
                    RETURN count(m) as c
                }
                WITH c AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE (this.title = $param0 AND var1 >= $param1)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (m:Movie)
                    RETURN count(m) as c
                }
                WITH c AS this2
                RETURN this2 AS var3
            }
            RETURN this { special_count: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"CustomType Unknown\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Int cypher field, selecting String title field", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                special_count: Int
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN count(m) as c
                        """
                        columnName: "c"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { special_count_GTE: 1 }) {
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (m:Movie)
                    RETURN count(m) as c
                }
                WITH c AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 >= $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
