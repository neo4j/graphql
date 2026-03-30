/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Simple Cypher tests", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                id: ID
                title: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Single selection, Movie by title", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title: { eq: "River Runs Through It, A" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"River Runs Through It, A\\"
            }"
        `);
    });

    test("Multi selection, Movie by title", async () => {
        const query = /* GraphQL */ `
            {
                movies(where: { title: { eq: "River Runs Through It, A" } }) {
                    id
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .id, .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"River Runs Through It, A\\"
            }"
        `);
    });

    test("Multi selection, Movie by title via variable", async () => {
        const query = /* GraphQL */ `
            query ($title: String) {
                movies(where: { title: { eq: $title } }) {
                    id
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: { title: "some title" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.title = $param0
            RETURN this { .id, .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });
});
