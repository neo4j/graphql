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

describe("cypher directive filtering - Aggregation", () => {
    test("String aggregation", async () => {
        const typeDefs = `
            type Movie @node {
                title: String
                released: Int
                custom_field: String @cypher(
                    statement: """
                    MATCH (this)
                    RETURN this.custom_field as s
                    """
                    columnName: "s"
                )
            }
        `;

        const query = `
            query {
                moviesAggregate(where: { custom_field_STARTS_WITH: "he" }) {
                    title {
                        shortest
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this:Movie)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        MATCH (this)
                        RETURN this.custom_field as s
                    }
                    WITH s AS this0
                    RETURN this0 AS var1
                }
                WITH *
                WHERE var1 STARTS WITH $param0
                WITH this
                ORDER BY size(this.title) DESC
                WITH collect(this.title) AS list
                RETURN { shortest: last(list) } AS var2
            }
            RETURN { title: var2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"he\\"
            }"
        `);
    });

    test("Int aggregation", async () => {
        const typeDefs = `
            type Movie @node {
                title: String
                released: Int
                custom_field: Int @cypher(
                    statement: """
                    MATCH (this)
                    RETURN this.custom_field as s
                    """
                    columnName: "s"
                )
            }
        `;

        const query = `
            query {
                moviesAggregate(where: { custom_field_GT: 0 }) {
                    released {
                        min
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this:Movie)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        MATCH (this)
                        RETURN this.custom_field as s
                    }
                    WITH s AS this0
                    RETURN this0 AS var1
                }
                WITH *
                WHERE var1 > $param0
                RETURN { min: min(this.released) } AS var2
            }
            RETURN { released: var2 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("String list aggregation", async () => {
        const typeDefs = `
            type Movie @node {
                title: String
                released: Int
                custom_field: [String] @cypher(
                    statement: """
                    MATCH (this)
                    RETURN this.custom_field as s
                    """
                    columnName: "s"
                )
            }
        `;

        const query = `
            query {
                moviesAggregate(where: { custom_field_INCLUDES: "test" }) {
                    title {
                        longest
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this:Movie)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        MATCH (this)
                        RETURN this.custom_field as s
                    }
                    UNWIND s AS var0
                    WITH var0 AS this1
                    RETURN collect(this1) AS var2
                }
                WITH *
                WHERE $param0 IN var2
                WITH this
                ORDER BY size(this.title) DESC
                WITH collect(this.title) AS list
                RETURN { longest: head(list) } AS var3
            }
            RETURN { title: var3 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test\\"
            }"
        `);
    });

    test("Int list aggregation", async () => {
        const typeDefs = `
            type Movie @node {
                title: String
                released: Int
                custom_field: [Int] @cypher(
                    statement: """
                    MATCH (this)
                    RETURN this.custom_field as s
                    """
                    columnName: "s"
                )
            }
        `;

        const query = `
            query {
                moviesAggregate(where: { custom_field_INCLUDES: 2 }) {
                    title {
                        longest
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this:Movie)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        MATCH (this)
                        RETURN this.custom_field as s
                    }
                    UNWIND s AS var0
                    WITH var0 AS this1
                    RETURN collect(this1) AS var2
                }
                WITH *
                WHERE $param0 IN var2
                WITH this
                ORDER BY size(this.title) DESC
                WITH collect(this.title) AS list
                RETURN { longest: head(list) } AS var3
            }
            RETURN { title: var3 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
