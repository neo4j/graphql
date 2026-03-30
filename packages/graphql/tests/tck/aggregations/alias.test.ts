/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Aggregations Many while Alias fields", () => {
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

    test("Field Alias Aggregations", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    _aggr: aggregate {
                        _count: count {
                            _nodes: nodes
                        }
                        _n: node {
                            _title: title {
                                _shortest: shortest
                                _longest: longest
                            }
                            _imdbRating: imdbRating {
                                _min: min
                                _max: max
                                _average: average
                            }
                            _createdAt: createdAt {
                                _min: min
                                _max: max
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
              RETURN {nodes: count(DISTINCT this)} AS var0
            }
            CALL {
              MATCH (this:Movie)
              WITH DISTINCT this
              ORDER BY size(this.title) DESC
              WITH collect(this.title) AS list
              RETURN {_longest: head(list), _shortest: last(list)} AS var1
            }
            CALL {
              MATCH (this:Movie)
              WITH DISTINCT this
              RETURN {_min: min(this.imdbRating), _max: max(this.imdbRating), _average: avg(this.imdbRating)} AS var2
            }
            CALL {
              MATCH (this:Movie)
              WITH DISTINCT this
              RETURN {_min: apoc.date.convertFormat(toString(min(this.createdAt)), 'iso_zoned_date_time', 'iso_offset_date_time'), _max: apoc.date.convertFormat(toString(max(this.createdAt)), 'iso_zoned_date_time', 'iso_offset_date_time')} AS var3
            }
            RETURN {aggregate: {_count: var0, node: {_title: var1, _imdbRating: var2, _createdAt: var3}}} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
