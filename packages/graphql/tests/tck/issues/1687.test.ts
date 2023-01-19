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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1687", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Production {
                id: ID
                title: String
            }

            type Movie implements Production {
                id: ID
                title: String
                actorCount: Int
                genres: [Genre!]! @relationship(type: "HAS_GENRE", direction: OUT)
            }

            type Genre {
                name: String
                movies: [Production!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should be able to return all the genres related to the Matrix movie using connection fields", async () => {
        const query = gql`
            query Genres {
                genres(where: { moviesConnection_ALL: { node: { _on: { Movie: { title: "Matrix" } } } } }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Genre\`)
            WHERE (EXISTS {
                MATCH (this1:\`Movie\`)-[this0:HAS_GENRE]->(this)
                WHERE this1.title = $param0
            } AND NOT (EXISTS {
                MATCH (this1:\`Movie\`)-[this0:HAS_GENRE]->(this)
                WHERE NOT (this1.title = $param0)
            }))
            RETURN this { .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Matrix\\"
            }"
        `);
    });
});
