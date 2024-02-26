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

describe("Union top level operations with authorization", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = /* GraphQL */ `
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
        });
    });
    test("Read union", async () => {
        const query = /* GraphQL */ `
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
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.name = $jwt.jwtAllowedNamesExample)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0 { .name, __resolveType: \\"Genre\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:Movie)
                WITH this1 { .title, __resolveType: \\"Movie\\", __id: id(this1) } AS this1
                RETURN this1 AS this
            }
            WITH this
            RETURN this AS this"
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

    test("Read union with relationship on member type", async () => {
        const query = /* GraphQL */ `
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
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.name = $jwt.jwtAllowedNamesExample)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
            WITH this
            RETURN this AS this"
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
        const query = /* GraphQL */ `
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
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this0.name = $jwt.jwtAllowedNamesExample)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0 { .name, __resolveType: \\"Genre\\", __id: id(this0) } AS this0
                RETURN this0 AS this
                UNION
                MATCH (this1:Movie)
                WHERE NOT (this1.title = $param2)
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
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param2\\": \\"The Matrix\\"
            }"
        `);
    });

    test("Read union with filters  - only specifying a filter for one constituent automatically filters-out the other constituents from the return data", async () => {
        const query = /* GraphQL */ `
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
            WITH this
            RETURN this AS this"
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
        const query = /* GraphQL */ `
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
            WITH this
            RETURN this AS this"
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
});
