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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1364", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
                id: ID
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                genres: [Genre!]! @relationship(type: "HAS_GENRE", direction: OUT)
                totalGenres: Int!
                    @cypher(
                        statement: """
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre)
                        """
                    )
                totalActors: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN count(DISTINCT actor)
                        """
                    )
            }

            type Genre {
                id: ID
                name: String
                totalMovies: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                        RETURN count(DISTINCT movie)
                        """
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    test("Should project cypher fields after applying the sort when sorting on a non-cypher field on a root connection)", async () => {
        const query = gql`
            {
                moviesConnection(sort: [{ title: ASC }]) {
                    edges {
                        node {
                            title
                            totalGenres
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, { req });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WITH COLLECT(this) as edges
            WITH edges, size(edges) as totalCount
            UNWIND edges as this
            WITH this, totalCount
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                RETURN count(DISTINCT genre)\\", { this: this, auth: $auth }) AS this_totalGenres
                RETURN this_totalGenres AS this_totalGenres
            }
            WITH { node: this { .title, totalGenres: this_totalGenres } } as edge, totalCount, this
            ORDER BY this.title ASC
            WITH COLLECT(edge) as edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } as this"
        `);
    });

    test("Should project cypher fields before the sort when sorting on a cypher field on a root connection", async () => {
        const query = gql`
            {
                moviesConnection(sort: [{ totalGenres: ASC }]) {
                    edges {
                        node {
                            title
                            totalGenres
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, { req });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WITH COLLECT(this) as edges
            WITH edges, size(edges) as totalCount
            UNWIND edges as this
            WITH this, totalCount
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                RETURN count(DISTINCT genre)\\", { this: this, auth: $auth }) AS this_totalGenres
                RETURN this_totalGenres AS this_totalGenres
            }
            WITH { node: this { .title, totalGenres: this_totalGenres } } as edge, totalCount, this
            ORDER BY edge.node.totalGenres ASC
            WITH COLLECT(edge) as edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } as this"
        `);
    });

    test("Should sort properly on a root connection when multiple cypher fields are queried but only sorted on one", async () => {
        const query = gql`
            {
                moviesConnection(sort: [{ totalGenres: ASC }]) {
                    edges {
                        node {
                            title
                            totalGenres
                            totalActors
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, { req });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            WITH COLLECT(this) as edges
            WITH edges, size(edges) as totalCount
            UNWIND edges as this
            WITH this, totalCount
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                RETURN count(DISTINCT genre)\\", { this: this, auth: $auth }) AS this_totalGenres
                RETURN this_totalGenres AS this_totalGenres
            }
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                RETURN count(DISTINCT actor)\\", { this: this, auth: $auth }) AS this_totalActors
                RETURN this_totalActors AS this_totalActors
            }
            WITH { node: this { .title, totalGenres: this_totalGenres, totalActors: this_totalActors } } as edge, totalCount, this
            ORDER BY edge.node.totalGenres ASC
            WITH COLLECT(edge) as edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } as this"
        `);
    });
});
