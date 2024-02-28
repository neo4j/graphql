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

describe("Cypher directive on union", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
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

            union MovieOrTVShow = Movie | TVShow

            type TVShow {
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

            type Movie {
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

    test("top-level union", async () => {
        const query = /* GraphQL */ `
            query {
                moviesOrTVShows(title: "The Matrix") {
                    ... on Movie {
                        title
                    }
                    ... on TVShow {
                        title
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
                    WHERE this0:Movie
                    WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    WITH this0 { .title, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
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

    test("top-level union when only typename is returned", async () => {
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
                    WHERE this0:Movie
                    WITH this0 { __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    WITH this0 { __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
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

    test("top-level union with nested projection", async () => {
        const query = /* GraphQL */ `
            query {
                moviesOrTVShows(title: "The Matrix") {
                    ... on Movie {
                        title
                        actors {
                            name
                        }
                        topActor {
                            name
                        }
                    }
                    ... on TVShow {
                        title
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
                    WHERE this0:Movie
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                        WITH this2 { .name } AS this2
                        RETURN collect(this2) AS var3
                    }
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this4:ACTED_IN]-(this5:Actor)
                        WITH this5 { .name } AS this5
                        RETURN head(collect(this5)) AS var6
                    }
                    WITH this0 { .title, actors: var3, topActor: var6, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var7
                    UNION
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
                        WITH a AS this8
                        WITH this8 { .name } AS this8
                        RETURN collect(this8) AS var9
                    }
                    CALL {
                        WITH this0
                        CALL {
                            WITH this0
                            WITH this0 AS this
                            MATCH (a:Actor)
                            RETURN a
                        }
                        WITH a AS this10
                        WITH this10 { .name } AS this10
                        RETURN head(collect(this10)) AS var11
                    }
                    WITH this0 { .title, actors: var9, topActor: var11, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var7
                }
                RETURN var7
            }
            RETURN var7 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level union with nested relationship parameters", async () => {
        const query = /* GraphQL */ `
            query {
                moviesOrTVShows(title: "The Matrix") {
                    ... on Movie {
                        title
                        actors(where: { name: "Keanu Reeves" }) {
                            name
                        }
                    }
                    ... on TVShow {
                        title
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
                    WHERE this0:Movie
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                        WHERE this2.name = $param1
                        WITH this2 { .name } AS this2
                        RETURN collect(this2) AS var3
                    }
                    WITH this0 { .title, actors: var3, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var4
                    UNION
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
                        WITH a AS this5
                        CALL {
                            WITH this5
                            CALL {
                                WITH this5
                                WITH this5 AS this
                                MATCH (m:Movie {title: $param2})
                                RETURN m
                            }
                            WITH m AS this6
                            WITH this6 { .title } AS this6
                            RETURN collect(this6) AS var7
                        }
                        WITH this5 { .name, movies: var7 } AS this5
                        RETURN collect(this5) AS var8
                    }
                    WITH this0 { .title, actors: var8, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var4
                }
                RETURN var4
            }
            RETURN var4 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"Keanu Reeves\\",
                \\"param2\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level single union", async () => {
        const query = /* GraphQL */ `
            query {
                movieOrTVShow(title: "The Matrix") {
                    ... on Movie {
                        title
                    }
                    ... on TVShow {
                        title
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
                    WHERE this0:Movie
                    WITH this0 { .title, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    WITH this0 { .title, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                }
                RETURN var1
            }
            RETURN head(var1) AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level single union when only typename is returned", async () => {
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
                    WHERE this0:Movie
                    WITH this0 { __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                    UNION
                    WITH *
                    MATCH (this0)
                    WHERE this0:TVShow
                    WITH this0 { __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var1
                }
                RETURN var1
            }
            RETURN head(var1) AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level single union with nested projection", async () => {
        const query = /* GraphQL */ `
            query {
                movieOrTVShow(title: "The Matrix") {
                    ... on Movie {
                        title
                        actors {
                            name
                        }
                        topActor {
                            name
                        }
                    }
                    ... on TVShow {
                        title
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
                    WHERE this0:Movie
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                        WITH this2 { .name } AS this2
                        RETURN collect(this2) AS var3
                    }
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this4:ACTED_IN]-(this5:Actor)
                        WITH this5 { .name } AS this5
                        RETURN head(collect(this5)) AS var6
                    }
                    WITH this0 { .title, actors: var3, topActor: var6, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var7
                    UNION
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
                        WITH a AS this8
                        WITH this8 { .name } AS this8
                        RETURN collect(this8) AS var9
                    }
                    CALL {
                        WITH this0
                        CALL {
                            WITH this0
                            WITH this0 AS this
                            MATCH (a:Actor)
                            RETURN a
                        }
                        WITH a AS this10
                        WITH this10 { .name } AS this10
                        RETURN head(collect(this10)) AS var11
                    }
                    WITH this0 { .title, actors: var9, topActor: var11, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var7
                }
                RETURN var7
            }
            RETURN head(var7) AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\"
            }"
        `);
    });

    test("top-level single union with nested relationship parameters", async () => {
        const query = /* GraphQL */ `
            query {
                moviesOrTVShows(title: "The Matrix") {
                    ... on Movie {
                        title
                        actors(where: { name: "Keanu Reeves" }) {
                            name
                        }
                    }
                    ... on TVShow {
                        title
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
                    WHERE this0:Movie
                    CALL {
                        WITH this0
                        MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                        WHERE this2.name = $param1
                        WITH this2 { .name } AS this2
                        RETURN collect(this2) AS var3
                    }
                    WITH this0 { .title, actors: var3, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                    RETURN this0 AS var4
                    UNION
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
                        WITH a AS this5
                        CALL {
                            WITH this5
                            CALL {
                                WITH this5
                                WITH this5 AS this
                                MATCH (m:Movie {title: $param2})
                                RETURN m
                            }
                            WITH m AS this6
                            WITH this6 { .title } AS this6
                            RETURN collect(this6) AS var7
                        }
                        WITH this5 { .name, movies: var7 } AS this5
                        RETURN collect(this5) AS var8
                    }
                    WITH this0 { .title, actors: var8, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                    RETURN this0 AS var4
                }
                RETURN var4
            }
            RETURN var4 AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"Keanu Reeves\\",
                \\"param2\\": \\"The Matrix\\"
            }"
        `);
    });

    test("simple top-level field with nested cypher union", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    moviesOrTVShows(title: "The Matrix") {
                        ... on Movie {
                            title
                            actors(where: { name: "Keanu Reeves" }) {
                                name
                            }
                        }
                        ... on TVShow {
                            title
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
                        WHERE this0:Movie
                        CALL {
                            WITH this0
                            MATCH (this0)<-[this1:ACTED_IN]-(this2:Actor)
                            WHERE this2.name = $param1
                            WITH this2 { .name } AS this2
                            RETURN collect(this2) AS var3
                        }
                        WITH this0 { .title, actors: var3, __resolveType: \\"Movie\\", __id: id(this0) } AS this0
                        RETURN this0 AS var4
                        UNION
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
                            WITH a AS this5
                            CALL {
                                WITH this5
                                CALL {
                                    WITH this5
                                    WITH this5 AS this
                                    MATCH (m:Movie {title: $param2})
                                    RETURN m
                                }
                                WITH m AS this6
                                WITH this6 { .title } AS this6
                                RETURN collect(this6) AS var7
                            }
                            WITH this5 { .name, movies: var7 } AS this5
                            RETURN collect(this5) AS var8
                        }
                        WITH this0 { .title, actors: var8, __resolveType: \\"TVShow\\", __id: id(this0) } AS this0
                        RETURN this0 AS var4
                    }
                    RETURN var4
                }
                RETURN collect(var4) AS this0
            }
            RETURN this { moviesOrTVShows: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"The Matrix\\",
                \\"param1\\": \\"Keanu Reeves\\",
                \\"param2\\": \\"The Matrix\\"
            }"
        `);
    });
});
