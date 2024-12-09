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

import { Neo4jGraphQL } from "../../../../../../src";
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../../../utils/tck-test-utils";

describe("cypher directive filtering - relationship auth filter", () => {
    test("relationship with auth filter on type PASS", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(filter: [{ where: { node: { actors_SOME: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                rating: Float
                actors: [Actor!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movies: [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Keanu Reeves" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { rating_LT: 7.0 }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    WITH this0 AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this1
                RETURN collect(this1) AS this2
            }
            WITH *
            WHERE (this0.rating < $param0 AND ($isAuthenticated = true AND any(this3 IN this2 WHERE ($jwt.custom_value IS NOT NULL AND this3.name = $jwt.custom_value))))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var4
            }
            RETURN { edges: var4, totalCount: totalCount } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 7,
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Keanu Reeves\\"
                }
            }"
        `);
    });

    test("relationship with auth filter on type FAIL", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(filter: [{ where: { node: { actors_SOME: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                rating: Float
                actors: [Actor!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movies: [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Something Incorrect" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { rating_LT: 7.0 }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    WITH this0 AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this1
                RETURN collect(this1) AS this2
            }
            WITH *
            WHERE (this0.rating < $param0 AND ($isAuthenticated = true AND any(this3 IN this2 WHERE ($jwt.custom_value IS NOT NULL AND this3.name = $jwt.custom_value))))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var4
            }
            RETURN { edges: var4, totalCount: totalCount } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 7,
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Something Incorrect\\"
                }
            }"
        `);
    });

    test("relationship with auth validate on type PASS", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(validate: [{ where: { node: { actors_SOME: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                rating: Float
                actors: [Actor!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movies: [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Keanu Reeves" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { rating_LT: 7.0 }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    WITH this0 AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this1
                RETURN collect(this1) AS this2
            }
            WITH *
            WHERE (this0.rating < $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND any(this3 IN this2 WHERE ($jwt.custom_value IS NOT NULL AND this3.name = $jwt.custom_value))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var4
            }
            RETURN { edges: var4, totalCount: totalCount } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 7,
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Keanu Reeves\\"
                }
            }"
        `);
    });

    test("relationship with auth validate on type FAIL", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @node
                @authorization(validate: [{ where: { node: { actors_SOME: { name_EQ: "$jwt.custom_value" } } } }]) {
                title: String
                rating: Float
                actors: [Actor!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                        RETURN actor
                        """
                        columnName: "actor"
                    )
            }

            type Actor @node {
                name: String
                movies: [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:ACTED_IN]->(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const token = createBearerToken("secret", { custom_value: "Something Incorrect" });

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { rating_GT: 7.0 }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this0:Movie)
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    WITH this0 AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this1
                RETURN collect(this1) AS this2
            }
            WITH *
            WHERE (this0.rating > $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND any(this3 IN this2 WHERE ($jwt.custom_value IS NOT NULL AND this3.name = $jwt.custom_value))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var4
            }
            RETURN { edges: var4, totalCount: totalCount } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 7,
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"custom_value\\": \\"Something Incorrect\\"
                }
            }"
        `);
    });
});
