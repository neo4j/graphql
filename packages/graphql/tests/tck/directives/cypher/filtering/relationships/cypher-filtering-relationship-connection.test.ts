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
import { formatCypher, formatParams, translateQuery } from "../../../../utils/tck-test-utils";

describe("Connection API - cypher directive filtering - Relationship", () => {
    test("Connection API - relationship with single property filter NOT", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
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

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { NOT: { actors_SOME: { name_EQ: "Jada Pinkett Smith" } } }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

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
            WHERE NOT (any(this3 IN this2 WHERE this3.name = $param0))
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
                \\"param0\\": \\"Jada Pinkett Smith\\"
            }"
        `);
    });

    test("Connection API - relationship with single property filter ALL", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
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

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { actors_ALL: { name_EQ: "Keanu Reeves" } }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

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
            WHERE all(this3 IN this2 WHERE this3.name = $param0)
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
                \\"param0\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("Connection API - relationship with single property filter SINGLE", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
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

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { actors_SINGLE: { name_EQ: "Carrie-Anne Moss" } }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

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
            WHERE single(this3 IN this2 WHERE this3.name = $param0)
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
                \\"param0\\": \\"Carrie-Anne Moss\\"
            }"
        `);
    });

    test("Connection API - relationship with single property filter SOME", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
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

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { actors_SOME: { name_EQ: "Keanu Reeves" } }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

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
            WHERE any(this3 IN this2 WHERE this3.name = $param0)
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
                \\"param0\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("Connection API - relationship with single property filter SOME with sort", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
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

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { actors_SOME: { name_EQ: "Keanu Reeves" } }, sort: { title: DESC }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

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
            WHERE any(this3 IN this2 WHERE this3.name = $param0)
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                WITH *
                ORDER BY this0.title DESC
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var4
            }
            RETURN { edges: var4, totalCount: totalCount } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("Connection API - relationship with single property filter NONE", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
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

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                moviesConnection(where: { actors_NONE: { name_EQ: "Keanu Reeves" } }) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

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
            WHERE none(this3 IN this2 WHERE this3.name = $param0)
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
                \\"param0\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("relationship with multiple property filters", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                genres: [Genre!]!
                    @cypher(
                        statement: """
                        MATCH (this)-[:IN_GENRE]->(g:Genre)
                        RETURN g
                        """
                        columnName: "g"
                    )
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

            type Genre @node {
                name: String
                movies: [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:IN_GENRE]-(movie:Movie)
                        RETURN movie
                        """
                        columnName: "movie"
                    )
            }
        `;

        const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                moviesConnection(
                    where: {
                        OR: [
                            { actors_SOME: { name_EQ: "Jada Pinkett Smith" } }
                            { genres_SOME: { name_EQ: "Romance" } }
                        ]
                    }
                ) {
                    edges {
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

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
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    WITH this0 AS this
                    MATCH (this)-[:IN_GENRE]->(g:Genre)
                    RETURN g
                }
                WITH g AS this3
                RETURN collect(this3) AS this4
            }
            WITH *
            WHERE (any(this5 IN this2 WHERE this5.name = $param0) OR any(this6 IN this4 WHERE this6.name = $param1))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { title: this0.title, __resolveType: \\"Movie\\" } }) AS var7
            }
            RETURN { edges: var7, totalCount: totalCount } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Jada Pinkett Smith\\",
                \\"param1\\": \\"Romance\\"
            }"
        `);
    });
});
