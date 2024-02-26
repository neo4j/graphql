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
            type Movie {
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
                moviesAggregate {
                    _count: count
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
            "CALL {
                MATCH (this:Movie)
                RETURN count(this) AS var0
            }
            CALL {
                MATCH (this:Movie)
                RETURN { _shortest: min(this.id), _longest: max(this.id) } AS var1
            }
            CALL {
                MATCH (this:Movie)
                WITH this
                ORDER BY size(this.title) DESC
                WITH collect(this.title) AS list
                RETURN { _longest: head(list), _shortest: last(list) } AS var2
            }
            CALL {
                MATCH (this:Movie)
                RETURN { _min: min(this.imdbRating), _max: max(this.imdbRating), _average: avg(this.imdbRating) } AS var3
            }
            CALL {
                MATCH (this:Movie)
                RETURN { _min: apoc.date.convertFormat(toString(min(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), _max: apoc.date.convertFormat(toString(max(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS var4
            }
            RETURN { _count: var0, _id: var1, _title: var2, _imdbRating: var3, _createdAt: var4 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
