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
import { createBearerToken } from "../../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("cypher directive filtering top level - Auth", () => {
    test("With authorization on type using @cypher return value", async () => {
        const typeDefs = /* GraphQL */ `
            type Query {
                getMovies: [Movie!]! @cypher(statement: "MATCH (m:Movie) RETURN m", columnName: "m")
            }

            type Movie
                @node
                @authorization(filter: [{ where: { node: { custom_field: { eq: "$jwt.custom_value" } } } }]) {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello" AS s
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

        const token = createBearerToken("secret", { custom_value: "hello" });

        const query = /* GraphQL */ `
            query {
                getMovies {
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (m:Movie) RETURN m
            }
            WITH m AS this0
            CALL (this0) {
                CALL (this0) {
                    WITH this0 AS this
                    RETURN \\"hello\\" AS s
                }
                WITH s AS this1
                RETURN this1 AS var2
            }
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND var2 IS NOT NULL AND var2 = $jwt.custom_value))
            WITH this0 { .title } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"hello\\"
                }
            }"
        `);
    });

    test("With authorization on @cypher field using @cypher return value", async () => {
        const typeDefs = /* GraphQL */ `
            type Query {
                getMovies: [Movie!]! @cypher(statement: "MATCH (m:Movie) RETURN m", columnName: "m")
            }

            type Movie @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello" AS s
                        """
                        columnName: "s"
                    )
                    @authorization(filter: [{ where: { node: { custom_field: { eq: "$jwt.custom_value" } } } }])
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const token = createBearerToken("secret", { custom_value: "hello" });

        const query = /* GraphQL */ `
            query {
                getMovies {
                    custom_field
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (m:Movie) RETURN m
            }
            WITH m AS this0
            CALL (this0) {
                CALL (this0) {
                    WITH this0 AS this
                    RETURN \\"hello\\" AS s
                }
                WITH s AS this1
                RETURN this1 AS var2
            }
            CALL (this0) {
                CALL (this0) {
                    WITH this0 AS this
                    RETURN \\"hello\\" AS s
                }
                WITH s AS this3
                RETURN this3 AS var4
            }
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND var4 IS NOT NULL AND var4 = $jwt.custom_value))
            WITH this0 { custom_field: var2 } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"hello\\"
                }
            }"
        `);
    });

    test("With authorization on @cypher field using different field return value", async () => {
        const typeDefs = /* GraphQL */ `
            type Query {
                getMovies: [Movie!]! @cypher(statement: "MATCH (m:Movie) RETURN m", columnName: "m")
            }

            type Movie @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello" AS s
                        """
                        columnName: "s"
                    )
                    @authorization(filter: [{ where: { node: { title: { eq: "$jwt.custom_value" } } } }])
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const token = createBearerToken("secret", { custom_value: "hello" });

        const query = /* GraphQL */ `
            query {
                getMovies {
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (m:Movie) RETURN m
            }
            WITH m AS this0
            WITH this0 { .title } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("With authorization on Actor type field using nested Movie's @cypher field return value", async () => {
        const typeDefs = /* GraphQL */ `
            type Query {
                getMovies: [Movie!]! @cypher(statement: "MATCH (m:Movie) RETURN m", columnName: "m")
            }

            type Movie @node {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello" AS s
                        """
                        columnName: "s"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor
                @node
                @authorization(
                    filter: [{ where: { node: { movies: { some: { custom_field: { eq: "$jwt.custom_value" } } } } } }]
                ) {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const token = createBearerToken("secret", { custom_value: "hello" });

        const query = /* GraphQL */ `
            query {
                actors {
                    name
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            CALL (this) {
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL (this0) {
                    CALL (this0) {
                        WITH this0 AS this
                        RETURN \\"hello\\" AS s
                    }
                    WITH s AS this1
                    RETURN this1 AS var2
                }
                WITH *
                WHERE ($jwt.custom_value IS NOT NULL AND var2 IS NOT NULL AND var2 = $jwt.custom_value)
                RETURN count(this0) > 0 AS var3
            }
            WITH *
            WHERE ($isAuthenticated = true AND var3 = true)
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"hello\\"
                },
                \\"isAuthenticated\\": true
            }"
        `);
    });

    test("With authorization on a different field than the @cypher field", async () => {
        const typeDefs = /* GraphQL */ `
            type Query {
                getMovies: [Movie!]! @cypher(statement: "MATCH (m:Movie) RETURN m", columnName: "m")
            }

            type Movie @node {
                title: String
                    @authorization(filter: [{ where: { node: { custom_field: { eq: "$jwt.custom_value" } } } }])
                custom_field: String
                    @cypher(
                        statement: """
                        RETURN "hello" AS s
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

        const token = createBearerToken("secret", { custom_value: "hello" });

        const query = /* GraphQL */ `
            query {
                getMovies {
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (m:Movie) RETURN m
            }
            WITH m AS this0
            CALL (this0) {
                CALL (this0) {
                    WITH this0 AS this
                    RETURN \\"hello\\" AS s
                }
                WITH s AS this1
                RETURN this1 AS var2
            }
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND var2 IS NOT NULL AND var2 = $jwt.custom_value))
            WITH this0 { .title } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"hello\\"
                }
            }"
        `);
    });

    test("With authorization on type using @cypher return value, with validate", async () => {
        const typeDefs = /* GraphQL */ `
            type Query {
                getMovies: [Movie!]! @cypher(statement: "MATCH (m:Movie) RETURN m", columnName: "m")
            }

            type Movie
                @node
                @authorization(validate: [{ where: { node: { custom_field: { eq: "$jwt.custom_value" } } } }]) {
                title: String
                custom_field: String
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field AS s
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

        const token = createBearerToken("secret", { custom_value: "hello" });

        const query = /* GraphQL */ `
            query {
                getMovies {
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                MATCH (m:Movie) RETURN m
            }
            WITH m AS this0
            CALL (this0) {
                CALL (this0) {
                    WITH this0 AS this
                    MATCH (this)
                    RETURN this.custom_field AS s
                }
                WITH s AS this1
                RETURN this1 AS var2
            }
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND var2 IS NOT NULL AND var2 = $jwt.custom_value)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this0 { .title } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"hello\\"
                }
            }"
        `);
    });
});
