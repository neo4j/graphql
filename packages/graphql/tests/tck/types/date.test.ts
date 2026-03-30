/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Date", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                id: ID
                date: Date
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Read", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { date: { eq: "1970-01-01" } }) {
                    date
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.date = $param0
            RETURN this { .date } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 1970,
                    \\"month\\": 1,
                    \\"day\\": 1
                }
            }"
        `);
    });

    test("GTE Read", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { date: { gte: "1980-04-08" } }) {
                    date
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.date >= $param0
            RETURN this { .date } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 1980,
                    \\"month\\": 4,
                    \\"day\\": 8
                }
            }"
        `);
    });

    test("Simple Create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ date: "1970-01-01" }]) {
                    movies {
                        date
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
              SET create_this1.date = create_var0.date
              RETURN create_this1
            }
            RETURN collect(create_this1 { .date }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"date\\": {
                            \\"year\\": 1970,
                            \\"month\\": 1,
                            \\"day\\": 1
                        }
                    }
                ]
            }"
        `);
    });

    test("Simple Update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { date_SET: "1970-01-01" }) {
                    movies {
                        id
                        date
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            SET this.date = $param0
            WITH this
            RETURN this { .id, .date } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"year\\": 1970,
                    \\"month\\": 1,
                    \\"day\\": 1
                }
            }"
        `);
    });
});
