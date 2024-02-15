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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher -> fulltext -> Score", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @fulltext(indexes: [{ name: "MovieTitle", fields: ["title"] }]) {
                title: String
                released: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("simple match with single property and score", async () => {
        const query = /* GraphQL */ `
            query {
                moviesFulltextMovieTitle(phrase: "a different name") {
                    score
                    movie {
                        title
                        released
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
            WHERE $param1 IN labels(this0)
            RETURN this0 { .title, .released } AS movie, var1 AS score"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });

    test("simple match with single property and score and filter", async () => {
        const query = /* GraphQL */ `
            query {
                moviesFulltextMovieTitle(phrase: "a different name", where: { movie: { released_GT: 2000 } }) {
                    score
                    movie {
                        title
                        released
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
            WHERE ($param1 IN labels(this0) AND this0.released > $param2)
            RETURN this0 { .title, .released } AS movie, var1 AS score"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\",
                \\"param2\\": {
                    \\"low\\": 2000,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("with score filtering", async () => {
        const query = /* GraphQL */ `
            query {
                moviesFulltextMovieTitle(phrase: "a different name", where: { score: { min: 0.5 } }) {
                    score
                    movie {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
            WHERE ($param1 IN labels(this0) AND var1 >= $param2)
            RETURN this0 { .title } AS movie, var1 AS score"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\",
                \\"param2\\": 0.5
            }"
        `);
    });

    test("with sorting", async () => {
        const query = /* GraphQL */ `
            query {
                moviesFulltextMovieTitle(phrase: "a different name", sort: { movie: { title: DESC } }) {
                    score
                    movie {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
            WHERE $param1 IN labels(this0)
            WITH *
            ORDER BY this0.title DESC
            RETURN this0 { .title } AS movie, var1 AS score"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });

    test("with score sorting", async () => {
        const query = /* GraphQL */ `
            query {
                moviesFulltextMovieTitle(phrase: "a different name", sort: { score: ASC }) {
                    score
                    movie {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
            WHERE $param1 IN labels(this0)
            WITH *
            ORDER BY var1 ASC
            RETURN this0 { .title } AS movie, var1 AS score"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });

    test("with score and normal sorting", async () => {
        const query = /* GraphQL */ `
            query {
                moviesFulltextMovieTitle(
                    phrase: "a different name"
                    sort: [{ score: ASC }, { movie: { title: DESC } }]
                ) {
                    score
                    movie {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this0, score AS var1
            WHERE $param1 IN labels(this0)
            WITH *
            ORDER BY var1 ASC, this0.title DESC
            RETURN this0 { .title } AS movie, var1 AS score"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });
});
