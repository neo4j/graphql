/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Duration", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                id: ID
                duration: Duration
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Read", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { duration: { eq: "P1Y" } }) {
                    duration
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.duration = $param0
            RETURN this { .duration } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("GTE Read", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { duration: { gte: "P3Y4M" } }) {
                    duration
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE (datetime() + this.duration) >= (datetime() + $param0)
            RETURN this { .duration } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 40,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("Simple Create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ duration: "P2Y" }]) {
                    movies {
                        duration
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
              CREATE (create_this1:Movie)
              SET create_this1.duration = create_var0.duration
              RETURN create_this1
            }
            RETURN collect(create_this1 { .duration }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"duration\\": {
                            \\"months\\": 24,
                            \\"days\\": 0,
                            \\"seconds\\": 0,
                            \\"nanoseconds\\": 0
                        }
                    }
                ]
            }"
        `);
    });

    test("Simple Update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { duration_SET: "P4D" }) {
                    movies {
                        id
                        duration
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            SET this.duration = $param0
            WITH this
            RETURN this { .id, .duration } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 0,
                    \\"days\\": 4,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });
});
