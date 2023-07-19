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

describe("Cypher WHERE", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                isFavorite: Boolean
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple", async () => {
        const query = gql`
            query ($title: String, $isFavorite: Boolean) {
                movies(where: { title: $title, isFavorite: $isFavorite }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: { title: "some title", isFavorite: true },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE (this.title = $param0 AND this.isFavorite = $param1)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": true
            }"
        `);
    });

    test("Simple AND", async () => {
        const query = gql`
            {
                movies(where: { AND: [{ title: "some title" }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    test("Simple AND with multiple parameters", async () => {
        const query = gql`
            {
                movies(where: { AND: [{ title: "some title" }, { isFavorite: true }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE (this.title = $param0 AND this.isFavorite = $param1)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": true
            }"
        `);
    });

    test("Nested AND", async () => {
        const query = gql`
            {
                movies(where: { AND: [{ AND: [{ title: "some title" }] }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    test("Nested AND with multiple properties", async () => {
        const query = gql`
            {
                movies(where: { AND: [{ AND: [{ title: "some title" }, { title: "another title" }] }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE (this.title = $param0 AND this.title = $param1)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": \\"another title\\"
            }"
        `);
    });

    test("Nested AND and OR", async () => {
        const query = gql`
            {
                movies(where: { AND: [{ OR: [{ title: "some title" }, { isFavorite: true }], id: 2 }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE ((this.title = $param0 OR this.isFavorite = $param1) AND this.id = $param2)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": true,
                \\"param2\\": \\"2\\"
            }"
        `);
    });

    test("Super Nested AND", async () => {
        const query = gql`
            {
                movies(where: { AND: [{ AND: [{ AND: [{ title: "some title" }] }] }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    test("Simple OR", async () => {
        const query = gql`
            {
                movies(where: { OR: [{ title: "some title" }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    test("Nested OR", async () => {
        const query = gql`
            {
                movies(where: { OR: [{ OR: [{ title: "some title" }] }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    test("Super Nested OR", async () => {
        const query = gql`
            {
                movies(where: { OR: [{ OR: [{ OR: [{ title: "some title" }] }] }] }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    describe("Where with null", () => {
        test("Match with NULL in where", async () => {
            const query = gql`
                {
                    movies(where: { title: null }) {
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WHERE this.title IS NULL
                RETURN this { .title } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });

        test("Match with not NULL in where", async () => {
            const query = gql`
                {
                    movies(where: { title_NOT: null }) {
                        title
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                WHERE this.title IS NOT NULL
                RETURN this { .title } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
        });
    });

    test("Simple NOT", async () => {
        const query = gql`
            {
                movies(where: { NOT: { title: "some title" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE NOT (this.title = $param0)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    test("Simple NOT, implicit AND", async () => {
        const query = gql`
            {
                movies(where: { NOT: { title: "some title", isFavorite: false } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE NOT (this.title = $param0 AND this.isFavorite = $param1)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": false
            }"
        `);
    });
});
