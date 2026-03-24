/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("cypher directive filtering - Auth", () => {
    test("DateTime cypher field", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                special_time: DateTime
                    @cypher(
                        statement: """
                        RETURN datetime("2024-09-03T15:30:00Z") AS t
                        """
                        columnName: "t"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { special_time: { gt: "2024-09-02T00:00:00Z" } }) {
                    special_time
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
              CALL (this) {
                WITH this AS this
                RETURN datetime(\\"2024-09-03T15:30:00Z\\") AS t
              }
              WITH t AS this0
              RETURN this0 AS var1
            }
            WITH *
            WHERE var1 > datetime($param0)
            CALL (this) {
              CALL (this) {
                WITH this AS this
                RETURN datetime(\\"2024-09-03T15:30:00Z\\") AS t
              }
              WITH t AS this2
              RETURN this2 AS var3
            }
            RETURN this { .title, special_time: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2024-09-02T00:00:00Z\\"
            }"
        `);
    });

    test("Duration cypher field", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                special_duration: Duration
                    @cypher(
                        statement: """
                        RETURN duration('P14DT16H12M') AS d
                        """
                        columnName: "d"
                    )
            }
        `;
        const query = /* GraphQL */ `
            query {
                movies(where: { special_duration: { eq: "P14DT16H12M" } }) {
                    title
                }
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
              CALL (this) {
                WITH this AS this
                RETURN duration('P14DT16H12M') AS d
              }
              WITH d AS this0
              RETURN this0 AS var1
            }
            WITH *
            WHERE var1 = $param0
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 0,
                    \\"days\\": 14,
                    \\"seconds\\": 58320,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });
});
