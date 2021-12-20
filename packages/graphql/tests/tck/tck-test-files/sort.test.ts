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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher sort tests", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                id: ID
                title: String
                genres: [Genre] @relationship(type: "HAS_GENRE", direction: OUT)
                totalGenres: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre)
                        """
                    )
            }

            type Genre {
                id: ID
                name: String
                totalMovies: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                        RETURN count(DISTINCT movie)
                        """
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Simple Sort", async () => {
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
            "MATCH (this:Movie)
            RETURN this { .title } as this
            ORDER BY this.id DESC"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
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
            "MATCH (this:Movie)
            RETURN this { totalGenres:  apoc.cypher.runFirstColumn(\\"MATCH (this)-[:HAS_GENRE]->(genre:Genre)
            RETURN count(DISTINCT genre)\\", {this: this, auth: $auth}, false) } as this
            ORDER BY this.totalGenres DESC"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                }
            }"
        `);
    });

    test("Multi Sort", async () => {
        const query = gql`
            {
                movies(options: { sort: [{ id: DESC }, { title: ASC }] }) {
                    title
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            RETURN this { .title } as this
            ORDER BY this.id DESC, this.title ASC"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Sort with offset limit & with other variables", async () => {
        const query = gql`
            query($title: String, $offset: Int, $limit: Int) {
                movies(
                    options: { sort: [{ id: DESC }, { title: ASC }], offset: $offset, limit: $limit }
                    where: { title: $title }
                ) {
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
            "CALL {
            MATCH (this:Movie)
            WHERE this.title = $this_title
            RETURN this
            ORDER BY this.id DESC, this.title ASC
            SKIP $this_offset
            LIMIT $this_limit
            }
            RETURN this { .title } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"some title\\",
                \\"this_offset\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"this_limit\\": {
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
            "MATCH (this:Movie)
            RETURN this { genres: apoc.coll.sortMulti([ (this)-[:HAS_GENRE]->(this_genres:Genre)   | this_genres { .name } ], ['name']) } as this"
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
            "MATCH (this:Movie)
            RETURN this { genres: apoc.coll.sortMulti([ (this)-[:HAS_GENRE]->(this_genres:Genre)   | this_genres { .name } ], ['^name']) } as this"
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
            "MATCH (this:Movie)
            RETURN this { genres: apoc.coll.sortMulti([ (this)-[:HAS_GENRE]->(this_genres:Genre)   | this_genres { .name, totalMovies:  apoc.cypher.runFirstColumn(\\"MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
            RETURN count(DISTINCT movie)\\", {this: this_genres, auth: $auth}, false) } ], ['^totalMovies']) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                }
            }"
        `);
    });
});
