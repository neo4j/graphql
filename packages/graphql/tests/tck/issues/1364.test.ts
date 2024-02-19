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
import { formatCypher, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1364", () => {
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
                        RETURN count(DISTINCT genre) as result
                        """
                        columnName: "result"
                    )
                totalActors: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN count(DISTINCT actor) as result
                        """
                        columnName: "result"
                    )
            }

            type Genre {
                id: ID
                name: String
                totalMovies: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:HAS_GENRE]-(movie:Movie)
                        RETURN count(DISTINCT movie) as result
                        """
                        columnName: "result"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH *
                ORDER BY this0.title ASC
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre) as result
                    }
                    WITH result AS this1
                    RETURN this1 AS var2
                }
                RETURN collect({ node: { title: this0.title, totalGenres: var2, __resolveType: \\"Movie\\" } }) AS var3
            }
            RETURN { edges: var3, totalCount: totalCount } AS this"
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre) as result
                    }
                    WITH result AS this1
                    RETURN this1 AS var2
                }
                WITH *
                ORDER BY var2 ASC
                RETURN collect({ node: { title: this0.title, totalGenres: var2, __resolveType: \\"Movie\\" } }) AS var3
            }
            RETURN { edges: var3, totalCount: totalCount } AS this"
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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (this)-[:HAS_GENRE]->(genre:Genre)
                        RETURN count(DISTINCT genre) as result
                    }
                    WITH result AS this1
                    RETURN this1 AS var2
                }
                WITH *
                ORDER BY var2 ASC
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN count(DISTINCT actor) as result
                    }
                    WITH result AS this3
                    RETURN this3 AS var4
                }
                RETURN collect({ node: { title: this0.title, totalGenres: var2, totalActors: var4, __resolveType: \\"Movie\\" } }) AS var5
            }
            RETURN { edges: var5, totalCount: totalCount } AS this"
        `);
    });
});
