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

describe("cypher directive filtering - Relationship", () => {
    test("relationship with single property filter NOT", async () => {
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
                movies(where: { NOT: { actors_SOME: { name_EQ: "Jada Pinkett Smith" } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN collect(this0) AS this1
            }
            WITH *
            WHERE NOT (any(this2 IN this1 WHERE this2.name = $param0))
            RETURN this { .title } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Jada Pinkett Smith\\"
            }"
        `);
    });

    test("relationship with single property filter ALL", async () => {
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
                movies(where: { actors_ALL: { name_EQ: "Keanu Reeves" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN collect(this0) AS this1
            }
            WITH *
            WHERE all(this2 IN this1 WHERE this2.name = $param0)
            RETURN this { .title } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("relationship with single property filter SINGLE", async () => {
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
                movies(where: { actors_SINGLE: { name_EQ: "Carrie-Anne Moss" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN collect(this0) AS this1
            }
            WITH *
            WHERE single(this2 IN this1 WHERE this2.name = $param0)
            RETURN this { .title } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Carrie-Anne Moss\\"
            }"
        `);
    });

    test("relationship with single property filter SOME", async () => {
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
                movies(where: { actors_SOME: { name_EQ: "Keanu Reeves" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN collect(this0) AS this1
            }
            WITH *
            WHERE any(this2 IN this1 WHERE this2.name = $param0)
            RETURN this { .title } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("relationship with single property filter NONE", async () => {
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
                movies(where: { actors_NONE: { name_EQ: "Keanu Reeves" } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN collect(this0) AS this1
            }
            WITH *
            WHERE none(this2 IN this1 WHERE this2.name = $param0)
            RETURN this { .title } AS this"
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
                movies(
                    where: {
                        OR: [
                            { actors_SOME: { name_EQ: "Jada Pinkett Smith" } }
                            { genres_SOME: { name_EQ: "Romance" } }
                        ]
                    }
                ) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)<-[:ACTED_IN]-(actor:Actor)
                    RETURN actor
                }
                WITH actor AS this0
                RETURN collect(this0) AS this1
            }
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:IN_GENRE]->(g:Genre)
                    RETURN g
                }
                WITH g AS this2
                RETURN collect(this2) AS this3
            }
            WITH *
            WHERE (any(this4 IN this1 WHERE this4.name = $param0) OR any(this5 IN this3 WHERE this5.name = $param1))
            RETURN this { .title } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Jada Pinkett Smith\\",
                \\"param1\\": \\"Romance\\"
            }"
        `);
    });
});
