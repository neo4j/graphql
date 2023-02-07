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
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2713", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = gql`
        type Movie {
            title: String
            genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "InGenre")
        }

        type Genre {
            name: String
            movies: [Movie!]! @relationship(type: "IN_GENRE", direction: IN, properties: "InGenre")
            series: [Series!]! @relationship(type: "IN_GENRE", direction: IN, properties: "InGenre")
        }

        type Series {
            name: String!
            genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT, properties: "InGenre")
        }

        interface InGenre {
            intValue: Int!
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should not find genresConnection_ALL where NONE true", async () => {
        const query = gql`
            {
                movies(where: { genresConnection_ALL: { node: { moviesAggregate: { count: 0 } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                MATCH (this)-[this0:IN_GENRE]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this3:\`Movie\`)-[this2:IN_GENRE]->(this1)
                    RETURN count(this3) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                RETURN count(this1) > 0 AS var5
            }
            CALL {
                WITH this
                MATCH (this)-[this0:IN_GENRE]->(this1:\`Genre\`)
                CALL {
                    WITH this1
                    MATCH (this7:\`Movie\`)-[this6:IN_GENRE]->(this1)
                    RETURN count(this7) = $param1 AS var8
                }
                WITH *
                WHERE NOT (var8 = true)
                RETURN count(this1) > 0 AS var9
            }
            WITH *
            WHERE (var9 = false AND var5 = true)
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 0,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
