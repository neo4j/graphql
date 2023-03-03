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
                    )

                tvShows(title: String): [Movie]
                    @cypher(
                        statement: """
                        MATCH (t:TVShow {title: $title})
                        RETURN t
                        """
                    )

                movieOrTVShow(title: String): [MovieOrTVShow]
                    @cypher(
                        statement: """
                        MATCH (n)
                        WHERE (n:TVShow OR n:Movie) AND ($title IS NULL OR n.title = $title)
                        RETURN n
                        """
                    )

                randomNumber: Int
                    @cypher(
                        statement: """
                        RETURN rand()
                        """
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
                    )
                topActor: Actor
                    @cypher(
                        statement: """
                        MATCH (a:Actor)
                        RETURN a
                        """
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
                    )
                topActor: Actor
                    @cypher(
                        statement: """
                        MATCH (a:Actor)
                        RETURN a
                        """
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
                UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (a:Actor)
                RETURN a\\", { this: this, auth: $auth }) AS this0
                RETURN head(collect(this0 { .name })) AS this0
            }
            RETURN this { .title, topActor: this0 } AS this"
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
                UNWIND apoc.cypher.runFirstColumnSingle(\\"RETURN rand()\\", { this: this, auth: $auth }) AS this0
                RETURN head(collect(this0)) AS this0
            }
            RETURN this { randomNumber: this0 } AS this"
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
                UNWIND apoc.cypher.runFirstColumnSingle(\\"RETURN rand()\\", { this: this, auth: $auth }) AS this0
                RETURN head(collect(this0)) AS this0
            }
            RETURN this { randomNumber: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
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
                UNWIND apoc.cypher.runFirstColumnSingle(\\"RETURN rand()\\", { this: this, auth: $auth }) AS this0
                RETURN head(collect(this0)) AS this0
            }
            WITH *
            ORDER BY this0 ASC
            LIMIT $param1
            RETURN this { randomNumber: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param1\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
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
                UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (a:Actor)
                RETURN a\\", { this: this, auth: $auth }) AS this0
                CALL {
                    WITH this0
                    UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (m:Movie {title: $title})
                    RETURN m\\", { title: $param1, this: this0, auth: $auth }) AS this1
                    RETURN collect(this1 { .title }) AS this1
                }
                RETURN head(collect(this0 { .name, movies: this1 })) AS this0
            }
            RETURN this { .title, topActor: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param1\\": \\"some title\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
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
                UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (a:Actor)
                RETURN a\\", { this: this, auth: $auth }) AS this0
                CALL {
                    WITH this0
                    UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (m:Movie {title: $title})
                    RETURN m\\", { title: $param1, this: this0, auth: $auth }) AS this1
                    CALL {
                        WITH this1
                        UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (a:Actor)
                        RETURN a\\", { this: this1, auth: $auth }) AS this2
                        CALL {
                            WITH this2
                            UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (m:Movie {title: $title})
                            RETURN m\\", { title: $param4, this: this2, auth: $auth }) AS this3
                            RETURN collect(this3 { .title }) AS this3
                        }
                        RETURN head(collect(this2 { .name, movies: this3 })) AS this2
                    }
                    RETURN collect(this1 { .title, topActor: this2 }) AS this1
                }
                RETURN head(collect(this0 { .name, movies: this1 })) AS this0
            }
            RETURN this { .title, topActor: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param1\\": \\"some title\\",
                \\"param4\\": \\"another title\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
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
                UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (a:Actor)
                RETURN a\\", { this: this, auth: $auth }) AS this0
                CALL {
                    WITH this0
                    UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (m:Movie {title: $title})
                    RETURN m\\", { title: $param1, this: this0, auth: $auth }) AS this1
                    RETURN collect(this1 { .title }) AS this1
                }
                RETURN head(collect(this0 { .name, movies: this1 })) AS this0
            }
            RETURN this { .title, topActor: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param1\\": \\"some title\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
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
                UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (n)
                WHERE (n:TVShow OR n:Movie) AND ($title IS NULL OR n.title = $title)
                RETURN n\\", { title: $param0, this: this, auth: $auth }) AS this0
                WITH *
                WHERE (this0:\`Movie\` OR this0:\`TVShow\`)
                WITH *, this0 AS this1
                CALL {
                    WITH this1
                    UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (a:Actor)
                    RETURN a\\", { this: this1, auth: $auth }) AS this2
                    RETURN head(collect(this2 { .name, .year })) AS this2
                }
                CALL {
                    WITH this1
                    UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (a:Actor)
                    RETURN a\\", { this: this1, auth: $auth }) AS this3
                    RETURN collect(this3 { .name }) AS this3
                }
                WITH *, this0 AS this4
                CALL {
                    WITH this4
                    UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (a:Actor)
                    RETURN a\\", { this: this4, auth: $auth }) AS this5
                    RETURN head(collect(this5 { .name })) AS this5
                }
                RETURN collect(CASE
                    WHEN this0:\`Movie\` THEN this0 { __resolveType: \\"Movie\\",  .id, .title, topActor: this2, actors: this3 }
                    WHEN this0:\`TVShow\` THEN this0 { __resolveType: \\"TVShow\\",  .id, .title, topActor: this5 }
                END) AS this0
            }
            RETURN this { movieOrTVShow: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
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
                UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (n)
                WHERE (n:TVShow OR n:Movie) AND ($title IS NULL OR n.title = $title)
                RETURN n\\", { title: $param0, this: this, auth: $auth }) AS this0
                WITH *
                WHERE (this0:\`Movie\` OR this0:\`TVShow\`)
                RETURN collect(CASE
                    WHEN this0:\`Movie\` THEN this0 { __resolveType: \\"Movie\\" }
                    WHEN this0:\`TVShow\` THEN this0 { __resolveType: \\"TVShow\\" }
                END) AS this0
            }
            RETURN this { movieOrTVShow: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some title\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
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
                            """
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
                "WITH apoc.cypher.runFirstColumnMany(\\"MATCH (m:Movie {title: $title})
                RETURN m\\", {auth: $auth, title: $title}) as x
                UNWIND x as this
                WITH this
                CALL {
                    WITH this
                    MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                    WITH this1 { .name } AS this1
                    RETURN collect(this1) AS var2
                }
                RETURN this { .title, actors: var2 } AS this"
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
                    MATCH (this)<-[this0:\`ACTED_IN\`]-(this1:\`Actor\`)
                    WITH this1 { .name } AS this1
                    RETURN collect(this1) AS var2
                }
                RETURN this { .title, actors: var2 } AS this"
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
                    WITH m AS this0
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this1:\`ACTED_IN\`]-(this2:\`Actor\`)
                        WITH this2 { .name } AS this2
                        RETURN collect(this2) AS var3
                    }
                    RETURN collect(this0 { .title, actors: var3 }) AS this0
                }
                RETURN this { custom: this0 } AS this"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"param0\\": \\"The Matrix\\"
                }"
            `);
        });
    });
});
