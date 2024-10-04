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

describe("cypher directive filtering - List Auth", () => {
    test("With authorization on type using @cypher return value", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(filter: [{ where: { node: { custom_list_INCLUDES: "$jwt.custom_value" } } }]) {
                title: String
                custom_list: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as list
                        """
                        columnName: "list"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const token = createBearerToken("secret", { custom_value: "a" });

        const query = /* GraphQL */ `
            query {
                movies {
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
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)
                    RETURN this.custom_field as list
                }
                UNWIND list AS var0
                WITH var0 AS this1
                RETURN collect(this1) AS var2
            }
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND var2 IS NOT NULL AND $jwt.custom_value IN var2))
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"a\\"
                }
            }"
        `);
    });

    test("With authorization on @cypher field using @cypher return value", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                custom_list: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as list
                        """
                        columnName: "list"
                    )
                    @authorization(filter: [{ where: { node: { custom_list_INCLUDES: "$jwt.custom_value" } } }])
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const token = createBearerToken("secret", { custom_value: "hello" });

        const query = /* GraphQL */ `
            query {
                movies {
                    custom_list
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
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)
                    RETURN this.custom_field as list
                }
                UNWIND list AS var0
                WITH var0 AS this1
                RETURN collect(this1) AS var2
            }
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND var2 IS NOT NULL AND $jwt.custom_value IN var2))
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)
                    RETURN this.custom_field as list
                }
                UNWIND list AS var3
                WITH var3 AS this4
                RETURN collect(this4) AS var5
            }
            RETURN this { custom_list: var5 } AS this"
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
            type Movie @node {
                title: String
                custom_list: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as list
                        """
                        columnName: "list"
                    )
                    @authorization(filter: [{ where: { node: { title: "$jwt.custom_value" } } }])
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const token = createBearerToken("secret", { custom_value: "hello" });

        const query = /* GraphQL */ `
            query {
                movies {
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
            "MATCH (this:Movie)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("With authorization on Actor type field using nested Movie's @cypher field return value", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                custom_list: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as list
                        """
                        columnName: "list"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor
                @authorization(filter: [{ where: { node: { movies_SOME: { custom_list: "$jwt.custom_value" } } } }]) {
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
            "MATCH (this:Actor)
            CALL {
                WITH this
                MATCH (this)-[:ACTED_IN]->(this0:Movie)
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (this)
                        RETURN this.custom_field as list
                    }
                    UNWIND list AS var1
                    WITH var1 AS this2
                    RETURN collect(this2) AS var3
                }
                WITH *
                WHERE ($jwt.custom_value IS NOT NULL AND var3 IS NOT NULL AND var3 = $jwt.custom_value)
                RETURN count(this0) > 0 AS var4
            }
            WITH *
            WHERE ($isAuthenticated = true AND var4 = true)
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
            type Movie @node {
                title: String
                    @authorization(filter: [{ where: { node: { custom_list_INCLUDES: "$jwt.custom_value" } } }])
                custom_list: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN this.custom_field as list
                        """
                        columnName: "list"
                    )
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const token = createBearerToken("secret", { custom_value: "hello" });

        const query = /* GraphQL */ `
            query {
                movies {
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
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)
                    RETURN this.custom_field as list
                }
                UNWIND list AS var0
                WITH var0 AS this1
                RETURN collect(this1) AS var2
            }
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND var2 IS NOT NULL AND $jwt.custom_value IN var2))
            RETURN this { .title } AS this"
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
            type Movie
                @node
                @authorization(validate: [{ where: { node: { custom_list_INCLUDES: "$jwt.custom_value" } } }]) {
                title: String
                custom_list: [String]
                    @cypher(
                        statement: """
                        MATCH (this)
                        RETURN ['a', 'b', 'c'] as list
                        """
                        columnName: "list"
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
                movies {
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
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)
                    RETURN ['a', 'b', 'c'] as list
                }
                UNWIND list AS var0
                WITH var0 AS this1
                RETURN collect(this1) AS var2
            }
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.custom_value IS NOT NULL AND var2 IS NOT NULL AND $jwt.custom_value IN var2)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title } AS this"
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
