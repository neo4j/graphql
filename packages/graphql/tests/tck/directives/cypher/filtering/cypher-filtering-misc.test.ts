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
    test("With relationship filter (non-Cypher field)", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { custom_field_EQ: "hello world!", actors_SOME: { name_EQ: "Keanu Reeves" } }) {
                    custom_field
                    title
                    actors {
                        name
                    }
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
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE (var1 = $param0 AND EXISTS {
                MATCH (this)<-[:ACTED_IN]-(this2:Actor)
                WHERE this2.name = $param1
            })
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this3
                RETURN this3 AS var4
            }
            CALL {
                WITH this
                MATCH (this)<-[this5:ACTED_IN]-(this6:Actor)
                WITH this6 { .name } AS this6
                RETURN collect(this6) AS var7
            }
            RETURN this { .title, custom_field: var4, actors: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\",
                \\"param1\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("In a nested filter", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = /* GraphQL */ `
            query {
                actors {
                    name
                    movies(where: { custom_field_EQ: "hello world!"}) {
                        title
                    }
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                CALL {
                    WITH this1
                    CALL {
                        WITH this1
                        WITH this1 AS this
                        RETURN \\"hello world!\\" AS s
                    }
                    WITH s AS this2
                    RETURN this2 AS var3
                }
                WITH *
                WHERE var3 = $param0
                WITH this1 { .title } AS this1
                RETURN collect(this1) AS var4
            }
            RETURN this { .name, movies: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\"
            }"
        `);
    });

    test("With a nested filter", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { custom_field_EQ: "hello world!" }) {
                    title
                    actors(where: { name_EQ: "Keanu Reeves" }) {
                        name
                    }
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
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 = $param0
            CALL {
                WITH this
                MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                WHERE this3.name = $param1
                WITH this3 { .name } AS this3
                RETURN collect(this3) AS var4
            }
            RETURN this { .title, actors: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\",
                \\"param1\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("With two cypher fields", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                another_custom_field: Int
                    @cypher(
                        statement: """
                        RETURN 100 AS i
                        """
                        columnName: "i"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String
                another_custom_field: String
                    @cypher(
                        statement: """
                        RETURN "goodbye!" AS s
                        """
                        columnName: "s"
                    )
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { custom_field_EQ: "hello world!", another_custom_field_GT: 50 }) {
                    title
                    actors {
                        name
                    }
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
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN 100 AS i
                }
                WITH i AS this2
                RETURN this2 AS var3
            }
            WITH *
            WHERE (var1 = $param0 AND var3 > $param1)
            CALL {
                WITH this
                MATCH (this)<-[this4:ACTED_IN]-(this5:Actor)
                WITH this5 { .name } AS this5
                RETURN collect(this5) AS var6
            }
            RETURN this { .title, actors: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\",
                \\"param1\\": {
                    \\"low\\": 50,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("With two cypher fields, one nested", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello world!" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String
                another_custom_field: String
                    @cypher(
                        statement: """
                        RETURN "goodbye!" AS s
                        """
                        columnName: "s"
                    )
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { custom_field_EQ: "hello world!" }) {
                    title
                    actors(where: { another_custom_field_EQ: "goodbye!", name_EQ: "Keanu Reeves" }) {
                        name
                    }
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
                    RETURN \\"hello world!\\" AS s
                }
                WITH s AS this0
                RETURN this0 AS var1
            }
            WITH *
            WHERE var1 = $param0
            CALL {
                WITH this
                MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
                CALL {
                    WITH this3
                    CALL {
                        WITH this3
                        WITH this3 AS this
                        RETURN \\"goodbye!\\" AS s
                    }
                    WITH s AS this4
                    RETURN this4 AS var5
                }
                WITH *
                WHERE (this3.name = $param1 AND var5 = $param2)
                WITH this3 { .name } AS this3
                RETURN collect(this3) AS var6
            }
            RETURN this { .title, actors: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"hello world!\\",
                \\"param1\\": \\"Keanu Reeves\\",
                \\"param2\\": \\"goodbye!\\"
            }"
        `);
    });
});
