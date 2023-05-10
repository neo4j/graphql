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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1685", () => {
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

    test("should be possible to count connection using list predicates", async () => {
        const query = gql`
            query Genres {
                genres {
                    moviesConnection(
                        where: { node: { _on: { Movie: { genresConnection_SOME: { node: { name: "Action" } } } } } }
                    ) {
                        totalCount
                    }
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Genre\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)<-[this0:HAS_GENRE]-(this1:\`Movie\`)
                    WHERE EXISTS {
                        MATCH (this1)-[this2:HAS_GENRE]->(this3:\`Genre\`)
                        WHERE this3.name = $param0
                    }
                    WITH { node: { __resolveType: \\"Movie\\", __id: id(this1) } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var4
            }
            RETURN this { moviesConnection: var4, .name } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Action\\"
            }"
        `);
    });
});
