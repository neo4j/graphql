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

import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

/**
 * Snapshots of the related integration test.
 **/
describe("https://github.com/neo4j/graphql/pull/2068", () => {
    describe("Updates within updates", () => {
        const typeDefs = gql`
            interface Content {
                id: ID
                content: String
                creator: User! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type User {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            type Comment implements Content {
                id: ID
                content: String
                creator: User!
            }

            extend type User
                @authorization(
                    filter: [
                        {
                            operations: [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                            where: { node: { id: "$jwt.sub" } }
                        }
                    ]
                )

            extend type User {
                password: String! @authorization(filter: [{ operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }
        `;

        test("Connect node - update within an update", async () => {
            const query = gql`
                mutation {
                    updateUsers(update: { content: { connect: { where: { node: { } } } } }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:User)
                WITH *
                WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                WITH this
                CALL {
                	 WITH this
                WITH *
                CALL {
                	WITH this
                	OPTIONAL MATCH (this_content0_connect0_node:Comment)
                	WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                	CALL {
                		WITH *
                		WITH collect(this_content0_connect0_node) as connectedNodes, collect(this) as parentNodes
                		CALL {
                			WITH connectedNodes, parentNodes
                			UNWIND parentNodes as this
                			UNWIND connectedNodes as this_content0_connect0_node
                			MERGE (this)-[:HAS_CONTENT]->(this_content0_connect0_node)
                		}
                	}
                WITH this, this_content0_connect0_node
                	RETURN count(*) AS connect_this_content0_connect_Comment0
                }
                RETURN count(*) AS update_this_Comment
                }
                WITH *
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        MATCH (this)-[update_this0:HAS_CONTENT]->(update_this1:Comment)
                        WITH { node: { __resolveType: \\"Comment\\", __id: id(update_this1) } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS update_var2
                }
                RETURN collect(DISTINCT this { .id, contentConnection: update_var2 }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Connect node - user defined update where within an update", async () => {
            const query = gql`
                mutation {
                    updateUsers(update: { content: { connect: { where: { node: { id: "differentID" } } } } }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:User)
                WITH *
                WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                WITH this
                CALL {
                	 WITH this
                WITH *
                CALL {
                	WITH this
                	OPTIONAL MATCH (this_content0_connect0_node:Comment)
                	WHERE this_content0_connect0_node.id = $this_content0_connect0_node_param0 AND ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                	CALL {
                		WITH *
                		WITH collect(this_content0_connect0_node) as connectedNodes, collect(this) as parentNodes
                		CALL {
                			WITH connectedNodes, parentNodes
                			UNWIND parentNodes as this
                			UNWIND connectedNodes as this_content0_connect0_node
                			MERGE (this)-[:HAS_CONTENT]->(this_content0_connect0_node)
                		}
                	}
                WITH this, this_content0_connect0_node
                	RETURN count(*) AS connect_this_content0_connect_Comment0
                }
                RETURN count(*) AS update_this_Comment
                }
                WITH *
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        MATCH (this)-[update_this0:HAS_CONTENT]->(update_this1:Comment)
                        WITH { node: { __resolveType: \\"Comment\\", __id: id(update_this1) } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS update_var2
                }
                RETURN collect(DISTINCT this { .id, contentConnection: update_var2 }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this_content0_connect0_node_param0\\": \\"differentID\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Disconnect node - update within an update", async () => {
            const query = gql`
                mutation {
                    updateUsers(update: { content: { disconnect: { where: {} } } }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:User)
                WITH *
                WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                WITH this
                CALL {
                	 WITH this
                WITH this
                CALL {
                WITH this
                OPTIONAL MATCH (this)-[this_content0_disconnect0_rel:HAS_CONTENT]->(this_content0_disconnect0:Comment)
                WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                CALL {
                	WITH this_content0_disconnect0, this_content0_disconnect0_rel, this
                	WITH collect(this_content0_disconnect0) as this_content0_disconnect0, this_content0_disconnect0_rel, this
                	UNWIND this_content0_disconnect0 as x
                	DELETE this_content0_disconnect0_rel
                }
                RETURN count(*) AS disconnect_this_content0_disconnect_Comment
                }
                RETURN count(*) AS update_this_Comment
                }
                WITH *
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        MATCH (this)-[update_this0:HAS_CONTENT]->(update_this1:Comment)
                        WITH { node: { __resolveType: \\"Comment\\", __id: id(update_this1) } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS update_var2
                }
                RETURN collect(DISTINCT this { .id, contentConnection: update_var2 }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Disconnect node - user defined update where within an update", async () => {
            const query = gql`
                mutation {
                    updateUsers(update: { content: [{ disconnect: { where: { node: { id: "someId" } } } }] }) {
                        users {
                            id
                            contentConnection {
                                totalCount
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:User)
                WITH *
                WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                WITH this
                CALL {
                	 WITH this
                WITH this
                CALL {
                WITH this
                OPTIONAL MATCH (this)-[this_content0_disconnect0_rel:HAS_CONTENT]->(this_content0_disconnect0:Comment)
                WHERE this_content0_disconnect0.id = $updateUsers_args_update_content0_disconnect0_where_Comment_this_content0_disconnect0param0 AND ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
                CALL {
                	WITH this_content0_disconnect0, this_content0_disconnect0_rel, this
                	WITH collect(this_content0_disconnect0) as this_content0_disconnect0, this_content0_disconnect0_rel, this
                	UNWIND this_content0_disconnect0 as x
                	DELETE this_content0_disconnect0_rel
                }
                RETURN count(*) AS disconnect_this_content0_disconnect_Comment
                }
                RETURN count(*) AS update_this_Comment
                }
                WITH *
                CALL {
                    WITH this
                    CALL {
                        WITH this
                        MATCH (this)-[update_this0:HAS_CONTENT]->(update_this1:Comment)
                        WITH { node: { __resolveType: \\"Comment\\", __id: id(update_this1) } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS update_var2
                }
                RETURN collect(DISTINCT this { .id, contentConnection: update_var2 }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"updateUsers_args_update_content0_disconnect0_where_Comment_this_content0_disconnect0param0\\": \\"someId\\",
                    \\"updateUsers\\": {
                        \\"args\\": {
                            \\"update\\": {
                                \\"content\\": [
                                    {
                                        \\"disconnect\\": [
                                            {
                                                \\"where\\": {
                                                    \\"node\\": {
                                                        \\"id\\": \\"someId\\"
                                                    }
                                                }
                                            }
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
    });
    test("Unions in cypher directives", async () => {
        const typeDefs = `
            type Actor {
                name: String
                age: Int
                movies(title: String): [Movie]
                    @cypher(
                        statement: """
                        MATCH (m:Movie {title: $title})
                        RETURN m
                        """,
                        columnName: "m"
                    )

                tvShows(title: String): [Movie]
                    @cypher(
                        statement: """
                        MATCH (t:TVShow {title: $title})
                        RETURN t
                        """,
                        columnName: "t"
                    )

                movieOrTVShow(title: String): [MovieOrTVShow]
                    @cypher(
                        statement: """
                        MATCH (n)
                        WHERE (n:TVShow OR n:Movie) AND ($title IS NULL OR n.title = $title)
                        RETURN n
                        """,
                        columnName: "n"
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
                        """,
                        columnName: "a"
                    )
                topActor: Actor
                    @cypher(
                        statement: """
                        MATCH (a:Actor)
                        RETURN a
                        """,
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
                        """,
                        columnName: "a"
                    )
                topActor: Actor
                    @cypher(
                        statement: """
                        MATCH (a:Actor)
                        RETURN a
                        """,
                        columnName: "a"
                    )
            }
        `;

        const query = gql`
            {
                actors {
                    movieOrTVShow(title: "someTitle") {
                        ... on Movie {
                            title
                            topActor {
                                name
                                age
                            }
                        }
                        ... on TVShow {
                            title
                            numSeasons
                            topActor {
                                name
                            }
                        }
                    }
                }
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
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
                WITH *
                WHERE (this0:Movie OR this0:TVShow)
                WITH *, this0 AS this1
                CALL {
                    WITH this1
                    CALL {
                        WITH this1
                        WITH this1 AS this
                        MATCH (a:Actor)
                        RETURN a
                    }
                    WITH a AS this2
                    RETURN head(collect(this2 { .name, .age })) AS this2
                }
                WITH *, this0 AS this3
                CALL {
                    WITH this3
                    CALL {
                        WITH this3
                        WITH this3 AS this
                        MATCH (a:Actor)
                        RETURN a
                    }
                    WITH a AS this4
                    RETURN head(collect(this4 { .name })) AS this4
                }
                RETURN collect(CASE
                    WHEN this0:Movie THEN this0 { .title, topActor: this2, __resolveType: \\"Movie\\" }
                    WHEN this0:TVShow THEN this0 { .title, .numSeasons, topActor: this4, __resolveType: \\"TVShow\\" }
                END) AS this0
            }
            RETURN this { movieOrTVShow: this0 } AS this"
        `);
        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"someTitle\\"
            }"
        `);
    });
    describe("connectOrCreate auth ordering", () => {
        const movieTitle = "Cool Movie";
        const requiredRole = "admin";
        const createOperation = "createMovies";
        const updateOperation = "updateMovies";

        /**
         * Generate type definitions for connectOrCreate auth tests.
         * @param operations The operations argument of auth rules.
         * @returns Unique types and a graphql type definition string.
         */
        function getTypedef(operations: string): string {
            const typeDefs = `
                type JWTPayload @jwt {
                    roles: [String!]!
                }
                
                type Movie {
                    title: String
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
                }
        
                type Genre @authorization(validate: [{ operations: ${operations}, where: { jwt: { roles_INCLUDES: "${requiredRole}" } } }]) {
                    name: String @unique
                }
            `;

            return typeDefs;
        }

        /**
         * Generate a query for connectOrCreate auth tests.
         * @param mutationType The type of mutation to perform.
         * @returns A graphql query.
         */
        function getQuery(mutationType: string): string {
            let argType = "update";

            if (mutationType.startsWith("create")) {
                argType = "input";
            }

            return `
                mutation {
                    ${mutationType}(
                        ${argType}: {
                            title: "${movieTitle}"
                            genres: {
                                connectOrCreate: [
                                    { where: { node: { name: "Horror" } }, onCreate: { node: { name: "Horror" } } }
                                ]
                            }
                        }
                    ) {
                        movies {
                            title
                        }
                    }
                }
            `;
        }
        test("Create with createOrConnect and CREATE_RELATIONSHIP operation rule - valid auth", async () => {
            const typeDefs = getTypedef("[CREATE_RELATIONSHIP]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });

            const query = gql(getQuery(createOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                WITH this0
                CALL {
                    WITH this0
                    MERGE (this0_genres_connectOrCreate0:Genre { name: $this0_genres_connectOrCreate_param0 })
                    ON CREATE SET
                        this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate_param1
                    MERGE (this0)-[this0_genres_connectOrCreate_this0:IN_GENRE]->(this0_genres_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this0_genres_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN this0
                }
                CALL {
                    WITH this0
                    RETURN this0 { .title } AS create_var0
                }
                RETURN [create_var0] AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this0_genres_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Create with createOrConnect and CREATE_RELATIONSHIP operation rule - invalid auth", async () => {
            const typeDefs = getTypedef("[CREATE_RELATIONSHIP]");
            const createOperation = "createMovies";

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });

            const query = gql(getQuery(createOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                WITH this0
                CALL {
                    WITH this0
                    MERGE (this0_genres_connectOrCreate0:Genre { name: $this0_genres_connectOrCreate_param0 })
                    ON CREATE SET
                        this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate_param1
                    MERGE (this0)-[this0_genres_connectOrCreate_this0:IN_GENRE]->(this0_genres_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this0_genres_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN this0
                }
                CALL {
                    WITH this0
                    RETURN this0 { .title } AS create_var0
                }
                RETURN [create_var0] AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this0_genres_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Create with createOrConnect and CREATE operation rule - valid auth", async () => {
            const typeDefs = getTypedef("[CREATE]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(createOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                WITH this0
                CALL {
                    WITH this0
                    MERGE (this0_genres_connectOrCreate0:Genre { name: $this0_genres_connectOrCreate_param0 })
                    ON CREATE SET
                        this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate_param1
                    MERGE (this0)-[this0_genres_connectOrCreate_this0:IN_GENRE]->(this0_genres_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this0_genres_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN this0
                }
                CALL {
                    WITH this0
                    RETURN this0 { .title } AS create_var0
                }
                RETURN [create_var0] AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this0_genres_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Create with createOrConnect and CREATE operation rule - invalid auth", async () => {
            const typeDefs = getTypedef("[CREATE]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(createOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                WITH this0
                CALL {
                    WITH this0
                    MERGE (this0_genres_connectOrCreate0:Genre { name: $this0_genres_connectOrCreate_param0 })
                    ON CREATE SET
                        this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate_param1
                    MERGE (this0)-[this0_genres_connectOrCreate_this0:IN_GENRE]->(this0_genres_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this0_genres_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN this0
                }
                CALL {
                    WITH this0
                    RETURN this0 { .title } AS create_var0
                }
                RETURN [create_var0] AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this0_genres_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Create with createOrConnect and CREATE, CREATE_RELATIONSHIP operation rule - valid auth", async () => {
            const typeDefs = getTypedef("[CREATE, CREATE_RELATIONSHIP]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(createOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                WITH this0
                CALL {
                    WITH this0
                    MERGE (this0_genres_connectOrCreate0:Genre { name: $this0_genres_connectOrCreate_param0 })
                    ON CREATE SET
                        this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate_param1
                    MERGE (this0)-[this0_genres_connectOrCreate_this0:IN_GENRE]->(this0_genres_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this0_genres_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN this0
                }
                CALL {
                    WITH this0
                    RETURN this0 { .title } AS create_var0
                }
                RETURN [create_var0] AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this0_genres_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Create with createOrConnect and CREATE, CREATE_RELATIONSHIP operation rule - invalid auth", async () => {
            const typeDefs = getTypedef("[CREATE, CREATE_RELATIONSHIP]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(createOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                WITH this0
                CALL {
                    WITH this0
                    MERGE (this0_genres_connectOrCreate0:Genre { name: $this0_genres_connectOrCreate_param0 })
                    ON CREATE SET
                        this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate_param1
                    MERGE (this0)-[this0_genres_connectOrCreate_this0:IN_GENRE]->(this0_genres_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this0_genres_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN this0
                }
                CALL {
                    WITH this0
                    RETURN this0 { .title } AS create_var0
                }
                RETURN [create_var0] AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this0_genres_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Create with createOrConnect and DELETE operation rule - valid auth", async () => {
            const typeDefs = getTypedef("[DELETE]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(createOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                WITH this0
                CALL {
                    WITH this0
                    MERGE (this0_genres_connectOrCreate0:Genre { name: $this0_genres_connectOrCreate_param0 })
                    ON CREATE SET
                        this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate_param1
                    MERGE (this0)-[this0_genres_connectOrCreate_this0:IN_GENRE]->(this0_genres_connectOrCreate0)
                    RETURN count(*) AS _
                }
                RETURN this0
                }
                CALL {
                    WITH this0
                    RETURN this0 { .title } AS create_var0
                }
                RETURN [create_var0] AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("Update with createOrConnect and CREATE_RELATIONSHIP operation rule - valid auth", async () => {
            const typeDefs = getTypedef("[CREATE_RELATIONSHIP]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(updateOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_genres0_connectOrCreate0:Genre { name: $this_genres0_connectOrCreate_param0 })
                    ON CREATE SET
                        this_genres0_connectOrCreate0.name = $this_genres0_connectOrCreate_param1
                    MERGE (this)-[this_genres0_connectOrCreate_this0:IN_GENRE]->(this_genres0_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this_genres0_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this_genres0_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Update with createOrConnect and CREATE_RELATIONSHIP operation rule - invalid auth", async () => {
            const typeDefs = getTypedef("[CREATE_RELATIONSHIP]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(updateOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_genres0_connectOrCreate0:Genre { name: $this_genres0_connectOrCreate_param0 })
                    ON CREATE SET
                        this_genres0_connectOrCreate0.name = $this_genres0_connectOrCreate_param1
                    MERGE (this)-[this_genres0_connectOrCreate_this0:IN_GENRE]->(this_genres0_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this_genres0_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this_genres0_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Update with createOrConnect and CREATE operation rule - valid auth", async () => {
            const typeDefs = getTypedef("[CREATE]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(updateOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_genres0_connectOrCreate0:Genre { name: $this_genres0_connectOrCreate_param0 })
                    ON CREATE SET
                        this_genres0_connectOrCreate0.name = $this_genres0_connectOrCreate_param1
                    MERGE (this)-[this_genres0_connectOrCreate_this0:IN_GENRE]->(this_genres0_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this_genres0_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this_genres0_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Update with createOrConnect and CREATE operation rule - invalid auth", async () => {
            const typeDefs = getTypedef("[CREATE]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(updateOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_genres0_connectOrCreate0:Genre { name: $this_genres0_connectOrCreate_param0 })
                    ON CREATE SET
                        this_genres0_connectOrCreate0.name = $this_genres0_connectOrCreate_param1
                    MERGE (this)-[this_genres0_connectOrCreate_this0:IN_GENRE]->(this_genres0_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this_genres0_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this_genres0_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Update with createOrConnect and CREATE, CREATE_RELATIONSHIP operation rule - valid auth", async () => {
            const typeDefs = getTypedef("[CREATE, CREATE_RELATIONSHIP]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(updateOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_genres0_connectOrCreate0:Genre { name: $this_genres0_connectOrCreate_param0 })
                    ON CREATE SET
                        this_genres0_connectOrCreate0.name = $this_genres0_connectOrCreate_param1
                    MERGE (this)-[this_genres0_connectOrCreate_this0:IN_GENRE]->(this_genres0_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this_genres0_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this_genres0_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Update with createOrConnect and CREATE, CREATE_RELATIONSHIP operation rule - invalid auth", async () => {
            const typeDefs = getTypedef("[CREATE, CREATE_RELATIONSHIP]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(updateOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_genres0_connectOrCreate0:Genre { name: $this_genres0_connectOrCreate_param0 })
                    ON CREATE SET
                        this_genres0_connectOrCreate0.name = $this_genres0_connectOrCreate_param1
                    MERGE (this)-[this_genres0_connectOrCreate_this0:IN_GENRE]->(this_genres0_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $this_genres0_connectOrCreate_param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": false,
                    \\"jwt\\": {},
                    \\"this_genres0_connectOrCreate_param4\\": \\"admin\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Update with createOrConnect and DELETE operation rule - valid auth", async () => {
            const typeDefs = getTypedef("[DELETE]");

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: "secret" } },
            });
            const query = gql(getQuery(updateOperation));
            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_genres0_connectOrCreate0:Genre { name: $this_genres0_connectOrCreate_param0 })
                    ON CREATE SET
                        this_genres0_connectOrCreate0.name = $this_genres0_connectOrCreate_param1
                    MERGE (this)-[this_genres0_connectOrCreate_this0:IN_GENRE]->(this_genres0_connectOrCreate0)
                    RETURN count(*) AS _
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
    });
    describe("Select connections following the creation of a multiple nodes", () => {
        const typeDefs = `
            type Movie {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }
            
            type Actor {
                name: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            interface ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;
        test("Filtered results", async () => {
            const filmName1 = "Forrest Gump";
            const filmName2 = "Toy Story";
            const actorName = "Tom Hanks";

            const query = gql`
                mutation {
                    createMovies(input: [{ title: "${filmName1}" }, { title: "${filmName2}" }]) {
                        movies {
                            title
                            actorsConnection(where: { node: { name: "${actorName}" } }) {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "UNWIND $create_param0 AS create_var0
                CALL {
                    WITH create_var0
                    CREATE (create_this1:Movie)
                    SET
                        create_this1.title = create_var0.title
                    RETURN create_this1
                }
                CALL {
                    WITH create_this1
                    MATCH (create_this1)<-[create_this2:ACTED_IN]-(create_this3:Actor)
                    WHERE create_this3.name = $create_param1
                    WITH { screenTime: create_this2.screenTime, node: { name: create_this3.name } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS create_var4
                }
                RETURN collect(create_this1 { .title, actorsConnection: create_var4 }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"create_param0\\": [
                        {
                            \\"title\\": \\"Forrest Gump\\"
                        },
                        {
                            \\"title\\": \\"Toy Story\\"
                        }
                    ],
                    \\"create_param1\\": \\"Tom Hanks\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
        test("Unfiltered results", async () => {
            const filmName1 = "Forrest Gump";
            const filmName2 = "Toy Story";

            const query = gql`
                mutation {
                    createMovies(input: [{ title: "${filmName1}" }, { title: "${filmName2}" }]) {
                        movies{
                            title
                            actorsConnection {
                                edges {
                                    screenTime
                                    node {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            const result = await translateQuery(neoSchema, query);
            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "UNWIND $create_param0 AS create_var0
                CALL {
                    WITH create_var0
                    CREATE (create_this1:Movie)
                    SET
                        create_this1.title = create_var0.title
                    RETURN create_this1
                }
                CALL {
                    WITH create_this1
                    MATCH (create_this1)<-[create_this2:ACTED_IN]-(create_this3:Actor)
                    WITH { screenTime: create_this2.screenTime, node: { name: create_this3.name } } AS edge
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS create_var4
                }
                RETURN collect(create_this1 { .title, actorsConnection: create_var4 }) AS data"
            `);
            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"create_param0\\": [
                        {
                            \\"title\\": \\"Forrest Gump\\"
                        },
                        {
                            \\"title\\": \\"Toy Story\\"
                        }
                    ],
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
    });
});
