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

describe("Cypher directive", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neo4jgraphql: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                name: String
                movies(title: String): [Movie]
                    @cypher(
                        statement: """
                        MATCH (m:Movie {title: $title})
                        RETURN m
                        """
                    )
            }

            type Movie {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neo4jgraphql = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Nested Connection", async () => {
        const query = gql`
            {
                actors {
                    movies {
                        actorsConnection {
                            totalCount
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neo4jgraphql, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            RETURN this { movies: [this_movies IN apoc.cypher.runFirstColumn(\\"MATCH (m:Movie {title: $title})
            RETURN m\\", {this: this, auth: $auth, title: $this_movies_title}, true) | this_movies { actorsConnection: apoc.cypher.runFirstColumn(\\"CALL {
            WITH this_movies
            MATCH (this_movies)<-[this_movies_acted_in_relationship:ACTED_IN]-(this_movies_actor:Actor)
            WITH collect({  }) AS edges
            RETURN { totalCount: size(edges) } AS actorsConnection
            } RETURN actorsConnection\\", { this_movies: this_movies, auth: $auth }, false) }] } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_movies_title\\": null,
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {
                        \\"roles\\": []
                    }
                }
            }"
        `);
    });
});
