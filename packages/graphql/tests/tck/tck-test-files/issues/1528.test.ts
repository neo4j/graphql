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
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1528", () => {
    test("order in connections with custom cypher", async () => {
        const secret = "secret";

        const typeDefs = gql`
            type Movie {
                title: String!
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                actorsCount: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(ac:Person)
                        RETURN count(ac)
                        """
                    )
            }

            type Person {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Genre {
                name: String!
                movies: [Movie!]! @relationship(type: "IS_GENRE", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });

        const query = gql`
            query {
                genres {
                    moviesConnection(sort: [{ node: { actorsCount: DESC } }]) {
                        edges {
                            node {
                                title
                                actorsCount
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest(secret);
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Genre\`)
            CALL {
            WITH this
            MATCH (this)<-[this_is_genre_relationship:IS_GENRE]-(this_movie:Movie)
            WITH this_is_genre_relationship, this_movie
            ORDER BY this_movie.actorsCount DESC
            WITH collect({ node: { title: this_movie.title, actorsCount:  apoc.cypher.runFirstColumn(\\"MATCH (this)<-[:ACTED_IN]-(ac:Person)
            RETURN count(ac)\\", {this: this_movie, auth: $auth}, false) } }) AS edges
            UNWIND edges as edge
            WITH edges, edge
            ORDER BY edge.node.actorsCount DESC
            WITH collect(edge) AS edges, size(collect(edge)) AS totalCount
            RETURN { edges: edges, totalCount: totalCount } AS moviesConnection
            }
            RETURN this { moviesConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
            }"
        `);
    });
});
