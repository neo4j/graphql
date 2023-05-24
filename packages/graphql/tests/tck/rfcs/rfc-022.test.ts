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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("tck/rfs/022 subquery projection", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    describe("no auth", () => {
        beforeAll(() => {
            typeDefs = gql`
                type Movie {
                    title: String!
                    released: Int
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                    directors: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                }

                type Person {
                    name: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                    directed: [Movie!]! @relationship(type: "DIRECTED", direction: OUT)
                }

                interface ActedIn @relationshipProperties {
                    year: Int
                }
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });
        });

        test("Nested query", async () => {
            const query = gql`
                query Query {
                    movies(where: { released: 1999 }) {
                        title
                        actors(where: { name: "Keanu Reeves" }) {
                            name
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                WHERE this.released = $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:\`Person\`)
                    WHERE this1.name = $param1
                    WITH this1 { .name } AS this1
                    RETURN collect(this1) AS var2
                }
                RETURN this { .title, actors: var2 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 1999,
                        \\"high\\": 0
                    },
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
        });

        test("Double nested query", async () => {
            const query = gql`
                query Query {
                    movies(where: { released: 1999 }) {
                        title
                        actors(where: { name: "Keanu Reeves" }) {
                            name
                            directed {
                                title
                                released
                            }
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                WHERE this.released = $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:\`Person\`)
                    WHERE this1.name = $param1
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:DIRECTED]->(this3:\`Movie\`)
                        WITH this3 { .title, .released } AS this3
                        RETURN collect(this3) AS var4
                    }
                    WITH this1 { .name, directed: var4 } AS this1
                    RETURN collect(this1) AS var5
                }
                RETURN this { .title, actors: var5 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 1999,
                        \\"high\\": 0
                    },
                    \\"param1\\": \\"Keanu Reeves\\"
                }"
            `);
        });
    });

    describe("With auth", () => {
        beforeAll(() => {
            typeDefs = gql`
                type Movie {
                    title: String!
                    released: Int
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                }

                type Person
                    @auth(
                        rules: [
                            {
                                isAuthenticated: true
                                where: { name: "The Matrix" }
                                allow: { name: "$jwt.test" }
                                roles: ["admin"]
                            }
                        ]
                    ) {
                    name: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                }

                interface ActedIn @relationshipProperties {
                    year: Int
                }
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret: "secret",
                    }),
                },
            });
        });

        test("Nested query", async () => {
            const query = gql`
                query Query {
                    movies(where: { released: 1999 }) {
                        title
                        actors(where: { name: "Keanu Reeves" }) {
                            name
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {
                test: "my-test",
            });
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                WHERE this.released = $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:\`Person\`)
                    WHERE (this1.name = $param1 AND (any(var3 IN [\\"admin\\"] WHERE any(var2 IN $auth.roles WHERE var2 = var3)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]) AND (this1.name IS NOT NULL AND this1.name = $param3)) AND apoc.util.validatePredicate(NOT ((any(var5 IN [\\"admin\\"] WHERE any(var4 IN $auth.roles WHERE var4 = var5)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]) AND (this1.name IS NOT NULL AND this1.name = $param5))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    WITH this1 { .name } AS this1
                    RETURN collect(this1) AS var6
                }
                RETURN this { .title, actors: var6 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 1999,
                        \\"high\\": 0
                    },
                    \\"param1\\": \\"Keanu Reeves\\",
                    \\"param3\\": \\"The Matrix\\",
                    \\"param5\\": \\"my-test\\",
                    \\"auth\\": {
                        \\"isAuthenticated\\": true,
                        \\"roles\\": [],
                        \\"jwt\\": {
                            \\"roles\\": [],
                            \\"test\\": \\"my-test\\"
                        }
                    }
                }"
            `);
        });
    });
});
