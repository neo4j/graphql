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

import { Neo4jGraphQL } from "../../../../src";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("cypher directive filtering - One To One Relationship - deprecated", () => {
    test("1 to 1 relationship", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                actor: Actor!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movie: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { actor: { name_EQ: "Keanu Reeves" } }) {
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:ACTED_IN]->(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE this1.name = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("1 to 1 relationship with multiple filters", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                actor: Actor!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                age: Int
                movie: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { released_EQ: 2003, actor: { name_EQ: "Keanu Reeves", age_GT: 30 } }) {
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:ACTED_IN]->(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE (this.released = $param0 AND (this1.name = $param1 AND this1.age > $param2))
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2003,
                    \\"high\\": 0
                },
                \\"param1\\": \\"Keanu Reeves\\",
                \\"param2\\": {
                    \\"low\\": 30,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("1 to 1 relationship with single property filter", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                actor: Actor!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movie: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                movies(where: { actor: { name_EQ: "Keanu Reeves" } }) {
                    title
                    actor {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE this1.name = $param0
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this2
                WITH this2 { .name } AS this2
                RETURN head(collect(this2)) AS var3
            }
            RETURN this { .title, actor: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("1 to 1 relationship with null filter", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                actor: Actor
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movie: Movie
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                movies(where: { released_EQ: 2003, actor: null }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE (this.released = $param0 AND this1 IS NULL)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2003,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("1 to 1 relationship with NOT null filter", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                actor: Actor
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movie: Movie
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                movies(where: { AND: [{ released_IN: [2003], NOT: { actor: null } }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE (this.released IN $param0 AND NOT (this1 IS NULL))
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"low\\": 2003,
                        \\"high\\": 0
                    }
                ]
            }"
        `);
    });

    test("1 to 1 relationship with auth filter on type PASS", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(filter: [{ where: { node: { directed_by: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                released: Int
                directed_by: Person!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type Person @node {
                name: String
                directed: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Lilly Wachowski" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                people(where: { directed: { title_EQ: "The Matrix" } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE this1.title = $param0
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this2
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this3
                    WITH this3 { .name } AS this3
                    RETURN head(collect(this3)) AS var4
                }
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this5
                    RETURN head(collect(this5)) AS this6
                }
                WITH *
                WHERE ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND this6.name = $jwt.custom_value))
                WITH this2 { .title, directed_by: var4 } AS this2
                RETURN head(collect(this2)) AS var7
            }
            RETURN this { directed: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Lilly Wachowski\\"
                }
            }"
        `);
    });

    test("1 to 1 relationship with auth filter on type FAIL", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(filter: [{ where: { node: { directed_by: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                released: Int
                directed_by: Person!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type Person @node {
                name: String
                directed: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Something Incorrect" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                people(where: { directed: { title_EQ: "The Matrix" } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE this1.title = $param0
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this2
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this3
                    WITH this3 { .name } AS this3
                    RETURN head(collect(this3)) AS var4
                }
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this5
                    RETURN head(collect(this5)) AS this6
                }
                WITH *
                WHERE ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND this6.name = $jwt.custom_value))
                WITH this2 { .title, directed_by: var4 } AS this2
                RETURN head(collect(this2)) AS var7
            }
            RETURN this { directed: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Something Incorrect\\"
                }
            }"
        `);
    });

    test("1 to 1 relationship with auth filter on field PASS", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                directed_by: Person!
                    @authorization(filter: [{ where: { node: { directed_by: { name_EQ: "$jwt.custom_value" } } } }])
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type Person @node {
                name: String
                directed: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Lilly Wachowski" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                people(where: { directed: { title_EQ: "The Matrix" } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE this1.title = $param0
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this2
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this3
                    WITH this3 { .name } AS this3
                    RETURN head(collect(this3)) AS var4
                }
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this5
                    RETURN head(collect(this5)) AS this6
                }
                WITH *
                WHERE ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND this6.name = $jwt.custom_value))
                WITH this2 { .title, directed_by: var4 } AS this2
                RETURN head(collect(this2)) AS var7
            }
            RETURN this { directed: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Lilly Wachowski\\"
                }
            }"
        `);
    });

    test("1 to 1 relationship with auth filter on field FAIL", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                directed_by: Person!
                    @authorization(filter: [{ where: { node: { directed_by: { name_EQ: "$jwt.custom_value" } } } }])
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type Person @node {
                name: String
                directed: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Something Incorrect" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                people(where: { directed: { title_EQ: "The Matrix" } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE this1.title = $param0
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this2
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this3
                    WITH this3 { .name } AS this3
                    RETURN head(collect(this3)) AS var4
                }
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this5
                    RETURN head(collect(this5)) AS this6
                }
                WITH *
                WHERE ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND this6.name = $jwt.custom_value))
                WITH this2 { .title, directed_by: var4 } AS this2
                RETURN head(collect(this2)) AS var7
            }
            RETURN this { directed: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Something Incorrect\\"
                }
            }"
        `);
    });

    test("1 to 1 relationship with auth validate type PASS", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(validate: [{ where: { node: { directed_by: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                released: Int
                directed_by: Person!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type Person @node {
                name: String
                directed: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Lilly Wachowski" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                people(where: { directed: { title_EQ: "The Matrix" } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE this1.title = $param0
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this2
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this3
                    WITH this3 { .name } AS this3
                    RETURN head(collect(this3)) AS var4
                }
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this5
                    RETURN head(collect(this5)) AS this6
                }
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND this6.name = $jwt.custom_value)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this2 { .title, directed_by: var4 } AS this2
                RETURN head(collect(this2)) AS var7
            }
            RETURN this { directed: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Lilly Wachowski\\"
                }
            }"
        `);
    });

    test("1 to 1 relationship with auth validate type FAIL", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(validate: [{ where: { node: { directed_by: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                released: Int
                directed_by: Person!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type Person @node {
                name: String
                directed: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Something Wrong" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                people(where: { directed: { title_EQ: "The Matrix" } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE this1.title = $param0
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this2
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this3
                    WITH this3 { .name } AS this3
                    RETURN head(collect(this3)) AS var4
                }
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this5
                    RETURN head(collect(this5)) AS this6
                }
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND this6.name = $jwt.custom_value)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this2 { .title, directed_by: var4 } AS this2
                RETURN head(collect(this2)) AS var7
            }
            RETURN this { directed: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Something Wrong\\"
                }
            }"
        `);
    });

    test("1 to 1 relationship with auth validate field PASS", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                directed_by: Person!
                    @authorization(validate: [{ where: { node: { directed_by: { name_EQ: "$jwt.custom_value" } } } }])
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type Person @node {
                name: String
                directed: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Lilly Wachowski" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                people(where: { directed: { title_EQ: "The Matrix" } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE this1.title = $param0
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this2
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this3
                    WITH this3 { .name } AS this3
                    RETURN head(collect(this3)) AS var4
                }
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this5
                    RETURN head(collect(this5)) AS this6
                }
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND this6.name = $jwt.custom_value)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this2 { .title, directed_by: var4 } AS this2
                RETURN head(collect(this2)) AS var7
            }
            RETURN this { directed: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Lilly Wachowski\\"
                }
            }"
        `);
    });

    test("1 to 1 relationship with auth validate field FAIL", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                directed_by: Person!
                    @authorization(validate: [{ where: { node: { directed_by: { name_EQ: "$jwt.custom_value" } } } }])
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type Person @node {
                name: String
                directed: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Something Wrong" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                people(where: { directed: { title_EQ: "The Matrix" } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE this1.title = $param0
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this2
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this3
                    WITH this3 { .name } AS this3
                    RETURN head(collect(this3)) AS var4
                }
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this5
                    RETURN head(collect(this5)) AS this6
                }
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND this6.name = $jwt.custom_value)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this2 { .title, directed_by: var4 } AS this2
                RETURN head(collect(this2)) AS var7
            }
            RETURN this { directed: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Something Wrong\\"
                }
            }"
        `);
    });

    test("1 to 1 relationship with nested selection", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                directed_by: Person!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type Person @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                directed: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                people(where: { directed: { title_EQ: "The Matrix" } }) {
                    directed {
                        title
                        directed_by {
                            name
                        }
                        actors {
                            name
                            movies {
                                directed_by {
                                    name
                                }
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE this1.title = $param0
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:DIRECTED]->(movie:Movie)
                    RETURN movie
                }
                WITH movie AS this2
                CALL (this2) {
                    MATCH (this2)<-[this3:ACTED_IN]-(this4:Person)
                    WITH DISTINCT this4
                    CALL (this4) {
                        MATCH (this4)-[this5:ACTED_IN]->(this6:Movie)
                        WITH DISTINCT this6
                        CALL (this6) {
                            CALL (this6) {
                                WITH this6 AS this
                                MATCH (this)<-[:DIRECTED]-(director:Person)
                                RETURN director
                            }
                            WITH director AS this7
                            WITH this7 { .name } AS this7
                            RETURN head(collect(this7)) AS var8
                        }
                        WITH this6 { .title, directed_by: var8 } AS this6
                        RETURN collect(this6) AS var9
                    }
                    WITH this4 { .name, movies: var9 } AS this4
                    RETURN collect(this4) AS var10
                }
                CALL (this2) {
                    CALL (this2) {
                        WITH this2 AS this
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                    }
                    WITH director AS this11
                    WITH this11 { .name } AS this11
                    RETURN head(collect(this11)) AS var12
                }
                WITH this2 { .title, directed_by: var12, actors: var10 } AS this2
                RETURN head(collect(this2)) AS var13
            }
            RETURN this { directed: var13 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("1 to 1 relationship with connection", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                released: Int
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                directed_by: Person!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:DIRECTED]-(director:Person)
                        RETURN director
                        """
                        columnName: "director"
                    )
            }

            type Person @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                directed: Movie!
                    @cypher(
                        statement: """
                        MATCH (this)-[:DIRECTED]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                movies(where: { directed_by: { name_EQ: "Lilly Wachowski" }, title_ENDS_WITH: "Matrix" }) {
                    actorsConnection {
                        totalCount
                        edges {
                            node {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)<-[:DIRECTED]-(director:Person)
                    RETURN director
                }
                WITH director AS this0
                RETURN head(collect(this0)) AS this1
            }
            WITH *
            WHERE (this.title ENDS WITH $param0 AND this1.name = $param1)
            CALL (this) {
                MATCH (this)<-[this2:ACTED_IN]-(this3:Person)
                WITH collect({ node: this3, relationship: this2 }) AS edges, count(this3) AS totalCount
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this3, edge.relationship AS this2
                    RETURN collect({ node: { name: this3.name, __resolveType: \\"Person\\" } }) AS var4
                }
                RETURN { edges: var4, totalCount: totalCount } AS var5
            }
            RETURN this { actorsConnection: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Matrix\\",
                \\"param1\\": \\"Lilly Wachowski\\"
            }"
        `);
    });
});
