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
import { Neo4jGraphQL } from "../../src";
import { createJwtRequest } from "../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";

describe("Cypher sort tests", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                id: ID
                title: String
                genres: [Genre!]! @relationship(type: "HAS_GENRE", direction: OUT)
                totalGenres: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre) as result
                        """
                        columnName: "result"
                    )
            }

            type Genre {
                id: ID
                name: String
                totalMovies: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                        RETURN count(DISTINCT movie) as result
                        """
                        columnName: "result"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    describe("Simple Sort", () => {
        test("with field in selection set", async () => {
            const query = gql`
                {
                    movies(options: { sort: [{ id: DESC }] }) {
                        id
                        title
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                WITH *
                ORDER BY this.id DESC
                RETURN this { .id, .title } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("with field aliased in selection set", async () => {
            const query = gql`
                {
                    movies(options: { sort: [{ id: DESC }] }) {
                        aliased: id
                        title
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                WITH *
                ORDER BY this.id DESC
                RETURN this { aliased: this.id, .title, .id } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("with field not in selection set", async () => {
            const query = gql`
                {
                    movies(options: { sort: [{ id: DESC }] }) {
                        title
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                WITH *
                ORDER BY this.id DESC
                RETURN this { .title, .id } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });

    test("Simple Sort On Cypher Field", async () => {
        const query = gql`
            {
                movies(options: { sort: [{ totalGenres: DESC }] }) {
                    totalGenres
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                    RETURN count(DISTINCT genre) as result
                }
                UNWIND result AS this0
                RETURN head(collect(this0)) AS this0
            }
            WITH *
            ORDER BY this0 DESC
            RETURN this { totalGenres: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Multi Sort", async () => {
        const query = gql`
            {
                movies(options: { sort: [{ id: DESC }, { title: ASC }] }) {
                    id
                    title
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WITH *
            ORDER BY this.id DESC, this.title ASC
            RETURN this { .id, .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Sort with offset limit & with other variables", async () => {
        const query = gql`
            query ($title: String, $offset: Int, $limit: Int) {
                movies(
                    options: { sort: [{ id: DESC }, { title: ASC }], offset: $offset, limit: $limit }
                    where: { title: $title }
                ) {
                    id
                    title
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: { limit: 2, offset: 1, title: "some title" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WHERE this.title = $param0
            WITH *
            ORDER BY this.id DESC, this.title ASC
            SKIP $param1
            LIMIT $param2
            RETURN this { .id, .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param2\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Nested Sort DESC", async () => {
        const query = gql`
            {
                movies {
                    genres(options: { sort: [{ name: DESC }] }) {
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
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_GENRE]->(this1:\`Genre\`)
                WITH this1 { .name } AS this1
                ORDER BY this1.name DESC
                RETURN collect(this1) AS var2
            }
            RETURN this { genres: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested Sort ASC", async () => {
        const query = gql`
            {
                movies {
                    genres(options: { sort: [{ name: ASC }] }) {
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
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_GENRE]->(this1:\`Genre\`)
                WITH this1 { .name } AS this1
                ORDER BY this1.name ASC
                RETURN collect(this1) AS var2
            }
            RETURN this { genres: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested Sort On Cypher Field ASC", async () => {
        const query = gql`
            {
                movies {
                    genres(options: { sort: [{ totalMovies: ASC }] }) {
                        name
                        totalMovies
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
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_GENRE]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    CALL {
                        WITH this1
                        WITH this1 AS this
                        MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                        RETURN count(DISTINCT movie) as result
                    }
                    UNWIND result AS this2
                    RETURN head(collect(this2)) AS this2
                }
                WITH this1 { .name, totalMovies: this2 } AS this1
                ORDER BY this1.totalMovies ASC
                RETURN collect(this1) AS var3
            }
            RETURN this { genres: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
