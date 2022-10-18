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
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

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
                MATCH (this)<-[this_connection_moviesConnectionthis0:IS_GENRE]-(this_Movie:\`Movie\`)
                WITH this_connection_moviesConnectionthis0, this_Movie
                ORDER BY this_Movie.actorsCount DESC
                CALL {
                    WITH this_Movie
                    UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (this)<-[:ACTED_IN]-(ac:Person)
                    RETURN count(ac)\\", { this: this_Movie, auth: $auth }) AS this_Movie_actorsCount
                    RETURN head(collect(this_Movie_actorsCount)) AS this_Movie_actorsCount
                }
                WITH { node: { title: this_Movie.title, actorsCount: this_Movie_actorsCount } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                UNWIND edges AS edge
                WITH edge, totalCount
                ORDER BY edge.node.actorsCount DESC
                WITH collect(edge) AS edges, totalCount
                RETURN { edges: edges, totalCount: totalCount } AS this_moviesConnection
            }
            RETURN this { moviesConnection: this_moviesConnection } AS this"
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
