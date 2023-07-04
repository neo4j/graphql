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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";
import { createBearerToken } from "../../../utils/create-bearer-token";

describe("connectOrCreate", () => {
    const secret = "secret";
    let neoSchema: Neo4jGraphQL;

    function createTypedef(operations: string): DocumentNode {
        return gql`
        type JWT @jwt {
            roles: [String!]!
        }

        type Movie {
            title: String
            genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
        }

        type Genre @authorization(validate: [{ operations: ${operations}, where: { jwt: { roles_INCLUDES: "admin" } } }]) {
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
                typeDefs: createTypedef("[CREATE_RELATIONSHIP]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                WITH this0
                CALL {
                    WITH this0
                    MERGE (this0_genres_connectOrCreate0:\`Genre\` { name: $this0_genres_connectOrCreate_param0 })
                    ON CREATE SET
                        this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate_param1
                    MERGE (this0)-[this0_genres_connectOrCreate_this0:\`IN_GENRE\`]->(this0_genres_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $this0_genres_connectOrCreate_param3 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN this0
                }
                RETURN [ this0 { .title } ] AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": true,
                    \\"this0_genres_connectOrCreate_param3\\": \\"admin\\",
                    \\"jwt\\": {
                        \\"roles\\": []
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("Create with createOrConnect and CREATE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                WITH this0
                CALL {
                    WITH this0
                    MERGE (this0_genres_connectOrCreate0:\`Genre\` { name: $this0_genres_connectOrCreate_param0 })
                    ON CREATE SET
                        this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate_param1
                    MERGE (this0)-[this0_genres_connectOrCreate_this0:\`IN_GENRE\`]->(this0_genres_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $this0_genres_connectOrCreate_param3 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN this0
                }
                RETURN [ this0 { .title } ] AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": true,
                    \\"this0_genres_connectOrCreate_param3\\": \\"admin\\",
                    \\"jwt\\": {
                        \\"roles\\": []
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("Create with createOrConnect and CREATE, CONNECT operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE, CREATE_RELATIONSHIP]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                WITH this0
                CALL {
                    WITH this0
                    MERGE (this0_genres_connectOrCreate0:\`Genre\` { name: $this0_genres_connectOrCreate_param0 })
                    ON CREATE SET
                        this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate_param1
                    MERGE (this0)-[this0_genres_connectOrCreate_this0:\`IN_GENRE\`]->(this0_genres_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $this0_genres_connectOrCreate_param3 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN this0
                }
                RETURN [ this0 { .title } ] AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this0_title\\": \\"Cool Movie\\",
                    \\"this0_genres_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this0_genres_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": true,
                    \\"this0_genres_connectOrCreate_param3\\": \\"admin\\",
                    \\"jwt\\": {
                        \\"roles\\": []
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("Create with createOrConnect and DELETE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[DELETE]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "CALL {
                CREATE (this0:Movie)
                SET this0.title = $this0_title
                WITH this0
                CALL {
                    WITH this0
                    MERGE (this0_genres_connectOrCreate0:\`Genre\` { name: $this0_genres_connectOrCreate_param0 })
                    ON CREATE SET
                        this0_genres_connectOrCreate0.name = $this0_genres_connectOrCreate_param1
                    MERGE (this0)-[this0_genres_connectOrCreate_this0:\`IN_GENRE\`]->(this0_genres_connectOrCreate0)
                    RETURN count(*) AS _
                }
                RETURN this0
                }
                RETURN [ this0 { .title } ] AS data"
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
                typeDefs: createTypedef("[CREATE_RELATIONSHIP]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_genres0_connectOrCreate0:\`Genre\` { name: $this_genres0_connectOrCreate_param0 })
                    ON CREATE SET
                        this_genres0_connectOrCreate0.name = $this_genres0_connectOrCreate_param1
                    MERGE (this)-[this_genres0_connectOrCreate_this0:\`IN_GENRE\`]->(this_genres0_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $this_genres0_connectOrCreate_param3 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": true,
                    \\"this_genres0_connectOrCreate_param3\\": \\"admin\\",
                    \\"jwt\\": {
                        \\"roles\\": []
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("Update with createOrConnect and CREATE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_genres0_connectOrCreate0:\`Genre\` { name: $this_genres0_connectOrCreate_param0 })
                    ON CREATE SET
                        this_genres0_connectOrCreate0.name = $this_genres0_connectOrCreate_param1
                    MERGE (this)-[this_genres0_connectOrCreate_this0:\`IN_GENRE\`]->(this_genres0_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $this_genres0_connectOrCreate_param3 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": true,
                    \\"this_genres0_connectOrCreate_param3\\": \\"admin\\",
                    \\"jwt\\": {
                        \\"roles\\": []
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("Update with createOrConnect and CREATE, CONNECT operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE, CREATE_RELATIONSHIP]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_genres0_connectOrCreate0:\`Genre\` { name: $this_genres0_connectOrCreate_param0 })
                    ON CREATE SET
                        this_genres0_connectOrCreate0.name = $this_genres0_connectOrCreate_param1
                    MERGE (this)-[this_genres0_connectOrCreate_this0:\`IN_GENRE\`]->(this_genres0_connectOrCreate0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $this_genres0_connectOrCreate_param3 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_genres0_connectOrCreate_param0\\": \\"Horror\\",
                    \\"this_genres0_connectOrCreate_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": true,
                    \\"this_genres0_connectOrCreate_param3\\": \\"admin\\",
                    \\"jwt\\": {
                        \\"roles\\": []
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("Create with createOrConnect and DELETE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[DELETE]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_genres0_connectOrCreate0:\`Genre\` { name: $this_genres0_connectOrCreate_param0 })
                    ON CREATE SET
                        this_genres0_connectOrCreate0.name = $this_genres0_connectOrCreate_param1
                    MERGE (this)-[this_genres0_connectOrCreate_this0:\`IN_GENRE\`]->(this_genres0_connectOrCreate0)
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
                typeDefs: createTypedef("[CREATE_RELATIONSHIP]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_connectOrCreate_genres0:\`Genre\` { name: $this_connectOrCreate_genres_param0 })
                    ON CREATE SET
                        this_connectOrCreate_genres0.name = $this_connectOrCreate_genres_param1
                    MERGE (this)-[this_connectOrCreate_genres_this0:\`IN_GENRE\`]->(this_connectOrCreate_genres0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $this_connectOrCreate_genres_param3 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                WITH *
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_connectOrCreate_genres_param0\\": \\"Horror\\",
                    \\"this_connectOrCreate_genres_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": true,
                    \\"this_connectOrCreate_genres_param3\\": \\"admin\\",
                    \\"jwt\\": {
                        \\"roles\\": []
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("Update with createOrConnect and CREATE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_connectOrCreate_genres0:\`Genre\` { name: $this_connectOrCreate_genres_param0 })
                    ON CREATE SET
                        this_connectOrCreate_genres0.name = $this_connectOrCreate_genres_param1
                    MERGE (this)-[this_connectOrCreate_genres_this0:\`IN_GENRE\`]->(this_connectOrCreate_genres0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $this_connectOrCreate_genres_param3 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                WITH *
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_connectOrCreate_genres_param0\\": \\"Horror\\",
                    \\"this_connectOrCreate_genres_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": true,
                    \\"this_connectOrCreate_genres_param3\\": \\"admin\\",
                    \\"jwt\\": {
                        \\"roles\\": []
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("Update with createOrConnect and CREATE, CONNECT operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[CREATE, CREATE_RELATIONSHIP]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_connectOrCreate_genres0:\`Genre\` { name: $this_connectOrCreate_genres_param0 })
                    ON CREATE SET
                        this_connectOrCreate_genres0.name = $this_connectOrCreate_genres_param1
                    MERGE (this)-[this_connectOrCreate_genres_this0:\`IN_GENRE\`]->(this_connectOrCreate_genres0)
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND $this_connectOrCreate_genres_param3 IN $jwt.roles), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN count(*) AS _
                }
                WITH *
                RETURN collect(DISTINCT this { .title }) AS data"
            `);

            expect(formatParams(result.params)).toMatchInlineSnapshot(`
                "{
                    \\"this_update_title\\": \\"Cool Movie\\",
                    \\"this_connectOrCreate_genres_param0\\": \\"Horror\\",
                    \\"this_connectOrCreate_genres_param1\\": \\"Horror\\",
                    \\"isAuthenticated\\": true,
                    \\"this_connectOrCreate_genres_param3\\": \\"admin\\",
                    \\"jwt\\": {
                        \\"roles\\": []
                    },
                    \\"resolvedCallbacks\\": {}
                }"
            `);
        });

        test("Create with createOrConnect and DELETE operation rule", async () => {
            neoSchema = new Neo4jGraphQL({
                typeDefs: createTypedef("[DELETE]"),
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {});
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_connectOrCreate_genres0:\`Genre\` { name: $this_connectOrCreate_genres_param0 })
                    ON CREATE SET
                        this_connectOrCreate_genres0.name = $this_connectOrCreate_genres_param1
                    MERGE (this)-[this_connectOrCreate_genres_this0:\`IN_GENRE\`]->(this_connectOrCreate_genres0)
                    RETURN count(*) AS _
                }
                WITH *
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
            const typeDefs = `
                type Movie {
                    title: String
                    genres: [Genre!]! @relationship(type: "IN_GENRE", direction: OUT)
                }

                type Genre {
                    name: String @unique
                }

                extend type Genre @authorization(validate: [{ when: [BEFORE], operations: [CREATE], where: { node: { name: "$jwt.sub" } } }])
            `;

            neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: { authorization: { key: secret } },
            });

            const token = createBearerToken("secret", {
                sub: "test",
            });
            const result = await translateQuery(neoSchema, query, { token });

            expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
                "MATCH (this:\`Movie\`)
                SET this.title = $this_update_title
                WITH this
                CALL {
                    WITH this
                    MERGE (this_connectOrCreate_genres0:\`Genre\` { name: $this_connectOrCreate_genres_param0 })
                    ON CREATE SET
                        this_connectOrCreate_genres0.name = $this_connectOrCreate_genres_param1
                    MERGE (this)-[this_connectOrCreate_genres_this0:\`IN_GENRE\`]->(this_connectOrCreate_genres0)
                    RETURN count(*) AS _
                }
                WITH *
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
    });
});
