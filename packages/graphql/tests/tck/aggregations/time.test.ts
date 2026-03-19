/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Aggregations Time", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                createdAt: Time!
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
                            createdAt {
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
              RETURN {min: min(this.createdAt)} AS var0
            }
            RETURN {aggregate: {node: {createdAt: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Max", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    aggregate {
                        node {
                            createdAt {
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
              RETURN {max: max(this.createdAt)} AS var0
            }
            RETURN {aggregate: {node: {createdAt: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Min and Max", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    aggregate {
                        node {
                            createdAt {
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
              RETURN {min: min(this.createdAt), max: max(this.createdAt)} AS var0
            }
            RETURN {aggregate: {node: {createdAt: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
