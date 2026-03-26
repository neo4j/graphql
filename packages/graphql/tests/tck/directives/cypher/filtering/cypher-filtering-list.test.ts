/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("cypher directive filtering - Lists", () => {
    test("Int cypher field AND String title field", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                custom_cypher_list: [String]
                    @cypher(
                        statement: """
                        RETURN ['a', 'b', 'c'] as list
                        """
                        columnName: "list"
                    )
            }
        `;

        const query = /* GraphQL */ `
            query {
                movies(where: { custom_cypher_list: { includes: "a" } }) {
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
                RETURN ['a', 'b', 'c'] as list
              }
              UNWIND list AS var0
              WITH var0 AS this1
              RETURN collect(this1) AS var2
            }
            WITH *
            WHERE $param0 IN var2
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a\\"
            }"
        `);
    });
});
