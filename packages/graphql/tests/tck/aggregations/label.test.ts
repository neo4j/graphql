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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher Aggregations Many while Alias fields", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
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
        const query = gql`
            {
                moviesAggregate {
                    _id: id {
                        _shortest: shortest
                        _longest: longest
                    }
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
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Film\`)
            RETURN { _id: { _shortest: min(this.id), _longest: max(this.id) }, _title: { _shortest:
                                        reduce(aggVar = collect(this.title)[0], current IN collect(this.title) |
                                            CASE
                                            WHEN size(current) < size(aggVar) THEN current
                                            ELSE aggVar
                                            END
                                        )
                                    , _longest:
                                        reduce(aggVar = collect(this.title)[0], current IN collect(this.title) |
                                            CASE
                                            WHEN size(current) > size(aggVar) THEN current
                                            ELSE aggVar
                                            END
                                        )
                                     }, _imdbRating: { _min: min(this.imdbRating), _max: max(this.imdbRating), _average: avg(this.imdbRating) }, _createdAt: { _min: apoc.date.convertFormat(toString(min(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), _max: apoc.date.convertFormat(toString(max(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Additional Labels Aggregations", async () => {
        const query = gql`
            {
                actorsAggregate {
                    _id: id {
                        _shortest: shortest
                        _longest: longest
                    }
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
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`:\`Person\`:\`Alien\`)
            RETURN { _id: { _shortest: min(this.id), _longest: max(this.id) }, _name: { _shortest:
                                        reduce(aggVar = collect(this.name)[0], current IN collect(this.name) |
                                            CASE
                                            WHEN size(current) < size(aggVar) THEN current
                                            ELSE aggVar
                                            END
                                        )
                                    , _longest:
                                        reduce(aggVar = collect(this.name)[0], current IN collect(this.name) |
                                            CASE
                                            WHEN size(current) > size(aggVar) THEN current
                                            ELSE aggVar
                                            END
                                        )
                                     }, _imdbRating: { _min: min(this.imdbRating), _max: max(this.imdbRating), _average: avg(this.imdbRating) }, _createdAt: { _min: apoc.date.convertFormat(toString(min(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), _max: apoc.date.convertFormat(toString(max(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
