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

describe("Cypher Aggregations Many with Alias directive", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie {
                id: ID! @alias(property: "_id")
                title: String! @alias(property: "_title")
                imdbRating: Int! @alias(property: "_imdb Rating")
                createdAt: DateTime! @alias(property: "_createdAt")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Min", async () => {
        const query = /* GraphQL */ `
            {
                moviesAggregate {
                    id {
                        shortest
                        longest
                    }
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
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (this:Movie)
                RETURN { shortest: min(this._id), longest: max(this._id) } AS var0
            }
            CALL {
                MATCH (this:Movie)
                WITH this
                ORDER BY size(this._title) DESC
                WITH collect(this._title) AS list
                RETURN { longest: head(list), shortest: last(list) } AS var1
            }
            CALL {
                MATCH (this:Movie)
                RETURN { min: min(this.\`_imdb Rating\`), max: max(this.\`_imdb Rating\`), average: avg(this.\`_imdb Rating\`) } AS var2
            }
            CALL {
                MATCH (this:Movie)
                RETURN { min: apoc.date.convertFormat(toString(min(this._createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), max: apoc.date.convertFormat(toString(max(this._createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } AS var3
            }
            RETURN { id: var0, title: var1, imdbRating: var2, createdAt: var3 }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
