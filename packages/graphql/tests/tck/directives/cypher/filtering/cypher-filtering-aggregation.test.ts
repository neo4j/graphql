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
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                custom_field: String
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as s
                        """
                        columnName: "s"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { custom_field: { startsWith: "he" } }) {
                    aggregate {
                        node {
                            title {
                                shortest
                            }
                        }
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
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
            CALL {
                WITH *
                MATCH (this3:Movie)
                CALL {
                    WITH this3
                    CALL {
                        WITH this3
                        WITH this3 AS this
                        MATCH (this)
                        RETURN this.custom_field as s
                    }
                    WITH s AS this4
                    RETURN this4 AS var5
                }
                WITH *
                WHERE var5 STARTS WITH $param1
                WITH collect({ node: this3 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this3
                    RETURN collect({ node: { __id: id(this3), __resolveType: \\"Movie\\" } }) AS var6
                }
                RETURN var6, totalCount
            }
            RETURN { edges: var6, totalCount: totalCount, aggregate: { node: { title: var2 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"he\\",
                \\"param1\\": \\"he\\"
            }"
        `);
    });

    test("Int aggregation", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                custom_field: Int
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as s
                        """
                        columnName: "s"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { custom_field: { gt: 0 } }) {
                    aggregate {
                        node {
                            released {
                                min
                            }
                        }
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
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
                WITH this
                RETURN { min: min(this.released) } AS var2
            }
            CALL {
                WITH *
                MATCH (this3:Movie)
                CALL {
                    WITH this3
                    CALL {
                        WITH this3
                        WITH this3 AS this
                        MATCH (this)
                        RETURN this.custom_field as s
                    }
                    WITH s AS this4
                    RETURN this4 AS var5
                }
                WITH *
                WHERE var5 > $param1
                WITH collect({ node: this3 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this3
                    RETURN collect({ node: { __id: id(this3), __resolveType: \\"Movie\\" } }) AS var6
                }
                RETURN var6, totalCount
            }
            RETURN { edges: var6, totalCount: totalCount, aggregate: { node: { released: var2 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("String list aggregation", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                custom_field: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as s
                        """
                        columnName: "s"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { custom_field: { includes: "test" } }) {
                    aggregate {
                        node {
                            title {
                                longest
                            }
                        }
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
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
            CALL {
                WITH *
                MATCH (this4:Movie)
                CALL {
                    WITH this4
                    CALL {
                        WITH this4
                        WITH this4 AS this
                        MATCH (this)
                        RETURN this.custom_field as s
                    }
                    UNWIND s AS var5
                    WITH var5 AS this6
                    RETURN collect(this6) AS var7
                }
                WITH *
                WHERE $param1 IN var7
                WITH collect({ node: this4 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this4
                    RETURN collect({ node: { __id: id(this4), __resolveType: \\"Movie\\" } }) AS var8
                }
                RETURN var8, totalCount
            }
            RETURN { edges: var8, totalCount: totalCount, aggregate: { node: { title: var3 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test\\",
                \\"param1\\": \\"test\\"
            }"
        `);
    });

    test("Int list aggregation", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                custom_field: [Int]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as s
                        """
                        columnName: "s"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { custom_field: { includes: 2 } }) {
                    aggregate {
                        node {
                            title {
                                longest
                            }
                        }
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
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
            CALL {
                WITH *
                MATCH (this4:Movie)
                CALL {
                    WITH this4
                    CALL {
                        WITH this4
                        WITH this4 AS this
                        MATCH (this)
                        RETURN this.custom_field as s
                    }
                    UNWIND s AS var5
                    WITH var5 AS this6
                    RETURN collect(this6) AS var7
                }
                WITH *
                WHERE $param1 IN var7
                WITH collect({ node: this4 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this4
                    RETURN collect({ node: { __id: id(this4), __resolveType: \\"Movie\\" } }) AS var8
                }
                RETURN var8, totalCount
            }
            RETURN { edges: var8, totalCount: totalCount, aggregate: { node: { title: var3 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
