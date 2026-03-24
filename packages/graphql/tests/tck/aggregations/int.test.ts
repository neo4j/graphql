/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Aggregations Int", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                imdbRating: Int!
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
                            imdbRating {
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
              RETURN {min: min(this.imdbRating)} AS var0
            }
            RETURN {aggregate: {node: {imdbRating: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Max", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    aggregate {
                        node {
                            imdbRating {
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
              RETURN {max: max(this.imdbRating)} AS var0
            }
            RETURN {aggregate: {node: {imdbRating: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Average", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    aggregate {
                        node {
                            imdbRating {
                                average
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
              RETURN {average: avg(this.imdbRating)} AS var0
            }
            RETURN {aggregate: {node: {imdbRating: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Sum", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    aggregate {
                        node {
                            imdbRating {
                                sum
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
              RETURN {sum: sum(this.imdbRating)} AS var0
            }
            RETURN {aggregate: {node: {imdbRating: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Min, Max, Sum and Average", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    aggregate {
                        node {
                            imdbRating {
                                min
                                max
                                average
                                sum
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
              RETURN {min: min(this.imdbRating), max: max(this.imdbRating), average: avg(this.imdbRating), sum: sum(this.imdbRating)} AS var0
            }
            RETURN {aggregate: {node: {imdbRating: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
