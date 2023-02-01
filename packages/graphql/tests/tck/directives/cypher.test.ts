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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { createJwtRequest } from "../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("Cypher directive", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Actor {
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

                movieOrTVShow(title: String): [MovieOrTVShow]
                    @cypher(
                        statement: """
                        MATCH (n)
                        WHERE (n:TVShow OR n:Movie) AND ($title IS NULL OR n.title = $title)
                        RETURN n
                        """
                        columnName: "n"
                    )

                randomNumber: Int
                    @cypher(
                        statement: """
                        RETURN rand() as res
                        """
                        columnName: "res"
                    )
            }

            union MovieOrTVShow = Movie | TVShow

            type TVShow {
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

            type Movie {
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
        });
    });

    test("Simple directive", async () => {
        const query = gql`
            {
                movies {
                    title
                    topActor {
                        name
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (a:Actor)
                    RETURN a
                }
                WITH a AS this_topActor
                RETURN head(collect(this_topActor { .name })) AS this_topActor
            }
            RETURN this { .title, topActor: this_topActor } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Simple directive (primitive)", async () => {
        const query = gql`
            {
                actors {
                    randomNumber
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN rand() as res
                }
                UNWIND res AS this_randomNumber
                RETURN head(collect(this_randomNumber)) AS this_randomNumber
            }
            RETURN this { randomNumber: this_randomNumber } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("LIMIT happens before custom Cypher if not sorting on the custom Cypher field", async () => {
        const query = gql`
            {
                actors(options: { limit: 10 }) {
                    randomNumber
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            WITH *
            LIMIT $param0
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN rand() as res
                }
                UNWIND res AS this_randomNumber
                RETURN head(collect(this_randomNumber)) AS this_randomNumber
            }
            RETURN this { randomNumber: this_randomNumber } AS this"
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
        const query = gql`
            {
                actors(options: { limit: 10, sort: [{ randomNumber: ASC }] }) {
                    randomNumber
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    RETURN rand() as res
                }
                UNWIND res AS this_randomNumber
                RETURN head(collect(this_randomNumber)) AS this_randomNumber
            }
            WITH *
            ORDER BY this_randomNumber ASC
            LIMIT $param0
            RETURN this { randomNumber: this_randomNumber } AS this"
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
        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (a:Actor)
                    RETURN a
                }
                WITH a AS this_topActor
                CALL {
                    WITH this_topActor
                    CALL {
                        WITH this_topActor
                        WITH this_topActor AS this
                        MATCH (m:Movie {title: $param0})
                        RETURN m
                    }
                    WITH m AS this_topActor_movies
                    RETURN collect(this_topActor_movies { .title }) AS this_topActor_movies
                }
                RETURN head(collect(this_topActor { .name, movies: this_topActor_movies })) AS this_topActor
            }
            RETURN this { .title, topActor: this_topActor } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    test("Super Nested directive", async () => {
        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (a:Actor)
                    RETURN a
                }
                WITH a AS this_topActor
                CALL {
                    WITH this_topActor
                    CALL {
                        WITH this_topActor
                        WITH this_topActor AS this
                        MATCH (m:Movie {title: $param0})
                        RETURN m
                    }
                    WITH m AS this_topActor_movies
                    CALL {
                        WITH this_topActor_movies
                        CALL {
                            WITH this_topActor_movies
                            WITH this_topActor_movies AS this
                            MATCH (a:Actor)
                            RETURN a
                        }
                        WITH a AS this_topActor_movies_topActor
                        CALL {
                            WITH this_topActor_movies_topActor
                            CALL {
                                WITH this_topActor_movies_topActor
                                WITH this_topActor_movies_topActor AS this
                                MATCH (m:Movie {title: $param1})
                                RETURN m
                            }
                            WITH m AS this_topActor_movies_topActor_movies
                            RETURN collect(this_topActor_movies_topActor_movies { .title }) AS this_topActor_movies_topActor_movies
                        }
                        RETURN head(collect(this_topActor_movies_topActor { .name, movies: this_topActor_movies_topActor_movies })) AS this_topActor_movies_topActor
                    }
                    RETURN collect(this_topActor_movies { .title, topActor: this_topActor_movies_topActor }) AS this_topActor_movies
                }
                RETURN head(collect(this_topActor { .name, movies: this_topActor_movies })) AS this_topActor
            }
            RETURN this { .title, topActor: this_topActor } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"param1\\": \\"another title\\"
            }"
        `);
    });

    test("Nested directive with params", async () => {
        const query = gql`
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

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Movie\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (a:Actor)
                    RETURN a
                }
                WITH a AS this_topActor
                CALL {
                    WITH this_topActor
                    CALL {
                        WITH this_topActor
                        WITH this_topActor AS this
                        MATCH (m:Movie {title: $param0})
                        RETURN m
                    }
                    WITH m AS this_topActor_movies
                    RETURN collect(this_topActor_movies { .title }) AS this_topActor_movies
                }
                RETURN head(collect(this_topActor { .name, movies: this_topActor_movies })) AS this_topActor
            }
            RETURN this { .title, topActor: this_topActor } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    test("Union directive", async () => {
        const query = gql`
            {
                actors {
                    movieOrTVShow(title: "some title") {
                        ... on Movie {
                            id
                            title
                            topActor {
                                name
                                year
                            }
                            actors {
                                name
                            }
                        }
                        ... on TVShow {
                            id
                            title
                            topActor {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (n)
                    WHERE (n:TVShow OR n:Movie) AND ($param0 IS NULL OR n.title = $param0)
                    RETURN n
                }
                WITH n AS this_movieOrTVShow
                WITH *
                WHERE (this_movieOrTVShow:\`Movie\` OR this_movieOrTVShow:\`TVShow\`)
                WITH *, this_movieOrTVShow AS this_movieOrTVShow_0
                CALL {
                    WITH this_movieOrTVShow_0
                    CALL {
                        WITH this_movieOrTVShow_0
                        WITH this_movieOrTVShow_0 AS this
                        MATCH (a:Actor)
                        RETURN a
                    }
                    WITH a AS this_movieOrTVShow_0_topActor
                    RETURN head(collect(this_movieOrTVShow_0_topActor { .name, .year })) AS this_movieOrTVShow_0_topActor
                }
                CALL {
                    WITH this_movieOrTVShow_0
                    CALL {
                        WITH this_movieOrTVShow_0
                        WITH this_movieOrTVShow_0 AS this
                        MATCH (a:Actor)
                        RETURN a
                    }
                    WITH a AS this_movieOrTVShow_0_actors
                    RETURN collect(this_movieOrTVShow_0_actors { .name }) AS this_movieOrTVShow_0_actors
                }
                WITH *, this_movieOrTVShow AS this_movieOrTVShow_1
                CALL {
                    WITH this_movieOrTVShow_1
                    CALL {
                        WITH this_movieOrTVShow_1
                        WITH this_movieOrTVShow_1 AS this
                        MATCH (a:Actor)
                        RETURN a
                    }
                    WITH a AS this_movieOrTVShow_1_topActor
                    RETURN head(collect(this_movieOrTVShow_1_topActor { .name })) AS this_movieOrTVShow_1_topActor
                }
                RETURN collect(CASE
                    WHEN this_movieOrTVShow:\`Movie\` THEN this_movieOrTVShow { __resolveType: \\"Movie\\",  .id, .title, topActor: this_movieOrTVShow_0_topActor, actors: this_movieOrTVShow_0_actors }
                    WHEN this_movieOrTVShow:\`TVShow\` THEN this_movieOrTVShow { __resolveType: \\"TVShow\\",  .id, .title, topActor: this_movieOrTVShow_1_topActor }
                END) AS this_movieOrTVShow
            }
            RETURN this { movieOrTVShow: this_movieOrTVShow } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    test("Union directive - querying only __typename", async () => {
        const query = gql`
            {
                actors {
                    movieOrTVShow(title: "some title") {
                        __typename
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Actor\`)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (n)
                    WHERE (n:TVShow OR n:Movie) AND ($param0 IS NULL OR n.title = $param0)
                    RETURN n
                }
                WITH n AS this_movieOrTVShow
                WITH *
                WHERE (this_movieOrTVShow:\`Movie\` OR this_movieOrTVShow:\`TVShow\`)
                RETURN collect(CASE
                    WHEN this_movieOrTVShow:\`Movie\` THEN this_movieOrTVShow { __resolveType: \\"Movie\\" }
                    WHEN this_movieOrTVShow:\`TVShow\` THEN this_movieOrTVShow { __resolveType: \\"TVShow\\" }
                END) AS this_movieOrTVShow
            }
            RETURN this { movieOrTVShow: this_movieOrTVShow } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\"
            }"
        `);
    });

    describe("Top level cypher", () => {
        test("should query custom query and return relationship data", async () => {
            const typeDefs = `
                type Movie {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor {
                    name: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Query {
                    customMovies(title: String!): [Movie]
                        @cypher(
                            statement: """
                            MATCH (m:Movie {title: $title})
                            RETURN m
                            """,
                            columnName: "m"
                        )
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = gql`
                query {
                    customMovies(title: "The Matrix") {
                        title
                        actors {
                            name
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                MATCH (m:Movie {title: $title})
                RETURN m
                }
                WITH m as this
                CALL {
                    WITH this
                    MATCH (this_actors:\`Actor\`)-[this0:ACTED_IN]->(this)
                    WITH this_actors { .name } AS this_actors
                    RETURN collect(this_actors) AS this_actors
                }
                RETURN this { .title, actors: this_actors } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"title\\": \\"The Matrix\\",
                    \\"auth\\": {
                        \\"isAuthenticated\\": false,
                        \\"roles\\": []
                    }
                }"
            `);
        });

        test("should query custom query and return relationship data with given columnName", async () => {
            const typeDefs = `
                type Movie {
                    title: String!
                    actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type Actor {
                    name: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Query {
                    customMovies(title: String!): [Movie]
                        @cypher(
                            statement: """
                            MATCH (m:Movie {title: $title})
                            RETURN m
                            """,
                            columnName: "m"
                        )
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = gql`
                query {
                    customMovies(title: "The Matrix") {
                        title
                        actors {
                            name
                        }
                    }
                }
            `;

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                MATCH (m:Movie {title: $title})
                RETURN m
                }
                WITH m as this
                CALL {
                    WITH this
                    MATCH (this_actors:\`Actor\`)-[this0:ACTED_IN]->(this)
                    WITH this_actors { .name } AS this_actors
                    RETURN collect(this_actors) AS this_actors
                }
                RETURN this { .title, actors: this_actors } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"title\\": \\"The Matrix\\",
                    \\"auth\\": {
                        \\"isAuthenticated\\": false,
                        \\"roles\\": []
                    }
                }"
            `);
        });

        test("should query field custom query and return relationship data with given columnName", async () => {
            const typeDefs = `
                type Movie {
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

                type Actor {
                    name: String!
                    movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const query = gql`
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

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        WITH this AS this
                        MATCH (m:Movie {title: $param0})
                        RETURN m
                    }
                    WITH m AS this_custom
                    CALL {
                        WITH this_custom
                        MATCH (this_custom_actors:\`Actor\`)-[this0:ACTED_IN]->(this_custom)
                        WITH this_custom_actors { .name } AS this_custom_actors
                        RETURN collect(this_custom_actors) AS this_custom_actors
                    }
                    RETURN collect(this_custom { .title, actors: this_custom_actors }) AS this_custom
                }
                RETURN this { custom: this_custom } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"The Matrix\\"
                }"
            `);
        });
    });
});
