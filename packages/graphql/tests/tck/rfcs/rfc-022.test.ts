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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("tck/rfs/022 subquery projection", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    describe("no auth", () => {
        beforeAll(() => {
            typeDefs = /* GraphQL */ `
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

                type ActedIn @relationshipProperties {
                    year: Int
                }
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
            });
        });

        test("Nested query", async () => {
            const query = /* GraphQL */ `
                query Query {
                    movies(where: { released: 1999 }) {
                        title
                        actors(where: { name: "Keanu Reeves" }) {
                            name
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WHERE this.released = $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
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
            const query = /* GraphQL */ `
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

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WHERE this.released = $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                    WHERE this1.name = $param1
                    CALL {
                        WITH this1
                        MATCH (this1)-[this2:DIRECTED]->(this3:Movie)
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
            typeDefs = /* GraphQL */ `
                type JWT @jwt {
                    roles: [String!]!
                }

                type Movie {
                    title: String!
                    released: Int
                    actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                }

                type Person
                    @authorization(
                        filter: [{ where: { node: { name: "The Matrix" } } }]
                        validate: [
                            { when: [BEFORE], where: { node: { name: "$jwt.test" }, jwt: { roles_INCLUDES: "admin" } } }
                        ]
                    ) {
                    name: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                }

                type ActedIn @relationshipProperties {
                    year: Int
                }
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
        });

        test("Nested query", async () => {
            const query = /* GraphQL */ `
                query Query {
                    movies(where: { released: 1999 }) {
                        title
                        actors(where: { name: "Keanu Reeves" }) {
                            name
                        }
                    }
                }
            `;

            const token = createBearerToken("secret", {
                test: "my-test",
            });
            const result = await translateQuery(neoSchema, query, {
                token,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WHERE this.released = $param0
                CALL {
                    WITH this
                    MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                    WITH *
                    WHERE (this1.name = $param1 AND ($isAuthenticated = true AND ($param3 IS NOT NULL AND this1.name = $param3)) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.test IS NOT NULL AND this1.name = $jwt.test) AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
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
                    \\"param1\\": \\"Keanu Reeves\\",
                    \\"isAuthenticated\\": true,
                    \\"param3\\": \\"The Matrix\\",
                    \\"jwt\\": {
                        \\"roles\\": [],
                        \\"test\\": \\"my-test\\"
                    },
                    \\"param5\\": \\"admin\\"
                }"
            `);
        });
    });
});
