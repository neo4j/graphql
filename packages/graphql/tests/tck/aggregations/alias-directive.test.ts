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

describe("Cypher Aggregations Many with Alias directive", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
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
        const query = gql`
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
            "MATCH (this:Movie)
            RETURN { id: { shortest: min(this._id), longest: max(this._id) }, title: { shortest:
                                        reduce(aggVar = collect(this._title)[0], current IN collect(this._title) |
                                            CASE
                                            WHEN size(current) < size(aggVar) THEN current
                                            ELSE aggVar
                                            END
                                        )
                                    , longest:
                                        reduce(aggVar = collect(this._title)[0], current IN collect(this._title) |
                                            CASE
                                            WHEN size(current) > size(aggVar) THEN current
                                            ELSE aggVar
                                            END
                                        )
                                     }, imdbRating: { min: min(this.\`_imdb Rating\`), max: max(this.\`_imdb Rating\`), average: avg(this.\`_imdb Rating\`) }, createdAt: { min: apoc.date.convertFormat(toString(min(this._createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), max: apoc.date.convertFormat(toString(max(this._createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
