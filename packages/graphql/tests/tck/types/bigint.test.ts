/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher BigInt", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type File @node {
                name: String!
                size: BigInt!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Querying with native BigInt in AST", async () => {
        const query = /* GraphQL */ `
            query {
                files(where: { size: { eq: 9223372036854775807 } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:File)
            WHERE this.size = $param0
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": -1,
                    \\"high\\": 2147483647
                }
            }"
        `);
    });

    test("Querying with BigInt as string in AST", async () => {
        const query = /* GraphQL */ `
            query {
                files(where: { size: { eq: "9223372036854775807" } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:File)
            WHERE this.size = $param0
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": -1,
                    \\"high\\": 2147483647
                }
            }"
        `);
    });

    test("Querying with BigInt as string in variables", async () => {
        const query = /* GraphQL */ `
            query Files($size: BigInt) {
                files(where: { size: { eq: $size } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: { size: "9223372036854775807" },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:File)
            WHERE this.size = $param0
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": -1,
                    \\"high\\": 2147483647
                }
            }"
        `);
    });
});
