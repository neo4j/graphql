/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Aggregations Duration", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                screenTime: Duration!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Min", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    aggregate {
                        node {
                            screenTime {
                                min
                            }
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
              WITH DISTINCT this
              RETURN {min: min(this.screenTime)} AS var0
            }
            RETURN {aggregate: {node: {screenTime: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Max", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    aggregate {
                        node {
                            screenTime {
                                max
                            }
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
              WITH DISTINCT this
              RETURN {max: max(this.screenTime)} AS var0
            }
            RETURN {aggregate: {node: {screenTime: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Min and Max", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    aggregate {
                        node {
                            screenTime {
                                min
                                max
                            }
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
              WITH DISTINCT this
              RETURN {min: min(this.screenTime), max: max(this.screenTime)} AS var0
            }
            RETURN {aggregate: {node: {screenTime: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
