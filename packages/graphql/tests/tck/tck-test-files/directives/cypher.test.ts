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
    let neoSchema: Neo4jGraphQL;

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
            config: { enableRegex: true, jwt: { secret } },
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
            "MATCH (this:Movie)
            RETURN this { .title, topActor: head([this_topActor IN apoc.cypher.runFirstColumn(\\"MATCH (a:Actor)
            RETURN a\\", {this: this, auth: $auth}, false) | this_topActor { .name }]) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
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
            "MATCH (this:Actor)
            RETURN this { randomNumber:  apoc.cypher.runFirstColumn(\\"RETURN rand()\\", {this: this, auth: $auth}, false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
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
            "CALL {
            MATCH (this:Actor)
            RETURN this
            LIMIT $this_limit
            }
            RETURN this { randomNumber:  apoc.cypher.runFirstColumn(\\"RETURN rand()\\", {this: this, auth: $auth}, false) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_limit\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
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
            "MATCH (this:Actor)
            RETURN this { randomNumber:  apoc.cypher.runFirstColumn(\\"RETURN rand()\\", {this: this, auth: $auth}, false) } as this
            ORDER BY this_sort.randomNumber ASC
            LIMIT $this_limit"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_limit\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
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
            "MATCH (this:Movie)
            RETURN this { .title, topActor: head([this_topActor IN apoc.cypher.runFirstColumn(\\"MATCH (a:Actor)
            RETURN a\\", {this: this, auth: $auth}, false) | this_topActor { .name, movies: [this_topActor_movies IN apoc.cypher.runFirstColumn(\\"MATCH (m:Movie {title: $title})
            RETURN m\\", {this: this_topActor, auth: $auth, title: $this_topActor_movies_title}, true) | this_topActor_movies { .title }] }]) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_topActor_movies_title\\": \\"some title\\",
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
            "MATCH (this:Movie)
            RETURN this { .title, topActor: head([this_topActor IN apoc.cypher.runFirstColumn(\\"MATCH (a:Actor)
            RETURN a\\", {this: this, auth: $auth}, false) | this_topActor { .name, movies: [this_topActor_movies IN apoc.cypher.runFirstColumn(\\"MATCH (m:Movie {title: $title})
            RETURN m\\", {this: this_topActor, auth: $auth, title: $this_topActor_movies_title}, true) | this_topActor_movies { .title, topActor: head([this_topActor_movies_topActor IN apoc.cypher.runFirstColumn(\\"MATCH (a:Actor)
            RETURN a\\", {this: this_topActor_movies, auth: $auth}, false) | this_topActor_movies_topActor { .name, movies: [this_topActor_movies_topActor_movies IN apoc.cypher.runFirstColumn(\\"MATCH (m:Movie {title: $title})
            RETURN m\\", {this: this_topActor_movies_topActor, auth: $auth, title: $this_topActor_movies_topActor_movies_title}, true) | this_topActor_movies_topActor_movies { .title }] }]) }] }]) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_topActor_movies_topActor_movies_title\\": \\"another title\\",
                \\"this_topActor_movies_title\\": \\"some title\\",
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
            "MATCH (this:Movie)
            RETURN this { .title, topActor: head([this_topActor IN apoc.cypher.runFirstColumn(\\"MATCH (a:Actor)
            RETURN a\\", {this: this, auth: $auth}, false) | this_topActor { .name, movies: [this_topActor_movies IN apoc.cypher.runFirstColumn(\\"MATCH (m:Movie {title: $title})
            RETURN m\\", {this: this_topActor, auth: $auth, title: $this_topActor_movies_title}, true) | this_topActor_movies { .title }] }]) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_topActor_movies_title\\": \\"some title\\",
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
            "MATCH (this:Actor)
            RETURN this { movieOrTVShow: [this_movieOrTVShow IN apoc.cypher.runFirstColumn(\\"MATCH (n)
            WHERE (n:TVShow OR n:Movie) AND ($title IS NULL OR n.title = $title)
            RETURN n\\", {this: this, auth: $auth, title: $this_movieOrTVShow_title}, false) WHERE (\\"Movie\\" IN labels(this_movieOrTVShow)) OR (\\"TVShow\\" IN labels(this_movieOrTVShow))  |   [ this_movieOrTVShow IN [this_movieOrTVShow] WHERE (\\"Movie\\" IN labels(this_movieOrTVShow)) | this_movieOrTVShow { __resolveType: \\"Movie\\",  .id, .title, topActor: head([this_movieOrTVShow_topActor IN apoc.cypher.runFirstColumn(\\"MATCH (a:Actor)
            RETURN a\\", {this: this_movieOrTVShow, auth: $auth}, false) | this_movieOrTVShow_topActor { .name }]) } ] + [ this_movieOrTVShow IN [this_movieOrTVShow] WHERE (\\"TVShow\\" IN labels(this_movieOrTVShow)) | this_movieOrTVShow { __resolveType: \\"TVShow\\",  .id, .title, topActor: head([this_movieOrTVShow_topActor IN apoc.cypher.runFirstColumn(\\"MATCH (a:Actor)
            RETURN a\\", {this: this_movieOrTVShow, auth: $auth}, false) | this_movieOrTVShow_topActor { .name }]) } ] ] } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_movieOrTVShow_title\\": \\"some title\\",
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
