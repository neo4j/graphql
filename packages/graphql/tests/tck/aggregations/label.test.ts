/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher Aggregations Many while Alias fields", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node(labels: ["Film"]) {
                id: ID!
                title: String!
                imdbRating: Int!
                createdAt: DateTime!
            }

            type Actor @node(labels: ["Actor", "Person", "Alien"]) {
                id: ID!
                name: String!
                imdbRating: Int!
                createdAt: DateTime!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Custom Label Aggregations", async () => {
        const query = /* GraphQL */ `
            {
                moviesConnection {
                    aggregate {
                        node {
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
                MATCH (this:Film)
                WITH DISTINCT this
                ORDER BY size(this.title) DESC
                WITH collect(this.title) AS list
                RETURN { _longest: head(list), _shortest: last(list) } AS var0
            }
            CALL {
                MATCH (this:Film)
                WITH DISTINCT this
                RETURN { _min: min(this.imdbRating), _max: max(this.imdbRating), _average: avg(this.imdbRating) } AS var1
            }
            CALL {
                MATCH (this:Film)
                WITH DISTINCT this
                RETURN { _min: apoc.date.convertFormat(toString(min(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), _max: apoc.date.convertFormat(toString(max(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS var2
            }
            RETURN { aggregate: { node: { _title: var0, _imdbRating: var1, _createdAt: var2 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Additional Labels Aggregations", async () => {
        const query = /* GraphQL */ `
            {
                actorsConnection {
                    aggregate {
                        node {
                            _name: name {
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
                MATCH (this:Actor:Person:Alien)
                WITH DISTINCT this
                ORDER BY size(this.name) DESC
                WITH collect(this.name) AS list
                RETURN { _longest: head(list), _shortest: last(list) } AS var0
            }
            CALL {
                MATCH (this:Actor:Person:Alien)
                WITH DISTINCT this
                RETURN { _min: min(this.imdbRating), _max: max(this.imdbRating), _average: avg(this.imdbRating) } AS var1
            }
            CALL {
                MATCH (this:Actor:Person:Alien)
                WITH DISTINCT this
                RETURN { _min: apoc.date.convertFormat(toString(min(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), _max: apoc.date.convertFormat(toString(max(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS var2
            }
            RETURN { aggregate: { node: { _name: var0, _imdbRating: var1, _createdAt: var2 } } } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
