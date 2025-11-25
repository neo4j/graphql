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

import { Neo4jGraphQL } from "../../src";
import { createBearerToken } from "../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Cypher Union", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeEach(() => {
        typeDefs = /* GraphQL */ `
            union Search = Genre | Movie

            type Genre
                @node
                @authorization(
                    validate: [
                        {
                            when: [BEFORE]
                            operations: [READ]
                            where: { node: { name: { eq: "$jwt.jwtAllowedNamesExample" } } }
                        }
                    ]
                ) {
                name: String
            }

            type Movie @node {
                title: String
                search: [Search!]! @relationship(type: "SEARCH", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
    });

    test("Read Unions simple", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    search {
                        ... on Movie {
                            title
                        }
                        ... on Genre {
                            name
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)-[this0:SEARCH]->(this1:Genre)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this1.name = $jwt.jwtAllowedNamesExample)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this1 { .name, __resolveType: \\"Genre\\", __id: id(this1) } AS var2
                    RETURN var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:SEARCH]->(this4:Movie)
                    WITH this4 { .title, __resolveType: \\"Movie\\", __id: id(this4) } AS var2
                    RETURN var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { search: var2 } AS this"
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

    test("Read Unions with missing types", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    search {
                        ... on Genre {
                            name
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)-[this0:SEARCH]->(this1:Genre)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this1.name = $jwt.jwtAllowedNamesExample)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this1 { .name, __resolveType: \\"Genre\\", __id: id(this1) } AS var2
                    RETURN var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:SEARCH]->(this4:Movie)
                    WITH this4 { __resolveType: \\"Movie\\", __id: id(this4) } AS var2
                    RETURN var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { search: var2 } AS this"
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

    test("Read Unions with filter and limit", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title: { eq: "some title" } }) {
                    search(
                        where: { Movie: { title: { eq: "The Matrix" } }, Genre: { name: { eq: "Horror" } } }
                        offset: 1
                        limit: 10
                    ) {
                        ... on Movie {
                            title
                        }
                        ... on Genre {
                            name
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { jwtAllowedNamesExample: "Horror" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.title = $param0
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)-[this0:SEARCH]->(this1:Genre)
                    WHERE this1.name = $param1
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.jwtAllowedNamesExample IS NOT NULL AND this1.name = $jwt.jwtAllowedNamesExample)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this1 { .name, __resolveType: \\"Genre\\", __id: id(this1) } AS var2
                    RETURN var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:SEARCH]->(this4:Movie)
                    WHERE this4.title = $param4
                    WITH this4 { .title, __resolveType: \\"Movie\\", __id: id(this4) } AS var2
                    RETURN var2
                }
                WITH var2
                SKIP $param5
                LIMIT $param6
                RETURN collect(var2) AS var2
            }
            RETURN this { search: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": \\"Horror\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"jwtAllowedNamesExample\\": \\"Horror\\"
                },
                \\"param4\\": \\"The Matrix\\",
                \\"param5\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param6\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Create Unions from create mutation", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [{ title: "some movie", search: { Genre: { create: [{ node: { name: "some genre" } }] } } }]
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Movie)
                SET
                    this0.title = $param0
                WITH *
                CREATE (this1:Genre)
                MERGE (this0)-[this2:SEARCH]->(this1)
                SET
                    this1.name = $param1
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .title } AS var3
            }
            RETURN collect(var3) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some movie\\",
                \\"param1\\": \\"some genre\\"
            }"
        `);
    });

    test("Create Unions from update create(top-level)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { search: { Genre: { create: [{ node: { name: "some genre" } }] } } }) {
                    movies {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WITH *
            CALL (*) {
                CREATE (this0:Genre)
                MERGE (this)-[this1:SEARCH]->(this0)
                SET
                    this0.name = $param0
            }
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some genre\\"
            }"
        `);
    });

    test("Connect Unions (in create)", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            title: "some movie"
                            search: { Genre: { connect: [{ where: { node: { name: { eq: "some genre" } } } }] } }
                        }
                    ]
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:Movie)
                SET
                    this0.title = $param0
                WITH *
                CALL (this0) {
                    MATCH (this1:Genre)
                    WHERE this1.name = $param1
                    CREATE (this0)-[this2:SEARCH]->(this1)
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .title } AS var3
            }
            RETURN collect(var3) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some movie\\",
                \\"param1\\": \\"some genre\\"
            }"
        `);
    });

    test("Update Unions", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title: { eq: "some movie" } }
                    update: {
                        search: {
                            Genre: {
                                update: {
                                    where: { node: { name: { eq: "some genre" } } }
                                    node: { name_SET: "some new genre" }
                                }
                            }
                        }
                    }
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.title = $param0
            WITH *
            CALL (*) {
                MATCH (this)-[this0:SEARCH]->(this1:Genre)
                WITH *
                WHERE this1.name = $param1
                SET
                    this1.name = $param2
            }
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some movie\\",
                \\"param1\\": \\"some genre\\",
                \\"param2\\": \\"some new genre\\"
            }"
        `);
    });

    test("Disconnect Unions (in update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title: { eq: "some movie" } }
                    update: { search: { Genre: { disconnect: [{ where: { node: { name: { eq: "some genre" } } } }] } } }
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.title = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)-[this0:SEARCH]->(this1:Genre)
                    WHERE this1.name = $param1
                    WITH *
                    DELETE this0
                }
            }
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some movie\\",
                \\"param1\\": \\"some genre\\"
            }"
        `);
    });

    test("Connect Unions (in update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title: { eq: "some movie" } }
                    update: { search: { Genre: { connect: { where: { node: { name: { eq: "some genre" } } } } } } }
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.title = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Genre)
                    WHERE this0.name = $param1
                    CREATE (this)-[this1:SEARCH]->(this0)
                }
            }
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some movie\\",
                \\"param1\\": \\"some genre\\"
            }"
        `);
    });

    test("Delete Unions (from update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title: { eq: "some movie" } }
                    update: { search: { Genre: { delete: { where: { node: { name: { eq: "some genre" } } } } } } }
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const token = createBearerToken("secret", {});
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.title = $param0
            WITH *
            CALL (*) {
                OPTIONAL MATCH (this)-[this0:SEARCH]->(this1:Genre)
                WHERE this1.name = $param1
                WITH this0, collect(DISTINCT this1) AS var2
                CALL (var2) {
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some movie\\",
                \\"param1\\": \\"some genre\\"
            }"
        `);
    });
});
