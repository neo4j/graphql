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
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

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
                randomNumber: Int
                    @cypher(
                        statement: """
                        RETURN rand()
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
});
