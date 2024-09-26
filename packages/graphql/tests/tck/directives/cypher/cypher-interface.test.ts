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

describe("Cypher directive on interface", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
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

                moviesOrTVShows(title: String): [MovieOrTVShow]
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

            interface MovieOrTVShow {
                title: String
            }

            type TVShow implements MovieOrTVShow @node {
                id: ID
                title: String
                numSeasons: Int
                actors: [Actor!]!
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

            type Movie implements MovieOrTVShow @node {
                id: ID
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                topActor: Actor @relationship(type: "ACTED_IN", direction: IN)
            }

            type Query {
                moviesOrTVShows(title: String): [MovieOrTVShow]
                    @cypher(
                        statement: """
                        MATCH (n)
                        WHERE (n:TVShow OR n:Movie) AND ($title IS NULL OR n.title = $title)
                        RETURN n
                        """
                        columnName: "n"
                    )

                movieOrTVShow(title: String): MovieOrTVShow
                    @cypher(
                        statement: """
                        MATCH (n)
                        WHERE (n:TVShow OR n:Movie) AND ($title IS NULL OR n.title = $title)
                        RETURN n
                        LIMIT 1
                        """
                        columnName: "n"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("top-level interface", async () => {
        const query = /* GraphQL */ `
            query {
                moviesOrTVShows(title: "The Matrix") {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (n)
                WHERE (n:TVShow OR n:Movie) AND ($param0 IS NULL OR n.title = $param0)
                RETURN n
            }
            WITH n AS this0
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    WITH this0 { .title, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:Movie
                    WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                }
                RETURN var1
            }
            RETURN var1 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level interface when only typename is returned", async () => {
        const query = /* GraphQL */ `
            query {
                moviesOrTVShows(title: "The Matrix") {
                    __typename
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (n)
                WHERE (n:TVShow OR n:Movie) AND ($param0 IS NULL OR n.title = $param0)
                RETURN n
            }
            WITH n AS this0
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    WITH this0 { __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:Movie
                    WITH this0 { __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                }
                RETURN var1
            }
            RETURN var1 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level interface with nested projection", async () => {
        const query = /* GraphQL */ `
            query {
                moviesOrTVShows(title: "The Matrix") {
                    title
                    ... on Movie {
                        actors {
                            name
                        }
                        topActor {
                            name
                        }
                    }
                    ... on TVShow {
                        actors {
                            name
                        }
                        topActor {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (n)
                WHERE (n:TVShow OR n:Movie) AND ($param0 IS NULL OR n.title = $param0)
                RETURN n
            }
            WITH n AS this0
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    CALL {
                        WITH this0
                        CALL {
                            WITH this0
                            WITH this0 AS this
                            MATCH (a:Actor)
                            RETURN a
                        }
                        WITH a AS this1
                        WITH this1 { .name } AS this1
                        RETURN collect(this1) AS var2
                    }
                    CALL {
                        WITH this0
                        CALL {
                            WITH this0
                            WITH this0 AS this
                            MATCH (a:Actor)
                            RETURN a
                        }
                        WITH a AS this3
                        WITH this3 { .name } AS this3
                        RETURN head(collect(this3)) AS var4
                    }
                    WITH this0 { .title, actors: var2, topActor: var4, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var5
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:Movie
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this6:ACTED_IN]-(this7:Actor)
                        WITH this7 { .name } AS this7
                        RETURN collect(this7) AS var8
                    }
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this9:ACTED_IN]-(this10:Actor)
                        WITH this10 { .name } AS this10
                        RETURN head(collect(this10)) AS var11
                    }
                    WITH this0 { .title, actors: var8, topActor: var11, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var5
                }
                RETURN var5
            }
            RETURN var5 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level interface with nested relationship parameters", async () => {
        const query = /* GraphQL */ `
            query {
                moviesOrTVShows(title: "The Matrix") {
                    title
                    ... on Movie {
                        actors(where: { name_EQ: "Keanu Reeves" }) {
                            name
                        }
                    }
                    ... on TVShow {
                        actors {
                            name
                            movies(title: "The Matrix") {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (n)
                WHERE (n:TVShow OR n:Movie) AND ($param0 IS NULL OR n.title = $param0)
                RETURN n
            }
            WITH n AS this0
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    CALL {
                        WITH this0
                        CALL {
                            WITH this0
                            WITH this0 AS this
                            MATCH (a:Actor)
                            RETURN a
                        }
                        WITH a AS this1
                        CALL {
                            WITH this1
                            CALL {
                                WITH this1
                                WITH this1 AS this
                                MATCH (m:Movie {title: $param1})
                                RETURN m
                            }
                            WITH m AS this2
                            WITH this2 { .title } AS this2
                            RETURN collect(this2) AS var3
                        }
                        WITH this1 { .name, movies: var3 } AS this1
                        RETURN collect(this1) AS var4
                    }
                    WITH this0 { .title, actors: var4, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var5
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:Movie
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this6:ACTED_IN]-(this7:Actor)
                        WHERE this7.name = $param2
                        WITH this7 { .name } AS this7
                        RETURN collect(this7) AS var8
                    }
                    WITH this0 { .title, actors: var8, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var5
                }
                RETURN var5
            }
            RETURN var5 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"The Matrix\\",
                \\"param2\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("top-level single interface", async () => {
        const query = /* GraphQL */ `
            query {
                movieOrTVShow(title: "The Matrix") {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (n)
                WHERE (n:TVShow OR n:Movie) AND ($param0 IS NULL OR n.title = $param0)
                RETURN n
                LIMIT 1
            }
            WITH n AS this0
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    WITH this0 { .title, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:Movie
                    WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                }
                RETURN var1
            }
            RETURN var1 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level single interface when only typename is returned", async () => {
        const query = /* GraphQL */ `
            query {
                movieOrTVShow(title: "The Matrix") {
                    __typename
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (n)
                WHERE (n:TVShow OR n:Movie) AND ($param0 IS NULL OR n.title = $param0)
                RETURN n
                LIMIT 1
            }
            WITH n AS this0
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    WITH this0 { __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:Movie
                    WITH this0 { __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                }
                RETURN var1
            }
            RETURN var1 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level single interface with nested projection", async () => {
        const query = /* GraphQL */ `
            query {
                movieOrTVShow(title: "The Matrix") {
                    title
                    ... on Movie {
                        actors {
                            name
                        }
                        topActor {
                            name
                        }
                    }
                    ... on TVShow {
                        actors {
                            name
                        }
                        topActor {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (n)
                WHERE (n:TVShow OR n:Movie) AND ($param0 IS NULL OR n.title = $param0)
                RETURN n
                LIMIT 1
            }
            WITH n AS this0
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    CALL {
                        WITH this0
                        CALL {
                            WITH this0
                            WITH this0 AS this
                            MATCH (a:Actor)
                            RETURN a
                        }
                        WITH a AS this1
                        WITH this1 { .name } AS this1
                        RETURN collect(this1) AS var2
                    }
                    CALL {
                        WITH this0
                        CALL {
                            WITH this0
                            WITH this0 AS this
                            MATCH (a:Actor)
                            RETURN a
                        }
                        WITH a AS this3
                        WITH this3 { .name } AS this3
                        RETURN head(collect(this3)) AS var4
                    }
                    WITH this0 { .title, actors: var2, topActor: var4, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var5
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:Movie
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this6:ACTED_IN]-(this7:Actor)
                        WITH this7 { .name } AS this7
                        RETURN collect(this7) AS var8
                    }
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this9:ACTED_IN]-(this10:Actor)
                        WITH this10 { .name } AS this10
                        RETURN head(collect(this10)) AS var11
                    }
                    WITH this0 { .title, actors: var8, topActor: var11, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var5
                }
                RETURN var5
            }
            RETURN var5 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level single interface with nested relationship parameters", async () => {
        const query = /* GraphQL */ `
            query {
                moviesOrTVShows(title: "The Matrix") {
                    title
                    ... on Movie {
                        actors(where: { name_EQ: "Keanu Reeves" }) {
                            name
                        }
                    }
                    ... on TVShow {
                        actors {
                            name
                            movies(title: "The Matrix") {
                                title
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH (n)
                WHERE (n:TVShow OR n:Movie) AND ($param0 IS NULL OR n.title = $param0)
                RETURN n
            }
            WITH n AS this0
            CALL {
                WITH this0
                CALL {
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    CALL {
                        WITH this0
                        CALL {
                            WITH this0
                            WITH this0 AS this
                            MATCH (a:Actor)
                            RETURN a
                        }
                        WITH a AS this1
                        CALL {
                            WITH this1
                            CALL {
                                WITH this1
                                WITH this1 AS this
                                MATCH (m:Movie {title: $param1})
                                RETURN m
                            }
                            WITH m AS this2
                            WITH this2 { .title } AS this2
                            RETURN collect(this2) AS var3
                        }
                        WITH this1 { .name, movies: var3 } AS this1
                        RETURN collect(this1) AS var4
                    }
                    WITH this0 { .title, actors: var4, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var5
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:Movie
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this6:ACTED_IN]-(this7:Actor)
                        WHERE this7.name = $param2
                        WITH this7 { .name } AS this7
                        RETURN collect(this7) AS var8
                    }
                    WITH this0 { .title, actors: var8, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var5
                }
                RETURN var5
            }
            RETURN var5 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"The Matrix\\",
                \\"param2\\": \\"Keanu Reeves\\"
            }"
        `);
    });

    test("simple top-level field with nested cypher interface", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    moviesOrTVShows(title: "The Matrix") {
                        title
                        ... on Movie {
                            actors(where: { name_EQ: "Keanu Reeves" }) {
                                name
                            }
                        }
                        ... on TVShow {
                            actors {
                                name
                                movies(title: "The Matrix") {
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
            "MATCH (this:Actor)
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (n)
                    WHERE (n:TVShow OR n:Movie) AND ($param0 IS NULL OR n.title = $param0)
                    RETURN n
                }
                WITH n AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)
                        WHERE this0:TVShow
                        CALL {
                            WITH this0
                            CALL {
                                WITH this0
                                WITH this0 AS this
                                MATCH (a:Actor)
                                RETURN a
                            }
                            WITH a AS this1
                            CALL {
                                WITH this1
                                CALL {
                                    WITH this1
                                    WITH this1 AS this
                                    MATCH (m:Movie {title: $param1})
                                    RETURN m
                                }
                                WITH m AS this2
                                WITH this2 { .title } AS this2
                                RETURN collect(this2) AS var3
                            }
                            WITH this1 { .name, movies: var3 } AS this1
                            RETURN collect(this1) AS var4
                        }
                        WITH this0 { .title, actors: var4, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                        RETURN this0 AS var5
                        UNION
                        WITH *
                        MATCH (this0)
                        WHERE this0:Movie
                        CALL {
                            WITH this0
                            MATCH (this0)<-[this6:ACTED_IN]-(this7:Actor)
                            WHERE this7.name = $param2
                            WITH this7 { .name } AS this7
                            RETURN collect(this7) AS var8
                        }
                        WITH this0 { .title, actors: var8, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                        RETURN this0 AS var5
                    }
                    RETURN var5
                }
                RETURN collect(var5) AS this0
            }
            RETURN this { moviesOrTVShows: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"The Matrix\\",
                \\"param2\\": \\"Keanu Reeves\\"
            }"
        `);
    });
});
