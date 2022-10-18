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
                RETURN a\\", { this: this, auth: $auth }) AS this_topActor
                RETURN head(collect(this_topActor { .name })) AS this_topActor
            }
            RETURN this { .title, topActor: this_topActor } AS this"
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
                UNWIND apoc.cypher.runFirstColumnSingle(\\"RETURN rand()\\", { this: this, auth: $auth }) AS this_randomNumber
                RETURN head(collect(this_randomNumber)) AS this_randomNumber
            }
            RETURN this { randomNumber: this_randomNumber } AS this"
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
            LIMIT $this_limit
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnSingle(\\"RETURN rand()\\", { this: this, auth: $auth }) AS this_randomNumber
                RETURN head(collect(this_randomNumber)) AS this_randomNumber
            }
            RETURN this { randomNumber: this_randomNumber } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_limit\\": {
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
                UNWIND apoc.cypher.runFirstColumnSingle(\\"RETURN rand()\\", { this: this, auth: $auth }) AS this_randomNumber
                RETURN head(collect(this_randomNumber)) AS this_randomNumber
            }
            WITH *
            ORDER BY this_randomNumber ASC
            LIMIT $this_limit
            RETURN this { randomNumber: this_randomNumber } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_limit\\": {
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
                RETURN a\\", { this: this, auth: $auth }) AS this_topActor
                CALL {
                    WITH this_topActor
                    UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (m:Movie {title: $title})
                    RETURN m\\", { title: $param1, this: this_topActor, auth: $auth }) AS this_topActor_movies
                    RETURN collect(this_topActor_movies { .title }) AS this_topActor_movies
                }
                RETURN head(collect(this_topActor { .name, movies: this_topActor_movies })) AS this_topActor
            }
            RETURN this { .title, topActor: this_topActor } AS this"
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
                RETURN a\\", { this: this, auth: $auth }) AS this_topActor
                CALL {
                    WITH this_topActor
                    UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (m:Movie {title: $title})
                    RETURN m\\", { title: $param1, this: this_topActor, auth: $auth }) AS this_topActor_movies
                    CALL {
                        WITH this_topActor_movies
                        UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (a:Actor)
                        RETURN a\\", { this: this_topActor_movies, auth: $auth }) AS this_topActor_movies_topActor
                        CALL {
                            WITH this_topActor_movies_topActor
                            UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (m:Movie {title: $title})
                            RETURN m\\", { title: $param4, this: this_topActor_movies_topActor, auth: $auth }) AS this_topActor_movies_topActor_movies
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
                RETURN a\\", { this: this, auth: $auth }) AS this_topActor
                CALL {
                    WITH this_topActor
                    UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (m:Movie {title: $title})
                    RETURN m\\", { title: $param1, this: this_topActor, auth: $auth }) AS this_topActor_movies
                    RETURN collect(this_topActor_movies { .title }) AS this_topActor_movies
                }
                RETURN head(collect(this_topActor { .name, movies: this_topActor_movies })) AS this_topActor
            }
            RETURN this { .title, topActor: this_topActor } AS this"
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
                RETURN n\\", { title: $param0, this: this, auth: $auth }) AS this_movieOrTVShow
                WITH *
                WHERE (this_movieOrTVShow:\`Movie\` OR this_movieOrTVShow:\`TVShow\`)
                WITH *, this_movieOrTVShow AS this_movieOrTVShow_0
                CALL {
                    WITH this_movieOrTVShow_0
                    UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (a:Actor)
                    RETURN a\\", { this: this_movieOrTVShow_0, auth: $auth }) AS this_movieOrTVShow_0_topActor
                    RETURN head(collect(this_movieOrTVShow_0_topActor { .name, .year })) AS this_movieOrTVShow_0_topActor
                }
                CALL {
                    WITH this_movieOrTVShow_0
                    UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (a:Actor)
                    RETURN a\\", { this: this_movieOrTVShow_0, auth: $auth }) AS this_movieOrTVShow_0_actors
                    RETURN collect(this_movieOrTVShow_0_actors { .name }) AS this_movieOrTVShow_0_actors
                }
                WITH *, this_movieOrTVShow AS this_movieOrTVShow_1
                CALL {
                    WITH this_movieOrTVShow_1
                    UNWIND apoc.cypher.runFirstColumnSingle(\\"MATCH (a:Actor)
                    RETURN a\\", { this: this_movieOrTVShow_1, auth: $auth }) AS this_movieOrTVShow_1_topActor
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
                RETURN n\\", { title: $param0, this: this, auth: $auth }) AS this_movieOrTVShow
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
                \\"param0\\": \\"some title\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
                }
            }"
        `);
    });
});
