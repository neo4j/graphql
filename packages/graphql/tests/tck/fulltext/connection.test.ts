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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher -> fulltext -> Connection", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie @fulltext(indexes: [{ indexName: "MovieTitle", fields: ["title"] }]) {
                title: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("connection with fulltext and default index", async () => {
        const query = gql`
            query {
                moviesConnection(fulltext: { phrase: "something AND something" }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this, score
            WHERE \\"Movie\\" IN labels(this)
            WITH collect({ this: this, score: score }) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS var0
            WITH var0.this AS this, totalCount, var0.score AS score
            WITH { node: this { .title }, fulltext: { score: score } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\"
            }"
        `);
    });

    test("connection with fulltext, score and default index", async () => {
        const query = gql`
            query {
                moviesConnection(fulltext: { phrase: "something AND something" }) {
                    edges {
                        node {
                            title
                        }
                        fulltext {
                            score
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this, score
            WHERE \\"Movie\\" IN labels(this)
            WITH collect({ this: this, score: score }) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS var0
            WITH var0.this AS this, totalCount, var0.score AS score
            WITH { node: this { .title }, fulltext: { score: score } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\"
            }"
        `);
    });

    test("match with where and single fulltext property", async () => {
        const query = gql`
            query {
                movies(fulltext: { phrase: "something AND something" }, where: { title: "some-title" }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL db.index.fulltext.queryNodes(\\"MovieTitle\\", $param0) YIELD node AS this, score
            WHERE (this.title = $param1 AND \\"Movie\\" IN labels(this))
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\",
                \\"param1\\": \\"some-title\\"
            }"
        `);
    });
});
