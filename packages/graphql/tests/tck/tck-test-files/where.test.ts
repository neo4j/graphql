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
            config: { enableRegex: true },
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
            variableValues: { title: "some title", isFavorite: true },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.title = $param0
            AND this0.isFavorite = $param1
            RETURN this { .title } as this"
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.title = $param0
            RETURN this { .title } as this"
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE (this0.title = $param0
            AND this0.isFavorite = $param1)
            RETURN this { .title } as this"
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.title = $param0
            RETURN this { .title } as this"
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE (this0.title = $param0
            AND this0.title = $param1)
            RETURN this { .title } as this"
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE (this0.id = $param0
            AND (this0.title = $param1
            OR this0.isFavorite = $param2))
            RETURN this { .title } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2\\",
                \\"param1\\": \\"some title\\",
                \\"param2\\": true
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.title = $param0
            RETURN this { .title } as this"
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.title = $param0
            RETURN this { .title } as this"
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.title = $param0
            RETURN this { .title } as this"
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.title = $param0
            RETURN this { .title } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    test("OR and default and", async () => {
        const query = gql`
            query {
                movies(where: { isFavorite: true, id: 2, OR: [{ title: "title1" }, { title: "title2" }] }) {
                    title
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:\`Movie\`)
            WHERE this0.id = $param0
            AND this0.isFavorite = $param1
            AND (this0.title = $param2
            OR this0.title = $param3)
            RETURN this { .title } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2\\",
                \\"param1\\": true,
                \\"param2\\": \\"title1\\",
                \\"param3\\": \\"title2\\"
            }"
        `);
    });

    test("Simple IN", async () => {
        const query = gql`
            {
                movies(where: { title_IN: ["some title"] }) {
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
            WHERE this.title IN $this_title_IN
            RETURN this { .title } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_title_IN\\": [
                    \\"some title\\"
                ]
            }"
        `);
    });
});
