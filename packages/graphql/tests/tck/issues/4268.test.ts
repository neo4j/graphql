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
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4268", () => {
    test("OR operator should work correctly", async () => {
        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
            }

            type Movie
                @node
                @authorization(
                    validate: [
                        { when: [BEFORE], where: { jwt: { OR: [{ roles_EQ: "admin" }, { roles_EQ: "super-admin" }] } } }
                    ]
                ) {
                title: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const query = /* GraphQL */ `
            query {
                movies {
                    title
                }
            }
        `;

        const token = createBearerToken("secret", { roles: ["admin"], id: "something", email: "something" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $jwt.roles = $param2) OR ($jwt.roles IS NOT NULL AND $jwt.roles = $param3))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"id\\": \\"something\\",
                    \\"email\\": \\"something\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"super-admin\\"
            }"
        `);
    });

    test("Nested OR operator should work correctly", async () => {
        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
            }

            type Movie
                @node
                @authorization(
                    validate: [
                        {
                            when: [BEFORE]
                            where: {
                                jwt: {
                                    OR: [
                                        { OR: [{ roles: "admin" }, { roles: "super-admin" }] }
                                        { OR: [{ roles: "user" }, { roles: "super-user" }] }
                                    ]
                                }
                            }
                        }
                    ]
                ) {
                title: String
                director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person @node {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const query = /* GraphQL */ `
            query {
                movies {
                    title
                }
            }
        `;

        const token = createBearerToken("secret", { roles: ["admin"], id: "something", email: "something" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ((($jwt.roles IS NOT NULL AND $jwt.roles = $param2) OR ($jwt.roles IS NOT NULL AND $jwt.roles = $param3)) OR (($jwt.roles IS NOT NULL AND $jwt.roles = $param4) OR ($jwt.roles IS NOT NULL AND $jwt.roles = $param5)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"id\\": \\"something\\",
                    \\"email\\": \\"something\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"super-admin\\",
                \\"param4\\": \\"user\\",
                \\"param5\\": \\"super-user\\"
            }"
        `);
    });

    test("AND operator should work correctly", async () => {
        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
            }

            type Movie
                @node
                @authorization(
                    validate: [
                        { when: [BEFORE], where: { jwt: { AND: [{ roles_EQ: "admin" }, { roles_EQ: "super-admin" }] } } }
                    ]
                ) {
                title: String
                director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person @node {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const query = /* GraphQL */ `
            query {
                movies {
                    title
                }
            }
        `;

        const token = createBearerToken("secret", { roles: ["admin"], id: "something", email: "something" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $jwt.roles = $param2) AND ($jwt.roles IS NOT NULL AND $jwt.roles = $param3))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"id\\": \\"something\\",
                    \\"email\\": \\"something\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"super-admin\\"
            }"
        `);
    });

    test("Nested AND operator should work correctly", async () => {
        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
            }

            type Movie
                @node
                @authorization(
                    validate: [
                        {
                            when: [BEFORE]
                            where: {
                                jwt: {
                                    AND: [
                                        { AND: [{ roles_EQ: "admin" }, { roles_EQ: "super-admin" }] }
                                        { AND: [{ roles_EQ: "user" }, { roles_EQ: "super-user" }] }
                                    ]
                                }
                            }
                        }
                    ]
                ) {
                title: String
                director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person @node {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const query = /* GraphQL */ `
            query {
                movies {
                    title
                }
            }
        `;

        const token = createBearerToken("secret", { roles: ["admin"], id: "something", email: "something" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ((($jwt.roles IS NOT NULL AND $jwt.roles = $param2) AND ($jwt.roles IS NOT NULL AND $jwt.roles = $param3)) AND (($jwt.roles IS NOT NULL AND $jwt.roles = $param4) AND ($jwt.roles IS NOT NULL AND $jwt.roles = $param5)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"id\\": \\"something\\",
                    \\"email\\": \\"something\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"super-admin\\",
                \\"param4\\": \\"user\\",
                \\"param5\\": \\"super-user\\"
            }"
        `);
    });

    test("NOT operator should work correctly", async () => {
        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
            }

            type Movie
                @authorization(validate: [{ when: [BEFORE], where: { jwt: { NOT: { roles_EQ: "admin" } } } }])
                @node {
                title: String
                director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person @node {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const query = /* GraphQL */ `
            query {
                movies {
                    title
                }
            }
        `;

        const token = createBearerToken("secret", { roles: ["admin"], id: "something", email: "something" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND NOT ($jwt.roles IS NOT NULL AND $jwt.roles = $param2)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"id\\": \\"something\\",
                    \\"email\\": \\"something\\"
                },
                \\"param2\\": \\"admin\\"
            }"
        `);
    });

    test("Nested NOT operator should work correctly", async () => {
        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
            }

            type Movie
                @node
                @authorization(validate: [{ when: [BEFORE], where: { jwt: { NOT: { NOT: { roles_EQ: "admin" } } } } }]) {
                title: String
                director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person @node {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const query = /* GraphQL */ `
            query {
                movies {
                    title
                }
            }
        `;

        const token = createBearerToken("secret", { roles: ["admin"], id: "something", email: "something" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND NOT (NOT ($jwt.roles IS NOT NULL AND $jwt.roles = $param2))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"id\\": \\"something\\",
                    \\"email\\": \\"something\\"
                },
                \\"param2\\": \\"admin\\"
            }"
        `);
    });
});
