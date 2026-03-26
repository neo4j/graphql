/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Aggregations BigInt", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type File @node {
                size: BigInt!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Min", async () => {
        const query = /* GraphQL */ `
            {
                filesConnection {
                    aggregate {
                        node {
                            size {
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
              MATCH (this:File)
              WITH DISTINCT this
              RETURN {min: min(this.size)} AS var0
            }
            RETURN {aggregate: {node: {size: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Max", async () => {
        const query = /* GraphQL */ `
            {
                filesConnection {
                    aggregate {
                        node {
                            size {
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
              MATCH (this:File)
              WITH DISTINCT this
              RETURN {max: max(this.size)} AS var0
            }
            RETURN {aggregate: {node: {size: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Average", async () => {
        const query = /* GraphQL */ `
            {
                filesConnection {
                    aggregate {
                        node {
                            size {
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
              MATCH (this:File)
              WITH DISTINCT this
              RETURN {average: avg(this.size)} AS var0
            }
            RETURN {aggregate: {node: {size: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Sum", async () => {
        const query = /* GraphQL */ `
            {
                filesConnection {
                    aggregate {
                        node {
                            size {
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
              MATCH (this:File)
              WITH DISTINCT this
              RETURN {sum: sum(this.size)} AS var0
            }
            RETURN {aggregate: {node: {size: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Min, Max, Sum and Average", async () => {
        const query = /* GraphQL */ `
            {
                filesConnection {
                    aggregate {
                        node {
                            size {
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
              MATCH (this:File)
              WITH DISTINCT this
              RETURN {min: min(this.size), max: max(this.size), average: avg(this.size), sum: sum(this.size)} AS var0
            }
            RETURN {aggregate: {node: {size: var0}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
