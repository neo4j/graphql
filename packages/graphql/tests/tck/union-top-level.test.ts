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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../src";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";
import { createBearerToken } from "../utils/create-bearer-token";

describe("Union top level operations", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = gql`
            union Search = Genre | Movie

            type Genre
                @authorization(
                    validate: [
                        { when: [BEFORE], operations: [READ], where: { node: { name: "$jwt.jwtAllowedNamesExample" } } }
                    ]
                ) {
                name: String
            }

            type Movie {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
            experimental: true,
        });
    });
    test("Read union ", async () => {
        const query = gql`
            {
                searches {
                    ... on Movie {
                        title
                    }
                    ... on Genre {
                        name
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:Genre)
                    WITH this0 { .name, __resolveType: \\"Genre\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this1:Movie)
                    WITH this1 { .title, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS this
                }
                RETURN this"
            `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Read union with relationship on member type", async () => {
        const query = gql`
            {
                searches {
                    ... on Movie {
                        title
                        search {
                            ... on Genre {
                                name
                            }
                        }
                    }
                    ... on Genre {
                        name
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (this0:Genre)
                    WITH this0 { .name, __resolveType: \\"Genre\\", __id: id(this0) } AS this0
                    RETURN this0 AS this
                    UNION
                    MATCH (this1:Movie)
                    CALL {
                        WITH this1
                        CALL {
                            WITH *
                            MATCH (this1)-[this2:SEARCH]->(this3:Genre)
                            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this3.name = $jwt.jwtAllowedNamesExample)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                            WITH this3 { .name, __resolveType: \\"Genre\\", __id: id(this3) } AS this3
                            RETURN this3 AS var4
                            UNION
                            WITH *
                            MATCH (this1)-[this5:SEARCH]->(this6:Movie)
                            WITH this6 { __resolveType: \\"Movie\\", __id: id(this6) } AS this6
                            RETURN this6 AS var4
                        }
                        WITH var4
                        RETURN collect(var4) AS var4
                    }
                    WITH this1 { .title, search: var4, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                    RETURN this1 AS this
                }
                RETURN this"
            `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"isAuthenticated\\": true,
                    \\"jwt\\": {
                        \\"roles\\": [],
                        \\"jwtAllowedNamesExample\\": \\"Horror\\"
                    }
                }"
            `);
    });

    test("Read union with relationship on member type with filters", async () => {
        const query = gql`
            {
                searches(where: { Movie: { title_NOT: "The Matrix" }, Genre: {} }) {
                    ... on Movie {
                        title
                        search {
                            ... on Genre {
                                name
                            }
                        }
                    }
                    ... on Genre {
                        name
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Genre)
                WITH this0 { .name, __resolveType: \\"Genre\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:Movie)
                WHERE NOT (this1.title = $param0)
                CALL {
                    WITH this1
                    CALL {
                        WITH *
                        MATCH (this1)-[this2:SEARCH]->(this3:Genre)
                        WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this3.name = $jwt.jwtAllowedNamesExample)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH this3 { .name, __resolveType: \\"Genre\\", __id: id(this3) } AS this3
                        RETURN this3 AS var4
                        UNION
                        WITH *
                        MATCH (this1)-[this5:SEARCH]->(this6:Movie)
                        WITH this6 { __resolveType: \\"Movie\\", __id: id(this6) } AS this6
                        RETURN this6 AS var4
                    }
                    WITH var4
                    RETURN collect(var4) AS var4
                }
                WITH this1 { .title, search: var4, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                RETURN this1 AS this
            }
            RETURN this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                }
            }"
        `);
    });

    test("Read union with filters  - only specifying a filter for one constituent automatically filters-out the other constituents from the return data", async () => {
        const query = gql`
            {
                searches(where: { Movie: { title_NOT: "The Matrix" } }) {
                    ... on Movie {
                        title
                        search {
                            ... on Genre {
                                name
                            }
                        }
                    }
                    ... on Genre {
                        name
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE NOT (this0.title = $param0)
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)-[this1:SEARCH]->(this2:Genre)
                        WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this2.name = $jwt.jwtAllowedNamesExample)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH this2 { .name, __resolveType: \\"Genre\\", __id: id(this2) } AS this2
                        RETURN this2 AS var3
                        UNION
                        WITH *
                        MATCH (this0)-[this4:SEARCH]->(this5:Movie)
                        WITH this5 { __resolveType: \\"Movie\\", __id: id(this5) } AS this5
                        RETURN this5 AS var3
                    }
                    WITH var3
                    RETURN collect(var3) AS var3
                }
                WITH this0 { .title, search: var3, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
            }
            RETURN this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                }
            }"
        `);
    });

    test("Read union with relationship on member type with filters on related field", async () => {
        const query = gql`
            {
                searches(where: { Movie: { searchConnection: { Genre: { node: { name: "Action" } } } } }) {
                    ... on Movie {
                        title
                        search {
                            ... on Genre {
                                name
                            }
                        }
                    }
                    ... on Genre {
                        name
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Movie)
                WHERE EXISTS {
                    MATCH (this0)-[this1:SEARCH]->(this2:Genre)
                    WHERE this2.name = $param0
                }
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)-[this3:SEARCH]->(this4:Genre)
                        WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this4.name = $jwt.jwtAllowedNamesExample)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH this4 { .name, __resolveType: \\"Genre\\", __id: id(this4) } AS this4
                        RETURN this4 AS var5
                        UNION
                        WITH *
                        MATCH (this0)-[this6:SEARCH]->(this7:Movie)
                        WITH this7 { __resolveType: \\"Movie\\", __id: id(this7) } AS this7
                        RETURN this7 AS var5
                    }
                    WITH var5
                    RETURN collect(var5) AS var5
                }
                WITH this0 { .title, search: var5, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                RETURN this0 AS this
            }
            RETURN this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Action\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                }
            }"
        `);
    });

    test("Read union with sort and filter", async () => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
            experimental: true,
        });
        const query = gql`
            {
                searches(options: { limit: 1, offset: 2 }, where: { Movie: { title_NOT: "The Matrix" }, Genre: {} }) {
                    ... on Movie {
                        title
                        search(options: { limit: 10 }, where: { Genre: { name_STARTS_WITH: "d" }, Movie: {} }) {
                            ... on Genre {
                                name
                            }
                        }
                    }
                    ... on Genre {
                        name
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this0:Genre)
                WITH this0 { .name, __resolveType: \\"Genre\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:Movie)
                WHERE NOT (this1.title = $param0)
                CALL {
                    WITH this1
                    CALL {
                        WITH *
                        MATCH (this1)-[this2:SEARCH]->(this3:Genre)
                        WHERE (this3.name STARTS WITH $param1 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this3.name = $jwt.jwtAllowedNamesExample)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                        WITH this3 { .name, __resolveType: \\"Genre\\", __id: id(this3) } AS this3
                        RETURN this3 AS var4
                        UNION
                        WITH *
                        MATCH (this1)-[this5:SEARCH]->(this6:Movie)
                        WITH this6 { __resolveType: \\"Movie\\", __id: id(this6) } AS this6
                        RETURN this6 AS var4
                    }
                    WITH var4
                    LIMIT $param4
                    RETURN collect(var4) AS var4
                }
                WITH this1 { .title, search: var4, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                RETURN this1 AS this
            }
            RETURN this
            SKIP $param5
            LIMIT $param6"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"d\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param4\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param5\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param6\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
