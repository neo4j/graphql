/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher DateTime", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                id: ID
                datetime: DateTime
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Read", async () => {
        const query = /* GraphQL */ `
            query {
                movies(where: { datetime: { eq: "1970-01-01T00:00:00.000Z" } }) {
                    datetime
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WHERE this.datetime = datetime($param0)
            RETURN this { datetime: apoc.date.convertFormat(toString(this.datetime), 'iso_zoned_date_time', 'iso_offset_date_time') } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1970-01-01T00:00:00.000Z\\"
            }"
        `);
    });

    test("Simple Create", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ datetime: "1970-01-01T00:00:00.000Z" }]) {
                    movies {
                        datetime
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
              SET create_this1.datetime = datetime(create_var0.datetime)
              RETURN create_this1
            }
            RETURN collect(create_this1 { datetime: apoc.date.convertFormat(toString(create_this1.datetime), 'iso_zoned_date_time', 'iso_offset_date_time') }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"datetime\\": \\"1970-01-01T00:00:00.000Z\\"
                    }
                ]
            }"
        `);
    });

    test("Simple Update", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(update: { datetime_SET: "1970-01-01T00:00:00.000Z" }) {
                    movies {
                        id
                        datetime
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            SET this.datetime = datetime($param0)
            WITH this
            RETURN this { .id, datetime: apoc.date.convertFormat(toString(this.datetime), 'iso_zoned_date_time', 'iso_offset_date_time') } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1970-01-01T00:00:00.000Z\\"
            }"
        `);
    });
});
