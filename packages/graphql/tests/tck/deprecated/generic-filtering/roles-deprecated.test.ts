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
import { createBearerToken } from "../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher Auth Roles - deprecated", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type History @node {
                url: String
                    @authorization(
                        validate: [{ operations: [READ], where: { jwt: { roles_INCLUDES: "super-admin" } } }]
                    )
            }

            type Comment @node {
                id: String
                content: String
                post: [Post!]! @relationship(type: "HAS_COMMENT", direction: IN)
            }

            type Post @node {
                id: String
                content: String
                creator: [User!]! @relationship(type: "HAS_POST", direction: OUT)
                comments: [Comment!]! @relationship(type: "HAS_COMMENT", direction: OUT)
            }

            type User @node {
                id: ID
                name: String
                password: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "admin" } } }])

            extend type Post
                @authorization(
                    validate: [
                        {
                            operations: [CREATE_RELATIONSHIP, DELETE_RELATIONSHIP, DELETE]
                            where: { jwt: { roles_INCLUDES: "super-admin" } }
                        }
                    ]
                )

            extend type User {
                password: String
                    @authorization(
                        validate: [
                            { operations: [READ, CREATE, UPDATE], where: { jwt: { roles_INCLUDES: "super-admin" } } }
                        ]
                    )
            }

            extend type User {
                history: [History]
                    @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h", columnName: "h")
                    @authorization(
                        validate: [{ operations: [READ], where: { jwt: { roles_INCLUDES: "super-admin" } } }]
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
    });

    test("Read Node", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    name
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id, .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"admin\\"
            }"
        `);
    });

    test("Read Node & Field", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    name
                    password
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id, .name, .password } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"super-admin\\"
            }"
        `);
    });

    test("Read Node & Cypher Field", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    history {
                        url
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                CALL (this) {
                    WITH this AS this
                    MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h
                }
                WITH h AS this0
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0 { .url } AS this0
                RETURN collect(this0) AS var1
            }
            RETURN this { history: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"super-admin\\",
                \\"param4\\": \\"super-admin\\"
            }"
        `);
    });

    test("Create Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(input: [{ id: "1" }]) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
                CREATE (create_this1:User)
                SET
                    create_this1.id = create_var0.id
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL apoc.util.validate((create_var0.password IS NOT NULL AND NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\"
                    }
                ],
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"create_param3\\": \\"admin\\",
                \\"create_param4\\": \\"super-admin\\"
            }"
        `);
    });

    test("Create Node & Field", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(input: [{ id: "1", password: "super-password" }]) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
                CREATE (create_this1:User)
                SET
                    create_this1.id = create_var0.id,
                    create_this1.password = create_var0.password
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL apoc.util.validate((create_var0.password IS NOT NULL AND NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"password\\": \\"super-password\\"
                    }
                ],
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"create_param3\\": \\"admin\\",
                \\"create_param4\\": \\"super-admin\\"
            }"
        `);
    });

    test("Update Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(where: { id_EQ: "1" }, update: { id_SET: "id-1" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            SET
                this.id = $param4
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"id-1\\",
                \\"param5\\": \\"admin\\",
                \\"param6\\": \\"admin\\"
            }"
        `);
    });

    test("Update Node & Field", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(where: { id_EQ: "1" }, update: { password_SET: "password" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            SET
                this.password = $param5
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"super-admin\\",
                \\"param5\\": \\"password\\",
                \\"param6\\": \\"admin\\",
                \\"param7\\": \\"super-admin\\",
                \\"param8\\": \\"admin\\"
            }"
        `);
    });

    test("Connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { posts: { connect: {} } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Post)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CREATE (this)-[this1:HAS_POST]->(this0)
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"super-admin\\",
                \\"param3\\": \\"super-admin\\",
                \\"param4\\": \\"admin\\",
                \\"param5\\": \\"admin\\"
            }"
        `);
    });

    test("Nested Connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateComments(
                    update: {
                        post: { update: { node: { creator: { connect: { where: { node: { id_EQ: "user-id" } } } } } } }
                    }
                ) {
                    comments {
                        content
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Comment)
            WITH *
            WITH *
            CALL (*) {
                MATCH (this)<-[this0:HAS_COMMENT]-(this1:Post)
                WITH *
                WITH *
                CALL (*) {
                    CALL (this1) {
                        MATCH (this2:User)
                        WHERE this2.id = $param0
                        CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        CREATE (this1)-[this3:HAS_POST]->(this2)
                        WITH *
                        CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH *
                        CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    }
                }
            }
            WITH this
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"admin\\",
                \\"param5\\": \\"super-admin\\"
            }"
        `);
    });

    test("Disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { posts: { disconnect: {} } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    DELETE this0
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"super-admin\\",
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"super-admin\\",
                \\"param5\\": \\"admin\\",
                \\"param6\\": \\"admin\\"
            }"
        `);
    });

    test("Nested Disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateComments(
                    update: {
                        post: {
                            update: { node: { creator: { disconnect: { where: { node: { id_EQ: "user-id" } } } } } }
                        }
                    }
                ) {
                    comments {
                        content
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Comment)
            WITH *
            WITH *
            CALL (*) {
                MATCH (this)<-[this0:HAS_COMMENT]-(this1:Post)
                WITH *
                WITH *
                CALL (*) {
                    CALL (this1) {
                        OPTIONAL MATCH (this1)-[this2:HAS_POST]->(this3:User)
                        WHERE this3.id = $param0
                        CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH *
                        CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH *
                        DELETE this2
                        WITH *
                        CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH *
                        CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    }
                }
            }
            WITH this
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"super-admin\\",
                \\"param5\\": \\"admin\\",
                \\"param6\\": \\"super-admin\\"
            }"
        `);
    });

    test("Delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteUsers {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"admin\\"
            }"
        `);
    });

    test("Nested Delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteUsers(delete: { posts: { where: {} } }) {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL (*) {
                OPTIONAL MATCH (this)-[this0:HAS_POST]->(this1:Post)
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0, collect(DISTINCT this1) AS var2
                CALL (var2) {
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"super-admin\\"
            }"
        `);
    });
});
