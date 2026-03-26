/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Aggregations Count", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Simple Count", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    aggregate {
                        count {
                            nodes
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
              MATCH (this:Movie)
              RETURN {nodes: count(DISTINCT this)} AS var0
            }
            RETURN {aggregate: {count: var0}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Count with WHERE", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection(where: { title: { eq: "some-title" } }) {
                    aggregate {
                        count {
                            nodes
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
              MATCH (this:Movie)
              WHERE this.title = $param0
              RETURN {nodes: count(DISTINCT this)} AS var0
            }
            RETURN {aggregate: {count: var0}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some-title\\"
            }"
        `);
    });
});
