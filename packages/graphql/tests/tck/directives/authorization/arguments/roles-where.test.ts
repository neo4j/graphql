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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";
import { createBearerToken } from "../../../../utils/create-bearer-token";

describe("Cypher Auth Where with Roles", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            union Search = Post

            type User {
                id: ID
                name: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                content: [Search!]! @relationship(type: "HAS_POST", direction: OUT) # something to test unions
            }

            type Post {
                id: ID
                content: String
                creator: User @relationship(type: "HAS_POST", direction: IN)
            }

            extend type User
                @authorization(
                    validate: [
                        { where: { node: { id: "$jwt.sub" }, jwt: { roles_INCLUDES: "user" } } }
                        { where: { jwt: { roles_INCLUDES: "admin" } } }
                    ]
                )

            extend type User {
                password: String! @authorization(filter: [{ operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }

            extend type Post {
                secretKey: String!
                    @authorization(filter: [{ operations: [READ], where: { node: { creator: { id: "$jwt.sub" } } } }])
            }

            extend type Post
                @authorization(
                    validate: [
                        { where: { node: { creator: { id: "$jwt.sub" } }, jwt: { roles_INCLUDES: "user" } } }
                        { where: { jwt: { roles_INCLUDES: "admin" } } }
                    ]
                )
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
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\"
            }"
        `);
    });

    test("Read Node + User Defined Where", async () => {
        const query = /* GraphQL */ `
            {
                users(where: { name: "bob" }) {
                    id
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE (this.name = $param0 AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"bob\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param3\\": \\"user\\",
                \\"param4\\": \\"admin\\"
            }"
        `);
    });

    test("Read Relationship", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    posts {
                        content
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WITH *
                WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(this2 IN [(this1)<-[:HAS_POST]-(this2:User) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this1 { .content } AS this1
                RETURN collect(this1) AS var3
            }
            RETURN this { .id, posts: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"user\\",
                \\"param5\\": \\"admin\\"
            }"
        `);
    });

    test("Read Connection", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    postsConnection {
                        edges {
                            node {
                                content
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(this2 IN [(this1)<-[:HAS_POST]-(this2:User) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ node: { content: this1.content, __resolveType: \\"Post\\" } }) AS var3
                }
                RETURN { edges: var3, totalCount: totalCount } AS var4
            }
            RETURN this { .id, postsConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"user\\",
                \\"param5\\": \\"admin\\"
            }"
        `);
    });

    test("Read Connection + User Defined Where", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    postsConnection(where: { node: { id: "some-id" } }) {
                        edges {
                            node {
                                content
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WHERE (this1.id = $param4 AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(this2 IN [(this1)<-[:HAS_POST]-(this2:User) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                WITH collect({ node: this1, relationship: this0 }) AS edges
                WITH edges, size(edges) AS totalCount
                CALL {
                    WITH edges
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ node: { content: this1.content, __resolveType: \\"Post\\" } }) AS var3
                }
                RETURN { edges: var3, totalCount: totalCount } AS var4
            }
            RETURN this { .id, postsConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"some-id\\",
                \\"param5\\": \\"user\\",
                \\"param6\\": \\"admin\\"
            }"
        `);
    });

    test("Read Union Relationship + User Defined Where", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    posts(where: { content: "cool" }) {
                        content
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WITH *
                WHERE (this1.content = $param4 AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(this2 IN [(this1)<-[:HAS_POST]-(this2:User) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                WITH this1 { .content } AS this1
                RETURN collect(this1) AS var3
            }
            RETURN this { .id, posts: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"cool\\",
                \\"param5\\": \\"user\\",
                \\"param6\\": \\"admin\\"
            }"
        `);
    });

    test("Read Union", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    content {
                        ... on Post {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(this2 IN [(this1)<-[:HAS_POST]-(this2:User) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this1 { .id, __resolveType: \\"Post\\", __id: id(this1) } AS this1
                    RETURN this1 AS var3
                }
                WITH var3
                RETURN collect(var3) AS var3
            }
            RETURN this { .id, content: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"user\\",
                \\"param5\\": \\"admin\\"
            }"
        `);
    });

    test("Read Union Using Connection", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    contentConnection {
                        edges {
                            node {
                                ... on Post {
                                    id
                                }
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(this2 IN [(this1)<-[:HAS_POST]-(this2:User) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH { node: { __resolveType: \\"Post\\", __id: id(this1), id: this1.id } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            RETURN this { .id, contentConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"user\\",
                \\"param5\\": \\"admin\\"
            }"
        `);
    });

    test("Read Union Using Connection + User Defined Where", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    contentConnection(where: { Post: { node: { id: "some-id" } } }) {
                        edges {
                            node {
                                ... on Post {
                                    id
                                }
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    WHERE (this1.id = $param4 AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(this2 IN [(this1)<-[:HAS_POST]-(this2:User) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    WITH { node: { __resolveType: \\"Post\\", __id: id(this1), id: this1.id } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            RETURN this { .id, contentConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"some-id\\",
                \\"param5\\": \\"user\\",
                \\"param6\\": \\"admin\\"
            }"
        `);
    });

    test("Update Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { name: "Bob" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.name = $this_update_name
            WITH this
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"update_param2\\": \\"user\\",
                \\"update_param3\\": \\"admin\\",
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"this_update_name\\": \\"Bob\\",
                \\"authorization__after_param2\\": \\"user\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update Node + User Defined Where", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(where: { name: "bob" }, update: { name: "Bob" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE (this.name = $param0 AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            SET this.name = $this_update_name
            WITH this
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"update_param2\\": \\"user\\",
                \\"update_param3\\": \\"admin\\",
                \\"param0\\": \\"bob\\",
                \\"param3\\": \\"user\\",
                \\"param4\\": \\"admin\\",
                \\"this_update_name\\": \\"Bob\\",
                \\"authorization__after_param2\\": \\"user\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update Nested Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { posts: { update: { node: { id: "new-id" } } } }) {
                    users {
                        id
                        posts {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_has_post0_relationship:HAS_POST]->(this_posts0:Post)
            	WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__before_this0 IN [(this_posts0)<-[:HAS_POST]-(authorization__before_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__before_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	SET this_posts0.id = $this_update_posts0_id
            	WITH this, this_posts0
            	WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__after_this0 IN [(this_posts0)<-[:HAS_POST]-(authorization__after_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__after_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	WITH this, this_posts0
            	CALL {
            		WITH this_posts0
            		MATCH (this_posts0)<-[this_posts0_creator_User_unique:HAS_POST]-(:User)
            		WITH count(this_posts0_creator_User_unique) as c
            		WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator must be less than or equal to one', [0])
            		RETURN c AS this_posts0_creator_User_unique_ignored
            	}
            	RETURN count(*) AS update_this_posts0
            }
            WITH this
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[update_this0:HAS_POST]->(update_this1:Post)
                WITH *
                WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(update_this2 IN [(update_this1)<-[:HAS_POST]-(update_this2:User) WHERE ($jwt.sub IS NOT NULL AND update_this2.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $update_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH update_this1 { .id } AS update_this1
                RETURN collect(update_this1) AS update_var3
            }
            RETURN collect(DISTINCT this { .id, posts: update_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"update_param2\\": \\"user\\",
                \\"update_param3\\": \\"admin\\",
                \\"update_param4\\": \\"user\\",
                \\"update_param5\\": \\"admin\\",
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"authorization__before_param2\\": \\"user\\",
                \\"authorization__before_param3\\": \\"admin\\",
                \\"this_update_posts0_id\\": \\"new-id\\",
                \\"authorization__after_param2\\": \\"user\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Delete Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteUsers {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\"
            }"
        `);
    });

    test("Delete Nested Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteUsers(delete: { posts: { where: {} } }) {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(this2 IN [(this1)<-[:HAS_POST]-(this2:User) WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0, collect(DISTINCT this1) AS var3
                CALL {
                    WITH var3
                    UNWIND var3 AS var4
                    DETACH DELETE var4
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
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"user\\",
                \\"param5\\": \\"admin\\"
            }"
        `);
    });

    test("Connect Node (from create)", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(
                    input: [
                        { id: "123", name: "Bob", password: "password", posts: { connect: { where: { node: {} } } } }
                    ]
                ) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:User)
            SET this0.id = $this0_id
            SET this0.name = $this0_name
            SET this0.password = $this0_password
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_posts_connect0_node:Post)
            	WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization_0_before_this0 IN [(this0_posts_connect0_node)<-[:HAS_POST]-(authorization_0_before_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization_0_before_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization_0_before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization_0_before_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	CALL {
            		WITH *
            		WITH collect(this0_posts_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_posts_connect0_node
            			MERGE (this0)-[:HAS_POST]->(this0_posts_connect0_node)
            		}
            	}
            WITH this0, this0_posts_connect0_node
            WITH this0, this0_posts_connect0_node
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization_0_after_this0 IN [(this0_posts_connect0_node)<-[:HAS_POST]-(authorization_0_after_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization_0_after_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this0_posts_connect_Post0
            }
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0
            }
            CALL {
                WITH this0
                RETURN this0 { .id } AS create_var0
            }
            RETURN [create_var0] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"123\\",
                \\"this0_name\\": \\"Bob\\",
                \\"this0_password\\": \\"password\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"authorization_0_before_param2\\": \\"user\\",
                \\"authorization_0_before_param3\\": \\"admin\\",
                \\"authorization_0_after_param2\\": \\"user\\",
                \\"authorization_0_after_param3\\": \\"admin\\",
                \\"authorization_0_after_param4\\": \\"user\\",
                \\"authorization_0_after_param5\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Node + User Defined Where (from create)", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(
                    input: [
                        {
                            id: "123"
                            name: "Bob"
                            password: "password"
                            posts: { connect: { where: { node: { id: "post-id" } } } }
                        }
                    ]
                ) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:User)
            SET this0.id = $this0_id
            SET this0.name = $this0_name
            SET this0.password = $this0_password
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_posts_connect0_node:Post)
            	WHERE this0_posts_connect0_node.id = $this0_posts_connect0_node_param0 AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization_0_before_this0 IN [(this0_posts_connect0_node)<-[:HAS_POST]-(authorization_0_before_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization_0_before_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization_0_before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization_0_before_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	CALL {
            		WITH *
            		WITH collect(this0_posts_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_posts_connect0_node
            			MERGE (this0)-[:HAS_POST]->(this0_posts_connect0_node)
            		}
            	}
            WITH this0, this0_posts_connect0_node
            WITH this0, this0_posts_connect0_node
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization_0_after_this0 IN [(this0_posts_connect0_node)<-[:HAS_POST]-(authorization_0_after_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization_0_after_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this0_posts_connect_Post0
            }
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0
            }
            CALL {
                WITH this0
                RETURN this0 { .id } AS create_var0
            }
            RETURN [create_var0] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"123\\",
                \\"this0_name\\": \\"Bob\\",
                \\"this0_password\\": \\"password\\",
                \\"this0_posts_connect0_node_param0\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"authorization_0_before_param2\\": \\"user\\",
                \\"authorization_0_before_param3\\": \\"admin\\",
                \\"authorization_0_after_param2\\": \\"user\\",
                \\"authorization_0_after_param3\\": \\"admin\\",
                \\"authorization_0_after_param4\\": \\"user\\",
                \\"authorization_0_after_param5\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Node (from update update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { posts: { connect: { where: { node: {} } } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_posts0_connect0_node:Post)
            	WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__before_this0 IN [(this_posts0_connect0_node)<-[:HAS_POST]-(authorization__before_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__before_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__before_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	CALL {
            		WITH *
            		WITH collect(this_posts0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_posts0_connect0_node
            			MERGE (this)-[:HAS_POST]->(this_posts0_connect0_node)
            		}
            	}
            WITH this, this_posts0_connect0_node
            WITH this, this_posts0_connect0_node
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__after_this0 IN [(this_posts0_connect0_node)<-[:HAS_POST]-(authorization__after_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__after_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__after_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this_posts0_connect_Post0
            }
            WITH this
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"update_param2\\": \\"user\\",
                \\"update_param3\\": \\"admin\\",
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"authorization__before_param2\\": \\"user\\",
                \\"authorization__before_param3\\": \\"admin\\",
                \\"authorization__before_param4\\": \\"user\\",
                \\"authorization__before_param5\\": \\"admin\\",
                \\"authorization__after_param2\\": \\"user\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"authorization__after_param4\\": \\"user\\",
                \\"authorization__after_param5\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Node + User Defined Where (from update update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { posts: { connect: { where: { node: { id: "new-id" } } } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_posts0_connect0_node:Post)
            	WHERE this_posts0_connect0_node.id = $this_posts0_connect0_node_param0 AND (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__before_this0 IN [(this_posts0_connect0_node)<-[:HAS_POST]-(authorization__before_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__before_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__before_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	CALL {
            		WITH *
            		WITH collect(this_posts0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_posts0_connect0_node
            			MERGE (this)-[:HAS_POST]->(this_posts0_connect0_node)
            		}
            	}
            WITH this, this_posts0_connect0_node
            WITH this, this_posts0_connect0_node
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__after_this0 IN [(this_posts0_connect0_node)<-[:HAS_POST]-(authorization__after_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__after_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__after_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this_posts0_connect_Post0
            }
            WITH this
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"update_param2\\": \\"user\\",
                \\"update_param3\\": \\"admin\\",
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"this_posts0_connect0_node_param0\\": \\"new-id\\",
                \\"authorization__before_param2\\": \\"user\\",
                \\"authorization__before_param3\\": \\"admin\\",
                \\"authorization__before_param4\\": \\"user\\",
                \\"authorization__before_param5\\": \\"admin\\",
                \\"authorization__after_param2\\": \\"user\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"authorization__after_param4\\": \\"user\\",
                \\"authorization__after_param5\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Node (from update connect)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(connect: { posts: { where: { node: {} } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_posts0_node:Post)
            	WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__before_this0 IN [(this_connect_posts0_node)<-[:HAS_POST]-(authorization__before_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__before_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__before_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	CALL {
            		WITH *
            		WITH collect(this_connect_posts0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_posts0_node
            			MERGE (this)-[:HAS_POST]->(this_connect_posts0_node)
            		}
            	}
            WITH this, this_connect_posts0_node
            WITH this, this_connect_posts0_node
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__after_this0 IN [(this_connect_posts0_node)<-[:HAS_POST]-(authorization__after_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__after_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__after_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this_connect_posts_Post0
            }
            WITH *
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"update_param2\\": \\"user\\",
                \\"update_param3\\": \\"admin\\",
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"authorization__before_param2\\": \\"user\\",
                \\"authorization__before_param3\\": \\"admin\\",
                \\"authorization__before_param4\\": \\"user\\",
                \\"authorization__before_param5\\": \\"admin\\",
                \\"authorization__after_param2\\": \\"user\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"authorization__after_param4\\": \\"user\\",
                \\"authorization__after_param5\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Node + User Defined Where (from update connect)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(connect: { posts: { where: { node: { id: "some-id" } } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_posts0_node:Post)
            	WHERE this_connect_posts0_node.id = $this_connect_posts0_node_param0 AND (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__before_this0 IN [(this_connect_posts0_node)<-[:HAS_POST]-(authorization__before_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__before_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__before_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	CALL {
            		WITH *
            		WITH collect(this_connect_posts0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_posts0_node
            			MERGE (this)-[:HAS_POST]->(this_connect_posts0_node)
            		}
            	}
            WITH this, this_connect_posts0_node
            WITH this, this_connect_posts0_node
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__after_this0 IN [(this_connect_posts0_node)<-[:HAS_POST]-(authorization__after_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__after_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__after_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this_connect_posts_Post0
            }
            WITH *
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"update_param2\\": \\"user\\",
                \\"update_param3\\": \\"admin\\",
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"this_connect_posts0_node_param0\\": \\"some-id\\",
                \\"authorization__before_param2\\": \\"user\\",
                \\"authorization__before_param3\\": \\"admin\\",
                \\"authorization__before_param4\\": \\"user\\",
                \\"authorization__before_param5\\": \\"admin\\",
                \\"authorization__after_param2\\": \\"user\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"authorization__after_param4\\": \\"user\\",
                \\"authorization__after_param5\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Disconnect Node (from update update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { posts: { disconnect: { where: {} } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_posts0_disconnect0_rel:HAS_POST]->(this_posts0_disconnect0:Post)
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__before_this0 IN [(this_posts0_disconnect0)<-[:HAS_POST]-(authorization__before_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__before_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__before_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            CALL {
            	WITH this_posts0_disconnect0, this_posts0_disconnect0_rel, this
            	WITH collect(this_posts0_disconnect0) as this_posts0_disconnect0, this_posts0_disconnect0_rel, this
            	UNWIND this_posts0_disconnect0 as x
            	DELETE this_posts0_disconnect0_rel
            }
            WITH this, this_posts0_disconnect0
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__after_this0 IN [(this_posts0_disconnect0)<-[:HAS_POST]-(authorization__after_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__after_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__after_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            RETURN count(*) AS disconnect_this_posts0_disconnect_Post
            }
            WITH this
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"update_param2\\": \\"user\\",
                \\"update_param3\\": \\"admin\\",
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"authorization__before_param2\\": \\"user\\",
                \\"authorization__before_param3\\": \\"admin\\",
                \\"authorization__before_param4\\": \\"user\\",
                \\"authorization__before_param5\\": \\"admin\\",
                \\"authorization__after_param2\\": \\"user\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"authorization__after_param4\\": \\"user\\",
                \\"authorization__after_param5\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Disconnect Node + User Defined Where (from update update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { posts: [{ disconnect: { where: { node: { id: "new-id" } } } }] }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_posts0_disconnect0_rel:HAS_POST]->(this_posts0_disconnect0:Post)
            WHERE this_posts0_disconnect0.id = $updateUsers_args_update_posts0_disconnect0_where_Post_this_posts0_disconnect0param0 AND (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__before_this0 IN [(this_posts0_disconnect0)<-[:HAS_POST]-(authorization__before_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__before_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__before_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            CALL {
            	WITH this_posts0_disconnect0, this_posts0_disconnect0_rel, this
            	WITH collect(this_posts0_disconnect0) as this_posts0_disconnect0, this_posts0_disconnect0_rel, this
            	UNWIND this_posts0_disconnect0 as x
            	DELETE this_posts0_disconnect0_rel
            }
            WITH this, this_posts0_disconnect0
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__after_this0 IN [(this_posts0_disconnect0)<-[:HAS_POST]-(authorization__after_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__after_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__after_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            RETURN count(*) AS disconnect_this_posts0_disconnect_Post
            }
            WITH this
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"update_param2\\": \\"user\\",
                \\"update_param3\\": \\"admin\\",
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"updateUsers_args_update_posts0_disconnect0_where_Post_this_posts0_disconnect0param0\\": \\"new-id\\",
                \\"authorization__before_param2\\": \\"user\\",
                \\"authorization__before_param3\\": \\"admin\\",
                \\"authorization__before_param4\\": \\"user\\",
                \\"authorization__before_param5\\": \\"admin\\",
                \\"authorization__after_param2\\": \\"user\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"authorization__after_param4\\": \\"user\\",
                \\"authorization__after_param5\\": \\"admin\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"posts\\": [
                                {
                                    \\"disconnect\\": [
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"id\\": \\"new-id\\"
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

    test("Disconnect Node (from update disconnect)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(disconnect: { posts: { where: {} } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__before_this0 IN [(this_disconnect_posts0)<-[:HAS_POST]-(authorization__before_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__before_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__before_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            CALL {
            	WITH this_disconnect_posts0, this_disconnect_posts0_rel, this
            	WITH collect(this_disconnect_posts0) as this_disconnect_posts0, this_disconnect_posts0_rel, this
            	UNWIND this_disconnect_posts0 as x
            	DELETE this_disconnect_posts0_rel
            }
            WITH this, this_disconnect_posts0
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__after_this0 IN [(this_disconnect_posts0)<-[:HAS_POST]-(authorization__after_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__after_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__after_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            RETURN count(*) AS disconnect_this_disconnect_posts_Post
            }
            WITH *
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"update_param2\\": \\"user\\",
                \\"update_param3\\": \\"admin\\",
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"authorization__before_param2\\": \\"user\\",
                \\"authorization__before_param3\\": \\"admin\\",
                \\"authorization__before_param4\\": \\"user\\",
                \\"authorization__before_param5\\": \\"admin\\",
                \\"authorization__after_param2\\": \\"user\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"authorization__after_param4\\": \\"user\\",
                \\"authorization__after_param5\\": \\"admin\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"posts\\": [
                                {
                                    \\"where\\": {}
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Disconnect Node + User Defined Where (from update disconnect)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(disconnect: { posts: { where: { node: { id: "some-id" } } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
            WHERE this_disconnect_posts0.id = $updateUsers_args_disconnect_posts0_where_Post_this_disconnect_posts0param0 AND (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__before_this0 IN [(this_disconnect_posts0)<-[:HAS_POST]-(authorization__before_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__before_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__before_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            CALL {
            	WITH this_disconnect_posts0, this_disconnect_posts0_rel, this
            	WITH collect(this_disconnect_posts0) as this_disconnect_posts0, this_disconnect_posts0_rel, this
            	UNWIND this_disconnect_posts0 as x
            	DELETE this_disconnect_posts0_rel
            }
            WITH this, this_disconnect_posts0
            WHERE (apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND single(authorization__after_this0 IN [(this_disconnect_posts0)<-[:HAS_POST]-(authorization__after_this0:User) WHERE ($jwt.sub IS NOT NULL AND authorization__after_this0.id = $jwt.sub) | 1] WHERE true) AND ($jwt.roles IS NOT NULL AND $authorization__after_param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            RETURN count(*) AS disconnect_this_disconnect_posts_Post
            }
            WITH *
            WITH *
            WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"update_param2\\": \\"user\\",
                \\"update_param3\\": \\"admin\\",
                \\"param2\\": \\"user\\",
                \\"param3\\": \\"admin\\",
                \\"updateUsers_args_disconnect_posts0_where_Post_this_disconnect_posts0param0\\": \\"some-id\\",
                \\"authorization__before_param2\\": \\"user\\",
                \\"authorization__before_param3\\": \\"admin\\",
                \\"authorization__before_param4\\": \\"user\\",
                \\"authorization__before_param5\\": \\"admin\\",
                \\"authorization__after_param2\\": \\"user\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"authorization__after_param4\\": \\"user\\",
                \\"authorization__after_param5\\": \\"admin\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"posts\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"id\\": \\"some-id\\"
                                        }
                                    }
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
