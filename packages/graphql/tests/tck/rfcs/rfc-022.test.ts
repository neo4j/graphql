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
import { gql } from "apollo-server";
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
                config: { enableRegex: true },
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
                    MATCH (this_actors:\`Person\`)-[this0:ACTED_IN]->(this)
                    WHERE this_actors.name = $param1
                    WITH this_actors { .name } AS this_actors
                    RETURN collect(this_actors) AS this_actors
                }
                RETURN this { .title, actors: this_actors } AS this"
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
                    MATCH (this_actors:\`Person\`)-[this0:ACTED_IN]->(this)
                    WHERE this_actors.name = $param1
                    CALL {
                        WITH this_actors
                        MATCH (this_actors)-[this1:DIRECTED]->(this_actors_directed:\`Movie\`)
                        WITH this_actors_directed { .title, .released } AS this_actors_directed
                        RETURN collect(this_actors_directed) AS this_actors_directed
                    }
                    WITH this_actors { .name, directed: this_actors_directed } AS this_actors
                    RETURN collect(this_actors) AS this_actors
                }
                RETURN this { .title, actors: this_actors } AS this"
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
                config: { enableRegex: true },
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
                    MATCH (this_actors:\`Person\`)-[this0:ACTED_IN]->(this)
                    WHERE (this_actors.name = $param1 AND (any(var2 IN [\\"admin\\"] WHERE any(var1 IN $auth.roles WHERE var1 = var2)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]) AND (this_actors.name IS NOT NULL AND this_actors.name = $param4)) AND apoc.util.validatePredicate(NOT ((any(var3 IN [\\"admin\\"] WHERE any(var2 IN $auth.roles WHERE var2 = var3)) AND apoc.util.validatePredicate(NOT ($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]) AND (this_actors.name IS NOT NULL AND this_actors.name = $param7))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    WITH this_actors { .name } AS this_actors
                    RETURN collect(this_actors) AS this_actors
                }
                RETURN this { .title, actors: this_actors } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": {
                        \\"low\\": 1999,
                        \\"high\\": 0
                    },
                    \\"param1\\": \\"Keanu Reeves\\",
                    \\"param4\\": \\"The Matrix\\",
                    \\"param7\\": \\"my-test\\",
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
