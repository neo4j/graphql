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

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher directive", () => {
    const typeDefs = /* GraphQL */ `
        type Actor @node {
            name: String
            year: Int
            movies(title: String): [Movie]
                @cypher(
                    statement: """
                    MATCH (m:Movie {title: $title})
                    RETURN m
                    """
                    columnName: "m"
                )
            tvShows(title: String): [Movie]
                @cypher(
                    statement: """
                    MATCH (t:TVShow {title: $title})
                    RETURN t
                    """
                    columnName: "t"
                )

            randomNumber: Int
                @cypher(
                    statement: """
                    RETURN rand() as res
                    """
                    columnName: "res"
                )
        }

        type TVShow @node {
            id: ID
            title: String
            numSeasons: Int
            actors: [Actor]
                @cypher(
                    statement: """
                    MATCH (a:Actor)
                    RETURN a
                    """
                    columnName: "a"
                )
            topActor: Actor
                @cypher(
                    statement: """
                    MATCH (a:Actor)
                    RETURN a
                    """
                    columnName: "a"
                )
        }

        type Movie @node {
            id: ID
            title: String
            actors: [Actor]
                @cypher(
                    statement: """
                    MATCH (a:Actor)
                    RETURN a
                    """
                    columnName: "a"
                )
            topActor: Actor
                @cypher(
                    statement: """
                    MATCH (a:Actor)
                    RETURN a
                    """
                    columnName: "a"
                )
        }
    `;
    const neoSchema: Neo4jGraphQL = new Neo4jGraphQL({
        typeDefs,
    });

    test("Simple directive", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    title
                    topActor {
                        name
                    }
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
                    MATCH (a:Actor)
                    RETURN a
                }
                WITH a AS this0
                WITH this0 { .name } AS this0
                RETURN head(collect(this0)) AS var1
            }
            RETURN this { .title, topActor: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Simple directive (primitive)", async () => {
        const query = /* GraphQL */ `
            {
                actors {
                    randomNumber
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN rand() as res
                }
                WITH res AS this0
                RETURN this0 AS var1
            }
            RETURN this { randomNumber: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("LIMIT happens before custom Cypher if not sorting on the custom Cypher field", async () => {
        const query = /* GraphQL */ `
            {
                actors(options: { limit: 10 }) {
                    randomNumber
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            WITH *
            LIMIT $param0
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN rand() as res
                }
                WITH res AS this0
                RETURN this0 AS var1
            }
            RETURN this { randomNumber: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LIMIT happens after custom Cypher if sorting on the custom Cypher field", async () => {
        const query = /* GraphQL */ `
            {
                actors(options: { limit: 10, sort: [{ randomNumber: ASC }] }) {
                    randomNumber
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN rand() as res
                }
                WITH res AS this0
                RETURN this0 AS var1
            }
            WITH *
            ORDER BY var1 ASC
            LIMIT $param0
            RETURN this { randomNumber: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Nested directive", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    title
                    topActor {
                        name
                        movies(title: "some title") {
                            title
                        }
                    }
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
                    MATCH (a:Actor)
                    RETURN a
                }
                WITH a AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (m:Movie {title: $param0})
                        RETURN m
                    }
                    WITH m AS this1
                    WITH this1 { .title } AS this1
                    RETURN collect(this1) AS var2
                }
                WITH this0 { .name, movies: var2 } AS this0
                RETURN head(collect(this0)) AS var3
            }
            RETURN this { .title, topActor: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    test("Super Nested directive", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    title
                    topActor {
                        name
                        movies(title: "some title") {
                            title
                            topActor {
                                name
                                movies(title: "another title") {
                                    title
                                }
                            }
                        }
                    }
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
                    MATCH (a:Actor)
                    RETURN a
                }
                WITH a AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (m:Movie {title: $param0})
                        RETURN m
                    }
                    WITH m AS this1
                    CALL {
                        WITH this1
                        CALL {
                            WITH this1
                            WITH this1 AS this
                            MATCH (a:Actor)
                            RETURN a
                        }
                        WITH a AS this2
                        CALL {
                            WITH this2
                            CALL {
                                WITH this2
                                WITH this2 AS this
                                MATCH (m:Movie {title: $param1})
                                RETURN m
                            }
                            WITH m AS this3
                            WITH this3 { .title } AS this3
                            RETURN collect(this3) AS var4
                        }
                        WITH this2 { .name, movies: var4 } AS this2
                        RETURN head(collect(this2)) AS var5
                    }
                    WITH this1 { .title, topActor: var5 } AS this1
                    RETURN collect(this1) AS var6
                }
                WITH this0 { .name, movies: var6 } AS this0
                RETURN head(collect(this0)) AS var7
            }
            RETURN this { .title, topActor: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": \\"another title\\"
            }"
        `);
    });

    test("Nested directive with params", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    title
                    topActor {
                        name
                        movies(title: "some title") {
                            title
                        }
                    }
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
                    MATCH (a:Actor)
                    RETURN a
                }
                WITH a AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        WITH this0 AS this
                        MATCH (m:Movie {title: $param0})
                        RETURN m
                    }
                    WITH m AS this1
                    WITH this1 { .title } AS this1
                    RETURN collect(this1) AS var2
                }
                WITH this0 { .name, movies: var2 } AS this0
                RETURN head(collect(this0)) AS var3
            }
            RETURN this { .title, topActor: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    describe("Top level cypher", () => {
        test("should query custom query and return relationship data", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor @node {
                    name: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Query {
                    customMovies(title: String!): [Movie]
                        @cypher(
                            statement: """
                            MATCH (m:Movie {title: $title})
                            RETURN m
                            """
                            columnName: "m"
                        )
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = /* GraphQL */ `
                query {
                    customMovies(title: "The Matrix") {
                        title
                        actors {
                            name
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (m:Movie {title: $param0})
                    RETURN m
                }
                WITH m AS this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WITH this2 { .name } AS this2
                    RETURN collect(this2) AS var3
                }
                WITH this0 { .title, actors: var3 } AS this0
                RETURN this0 AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"The Matrix\\"
                }"
            `);
        });

        test("should query custom query and return relationship data with given columnName", async () => {
            const typeDefs = /* GraphQL */ `
                type Movie @node {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor @node {
                    name: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Query @node {
                    customMovies(title: String!): [Movie]
                        @cypher(
                            statement: """
                            MATCH (m:Movie {title: $title})
                            RETURN m
                            """
                            columnName: "m"
                        )
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = /* GraphQL */ `
                query {
                    customMovies(title: "The Matrix") {
                        title
                        actors {
                            name
                        }
                    }
                }
            `;

            const result = await translateQuery(neoSchema, query);

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                    MATCH (m:Movie {title: $param0})
                    RETURN m
                }
                WITH m AS this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                    WITH this2 { .name } AS this2
                    RETURN collect(this2) AS var3
                }
                WITH this0 { .title, actors: var3 } AS this0
                RETURN this0 AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"The Matrix\\"
                }"
            `);
        });

        test("should query field custom query and return relationship data with given columnName", async () => {
            const typeDefs = `
                type Movie @node {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                    custom(title: String!): [Movie]
                        @cypher(
                            statement: """
                            MATCH (m:Movie {title: $title})
                            RETURN m
                            """,
                            columnName: "m"
                        )
                }

                type Actor @node {
                    name: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = /* GraphQL */ `
                query {
                    movies {
                        custom(title: "The Matrix") {
                            title
                            actors {
                                name
                            }
                        }
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
                        MATCH (m:Movie {title: $param0})
                        RETURN m
                    }
                    WITH m AS this0
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                        WITH this2 { .name } AS this2
                        RETURN collect(this2) AS var3
                    }
                    WITH this0 { .title, actors: var3 } AS this0
                    RETURN collect(this0) AS var4
                }
                RETURN this { custom: var4 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"The Matrix\\"
                }"
            `);
        });
    });
});
