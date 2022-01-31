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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher Aggregations Many while Alias fields", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neo4jgraphql: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie {
                id: ID!
                title: String!
                imdbRating: Int!
                createdAt: DateTime!
            }
        `;

        neo4jgraphql = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Field Alias Aggregations", async () => {
        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            RETURN { _count: count(this), _id: { _shortest: min(this.id), _longest: max(this.id) }, _title: { _shortest:
                                        reduce(shortest = collect(this.title)[0], current IN collect(this.title) | apoc.cypher.runFirstColumn(\\"
                                            RETURN
                                            CASE size(current) < size(shortest)
                                            WHEN true THEN current
                                            ELSE shortest
                                            END AS result
                                        \\", { current: current, shortest: shortest }, false))
                                    , _longest:
                                        reduce(shortest = collect(this.title)[0], current IN collect(this.title) | apoc.cypher.runFirstColumn(\\"
                                            RETURN
                                            CASE size(current) > size(shortest)
                                            WHEN true THEN current
                                            ELSE shortest
                                            END AS result
                                        \\", { current: current, shortest: shortest }, false))
                                     }, _imdbRating: { _min: min(this.imdbRating), _max: max(this.imdbRating), _average: avg(this.imdbRating) }, _createdAt: { _min: apoc.date.convertFormat(toString(min(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\"), _max: apoc.date.convertFormat(toString(max(this.createdAt)), \\"iso_zoned_date_time\\", \\"iso_offset_date_time\\") } }"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
