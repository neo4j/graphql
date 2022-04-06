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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";
import { createJwtRequest } from "../../../../utils/create-jwt-request";

describe("connectOrCreate", () => {
    const secret = "secret";
    let neoSchema: Neo4jGraphQL;

    function createTypedef(operations: string): DocumentNode {
        return gql`
        type Movie {
            title: String
            genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
        }

        type Genre @auth(rules: [{ operations: ${operations}, roles: ["admin"] }]) {
            name: String @unique
        }
        `;
    }

    describe("Create -> nested connectOrCreate", () => {
        const query = gql`
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Cool Movie"
                            genres: {
                                connectOrCreate: [
                                    { where: { node: { name: "Horror" } }, onCreate: { node: { name: "Horror" } } }
                                ]
                            }
                        }
                    ]
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        test("Create with createOrConnect and CONNECT operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CONNECT]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                	WITH this0
                CALL {
                	WITH this0
                	CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                MERGE (this0_genres_connectOrCreate_this1:\`Genre\` { name: $this0_genres_connectOrCreate_param0 })
                ON CREATE SET
                        this0_genres_connectOrCreate_this1.name = $this0_genres_connectOrCreate_param1
                MERGE (this0)-[this0_genres_connectOrCreate_this0:\`IN_GENRE\`]->(this0_genres_connectOrCreate_this1)
                	RETURN COUNT(*)
                }
                RETURN this0
                }
                RETURN [
                this0 { .title }] AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {},
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

        test("Create with createOrConnect and CREATE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                	WITH this0
                CALL {
                	WITH this0
                	CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                MERGE (this0_genres_connectOrCreate_this1:\`Genre\` { name: $this0_genres_connectOrCreate_param0 })
                ON CREATE SET
                        this0_genres_connectOrCreate_this1.name = $this0_genres_connectOrCreate_param1
                MERGE (this0)-[this0_genres_connectOrCreate_this0:\`IN_GENRE\`]->(this0_genres_connectOrCreate_this1)
                	RETURN COUNT(*)
                }
                RETURN this0
                }
                RETURN [
                this0 { .title }] AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {},
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

        test("Create with createOrConnect and CREATE, CONNECT operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE, CONNECT]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                	WITH this0
                CALL {
                	WITH this0
                	CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                MERGE (this0_genres_connectOrCreate_this1:\`Genre\` { name: $this0_genres_connectOrCreate_param0 })
                ON CREATE SET
                        this0_genres_connectOrCreate_this1.name = $this0_genres_connectOrCreate_param1
                MERGE (this0)-[this0_genres_connectOrCreate_this0:\`IN_GENRE\`]->(this0_genres_connectOrCreate_this1)
                	RETURN COUNT(*)
                }
                RETURN this0
                }
                RETURN [
                this0 { .title }] AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {},
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

        test("Create with createOrConnect and DELETE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[DELETE]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                	WITH this0
                CALL {
                	WITH this0
                	MERGE (this0_genres_connectOrCreate_this1:\`Genre\` { name: $this0_genres_connectOrCreate_param0 })
                ON CREATE SET
                        this0_genres_connectOrCreate_this1.name = $this0_genres_connectOrCreate_param1
                MERGE (this0)-[this0_genres_connectOrCreate_this0:\`IN_GENRE\`]->(this0_genres_connectOrCreate_this1)
                	RETURN COUNT(*)
                }
                RETURN this0
                }
                RETURN [
                this0 { .title }] AS data"
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
    });

    describe("Update -> nested connectOrCreate", () => {
        const query = gql`
            mutation {
                updateMovies(
                    update: {
                        title: "Cool Movie"
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

        test("Update with createOrConnect and CONNECT operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CONNECT]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                	WITH this
                CALL {
                	WITH this
                	CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                MERGE (this_genres0_connectOrCreate_this1:\`Genre\` { name: $this_genres0_connectOrCreate_param0 })
                ON CREATE SET
                        this_genres0_connectOrCreate_this1.name = $this_genres0_connectOrCreate_param1
                MERGE (this)-[this_genres0_connectOrCreate_this0:\`IN_GENRE\`]->(this_genres0_connectOrCreate_this1)
                	RETURN COUNT(*)
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {},
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

        test("Update with createOrConnect and CREATE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                	WITH this
                CALL {
                	WITH this
                	CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                MERGE (this_genres0_connectOrCreate_this1:\`Genre\` { name: $this_genres0_connectOrCreate_param0 })
                ON CREATE SET
                        this_genres0_connectOrCreate_this1.name = $this_genres0_connectOrCreate_param1
                MERGE (this)-[this_genres0_connectOrCreate_this0:\`IN_GENRE\`]->(this_genres0_connectOrCreate_this1)
                	RETURN COUNT(*)
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {},
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

        test("Update with createOrConnect and CREATE, CONNECT operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE, CONNECT]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                	WITH this
                CALL {
                	WITH this
                	CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                MERGE (this_genres0_connectOrCreate_this1:\`Genre\` { name: $this_genres0_connectOrCreate_param0 })
                ON CREATE SET
                        this_genres0_connectOrCreate_this1.name = $this_genres0_connectOrCreate_param1
                MERGE (this)-[this_genres0_connectOrCreate_this0:\`IN_GENRE\`]->(this_genres0_connectOrCreate_this1)
                	RETURN COUNT(*)
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {},
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

        test("Create with createOrConnect and DELETE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[DELETE]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                	WITH this
                CALL {
                	WITH this
                	MERGE (this_genres0_connectOrCreate_this1:\`Genre\` { name: $this_genres0_connectOrCreate_param0 })
                ON CREATE SET
                        this_genres0_connectOrCreate_this1.name = $this_genres0_connectOrCreate_param1
                MERGE (this)-[this_genres0_connectOrCreate_this0:\`IN_GENRE\`]->(this_genres0_connectOrCreate_this1)
                	RETURN COUNT(*)
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

    describe("Update -> connectOrCreate", () => {
        const query = gql`
            mutation {
                updateMovies(
                    update: { title: "Cool Movie" }
                    connectOrCreate: {
                        genres: { where: { node: { name: "Horror" } }, onCreate: { node: { name: "Horror" } } }
                    }
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        test("Update with createOrConnect and CONNECT operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CONNECT]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                	WITH this
                CALL {
                	WITH this
                	CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                MERGE (this_connectOrCreate_genres_this1:\`Genre\` { name: $this_connectOrCreate_genres_param0 })
                ON CREATE SET
                        this_connectOrCreate_genres_this1.name = $this_connectOrCreate_genres_param1
                MERGE (this)-[this_connectOrCreate_genres_this0:\`IN_GENRE\`]->(this_connectOrCreate_genres_this1)
                	RETURN COUNT(*)
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_connectOrCreate_genres_param0\\": \\"Horror\\",
                    \\"this_connectOrCreate_genres_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {},
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

        test("Update with createOrConnect and CREATE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                	WITH this
                CALL {
                	WITH this
                	CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                MERGE (this_connectOrCreate_genres_this1:\`Genre\` { name: $this_connectOrCreate_genres_param0 })
                ON CREATE SET
                        this_connectOrCreate_genres_this1.name = $this_connectOrCreate_genres_param1
                MERGE (this)-[this_connectOrCreate_genres_this0:\`IN_GENRE\`]->(this_connectOrCreate_genres_this1)
                	RETURN COUNT(*)
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_connectOrCreate_genres_param0\\": \\"Horror\\",
                    \\"this_connectOrCreate_genres_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {},
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

        test("Update with createOrConnect and CREATE, CONNECT operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE, CONNECT]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                	WITH this
                CALL {
                	WITH this
                	CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                MERGE (this_connectOrCreate_genres_this1:\`Genre\` { name: $this_connectOrCreate_genres_param0 })
                ON CREATE SET
                        this_connectOrCreate_genres_this1.name = $this_connectOrCreate_genres_param1
                MERGE (this)-[this_connectOrCreate_genres_this0:\`IN_GENRE\`]->(this_connectOrCreate_genres_this1)
                	RETURN COUNT(*)
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_connectOrCreate_genres_param0\\": \\"Horror\\",
                    \\"this_connectOrCreate_genres_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {},
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

        test("Create with createOrConnect and DELETE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[DELETE]"),
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {});
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                	WITH this
                CALL {
                	WITH this
                	MERGE (this_connectOrCreate_genres_this1:\`Genre\` { name: $this_connectOrCreate_genres_param0 })
                ON CREATE SET
                        this_connectOrCreate_genres_this1.name = $this_connectOrCreate_genres_param1
                MERGE (this)-[this_connectOrCreate_genres_this0:\`IN_GENRE\`]->(this_connectOrCreate_genres_this1)
                	RETURN COUNT(*)
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_connectOrCreate_genres_param0\\": \\"Horror\\",
                    \\"this_connectOrCreate_genres_param1\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("Create with createOrConnect and allow in auth", async () => {
            const typeDefs = gql`
                type Movie {
                    title: String
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
                }

                type Genre {
                    name: String @unique
                }

                extend type Genre @auth(rules: [{ operations: [CREATE], allow: { name: "$jwt.sub" } }])
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                config: { enableRegex: true },
                plugins: {
                    auth: new Neo4jGraphQLAuthJWTPlugin({
                        secret,
                    }),
                },
            });

            const req = createJwtRequest("secret", {
                sub: "test",
            });
            const result = await translateQuery(neoSchema, query, {
                req,
            });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:Movie)
                SET this.title = $this_update_title
                	WITH this
                CALL {
                	WITH this
                	CALL apoc.util.validate(NOT(this_connectOrCreate_genres0.name IS NOT NULL AND this_connectOrCreate_genres0.name = $this_connectOrCreate_genres0Genre_allow_auth_allow0_name), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                MERGE (this_connectOrCreate_genres_this1:\`Genre\` { name: $this_connectOrCreate_genres_param1 })
                ON CREATE SET
                        this_connectOrCreate_genres_this1.name = $this_connectOrCreate_genres_param2
                MERGE (this)-[this_connectOrCreate_genres_this0:\`IN_GENRE\`]->(this_connectOrCreate_genres_this1)
                	RETURN COUNT(*)
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_connectOrCreate_genres0Genre_allow_auth_allow0_name\\": \\"test\\",
                    \\"this_connectOrCreate_genres_param1\\": \\"Horror\\",
                    \\"this_connectOrCreate_genres_param2\\": \\"Horror\\",
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });
    });
});
