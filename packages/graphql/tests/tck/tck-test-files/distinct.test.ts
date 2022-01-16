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

describe("Cypher distinct tests", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                id: ID
                title: String
                genres: [Genre] @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Genre {
                id: ID
                name: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("distinct", async () => {
        const query = gql`
            {
                movies(options: { distinct: true }) {
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
            RETURN DISTINCT this { .title } as this"
        `);
    });

    test("distinct relations", async () => {
        const query = gql`
            {
                movies {
                    title
                    genres(options: { distinct: true }) {
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
            RETURN this { .title, genres: apoc.coll.toSet([ (this)-[:HAS_GENRE]->(this_genres:Genre)   | this_genres { .name } ]) } as this"
        `);
    });

    test("distinct + Limit", async () => {
        const query = gql`
            {
                movies(options: { limit: 1, offset: 2, distinct: true }) {
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
            RETURN DISTINCT this { .title } as this
            SKIP $this_offset
            LIMIT $this_limit"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_offset\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"this_limit\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("distinct + Limit + Sort", async () => {
        const query = gql`
            query($offset: Int, $limit: Int) {
                movies(options: { limit: $limit, offset: $offset, sort: [{ id: DESC }, { title: ASC }], distinct: true }) {
                    id
                    title
                    genres(options: { limit: $limit, offset: $offset, sort: [{ name: ASC }], distinct: true }) {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: { offset: 0, limit: 0 },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            RETURN DISTINCT this { .id, .title, genres: apoc.coll.toSet(apoc.coll.sortMulti([ (this)-[:HAS_GENRE]->(this_genres:Genre)   | this_genres { .name } ], ['^name']))[0..0] } as this
            ORDER BY this.id DESC, this.title ASC
            SKIP $this_offset
            LIMIT $this_limit"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_offset\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"this_limit\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("distinct + Limit + Sort with other filters", async () => {
        const query = gql`
            query($offset: Int, $limit: Int, $title: String) {
                movies(options: { limit: $limit, offset: $offset, sort: [{ id: DESC }, { title: ASC }], distinct: true }, where: { title: $title }) {
                    id
                    title
                    genres(options: { limit: $limit, offset: $offset, sort: [{ name: ASC }], distinct: true }) {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: { limit: 1, offset: 2, title: "some title" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $this_title
            RETURN DISTINCT this { .id, .title, genres: apoc.coll.toSet(apoc.coll.sortMulti([ (this)-[:HAS_GENRE]->(this_genres:Genre)   | this_genres { .name } ], ['^name']))[2..3] } as this
            ORDER BY this.id DESC, this.title ASC
            SKIP $this_offset
            LIMIT $this_limit"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title\\": \\"some title\\",
                \\"this_offset\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"this_limit\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
