/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Aggregations Many", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                id: ID!
                title: String!
                imdbRating: Int!
                createdAt: DateTime!
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
                            title {
                                shortest
                                longest
                            }
                            imdbRating {
                                min
                                max
                                average
                            }
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
              ORDER BY size(this.title) DESC
              WITH collect(this.title) AS list
              RETURN {longest: head(list), shortest: last(list)} AS var0
            }
            CALL {
              MATCH (this:Movie)
              WITH DISTINCT this
              RETURN {min: min(this.imdbRating), max: max(this.imdbRating), average: avg(this.imdbRating)} AS var1
            }
            CALL {
              MATCH (this:Movie)
              WITH DISTINCT this
              RETURN {min: apoc.date.convertFormat(toString(min(this.createdAt)), 'iso_zoned_date_time', 'iso_offset_date_time'), max: apoc.date.convertFormat(toString(max(this.createdAt)), 'iso_zoned_date_time', 'iso_offset_date_time')} AS var2
            }
            RETURN {aggregate: {node: {title: var0, imdbRating: var1, createdAt: var2}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
