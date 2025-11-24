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

import { Neo4jGraphQL } from "../../../../../src";
import { createBearerToken } from "../../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

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

            type User @node {
                id: ID
                name: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                content: [Search!]! @relationship(type: "HAS_POST", direction: OUT) # something to test unions
            }

            type Post @node {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_POST", direction: IN)
            }

            extend type User
                @authorization(
                    validate: [
                        { where: { node: { id: { eq: "$jwt.sub" } }, jwt: { roles: { includes: "user" } } } }
                        { where: { jwt: { roles: { includes: "admin" } } } }
                    ]
                )

            extend type User {
                password: String!
                    @authorization(filter: [{ operations: [READ], where: { node: { id: { eq: "$jwt.sub" } } } }])
            }

            extend type Post {
                secretKey: String!
                    @authorization(
                        filter: [
                            { operations: [READ], where: { node: { creator: { some: { id: { eq: "$jwt.sub" } } } } } }
                        ]
                    )
            }

            extend type Post
                @authorization(
                    validate: [
                        {
                            where: {
                                node: { creator: { some: { id: { eq: "$jwt.sub" } } } }
                                jwt: { roles: { includes: "user" } }
                            }
                        }
                        { where: { jwt: { roles: { includes: "admin" } } } }
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                users(where: { name: { eq: "bob" } }) {
                    id
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE this.name = $param0
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WITH DISTINCT this1
                WITH *
                CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                } AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                } AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH collect({ node: this1, relationship: this0 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ node: { content: this1.content, __resolveType: \\"Post\\" } }) AS var3
                }
                RETURN { edges: var3 } AS var4
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
                    postsConnection(where: { node: { id: { eq: "some-id" } } }) {
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WHERE this1.id = $param4
                CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                } AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH collect({ node: this1, relationship: this0 }) AS edges
                CALL (edges) {
                    UNWIND edges AS edge
                    WITH edge.node AS this1, edge.relationship AS this0
                    RETURN collect({ node: { content: this1.content, __resolveType: \\"Post\\" } }) AS var3
                }
                RETURN { edges: var3 } AS var4
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
                    posts(where: { content: { eq: "cool" } }) {
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WITH DISTINCT this1
                WITH *
                WHERE this1.content = $param4
                CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                } AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this1)<-[:HAS_POST]-(this2:User)
                        WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this1 { .id, __resolveType: \\"Post\\", __id: id(this1) } AS var3
                    RETURN var3
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                CALL (this) {
                    CALL (this) {
                        WITH this
                        MATCH (this)-[this0:HAS_POST]->(this1:Post)
                        CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                            MATCH (this1)<-[:HAS_POST]-(this2:User)
                            WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                        } AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH { node: { __resolveType: \\"Post\\", __id: id(this1), id: this1.id } } AS edge
                        RETURN edge
                    }
                    RETURN collect(edge) AS edges
                }
                WITH edges
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
                    contentConnection(where: { Post: { node: { id: { eq: "some-id" } } } }) {
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                CALL (this) {
                    CALL (this) {
                        WITH this
                        MATCH (this)-[this0:HAS_POST]->(this1:Post)
                        WHERE this1.id = $param4
                        CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                            MATCH (this1)<-[:HAS_POST]-(this2:User)
                            WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                        } AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH { node: { __resolveType: \\"Post\\", __id: id(this1), id: this1.id } } AS edge
                        RETURN edge
                    }
                    RETURN collect(edge) AS edges
                }
                WITH edges
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
                updateUsers(update: { name_SET: "Bob" }) {
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            SET
                this.name = $param4
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"Bob\\",
                \\"param5\\": \\"user\\",
                \\"param6\\": \\"admin\\",
                \\"param7\\": \\"user\\",
                \\"param8\\": \\"admin\\"
            }"
        `);
    });

    test("Update Node + User Defined Where", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(where: { name: { eq: "bob" } }, update: { name_SET: "Bob" }) {
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE this.name = $param0
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            SET
                this.name = $param5
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param9 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                \\"param4\\": \\"admin\\",
                \\"param5\\": \\"Bob\\",
                \\"param6\\": \\"user\\",
                \\"param7\\": \\"admin\\",
                \\"param8\\": \\"user\\",
                \\"param9\\": \\"admin\\"
            }"
        `);
    });

    test("Update Nested Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { posts: { update: { node: { id_SET: "new-id" } } } }) {
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WITH *
                WITH *
                CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                } AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                SET
                    this1.id = $param4
                WITH *
                CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_POST]-(this3:User)
                    WHERE ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)
                } AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                MATCH (this)-[this4:HAS_POST]->(this5:Post)
                WITH DISTINCT this5
                WITH *
                CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                    MATCH (this5)<-[:HAS_POST]-(this6:User)
                    WHERE ($jwt.sub IS NOT NULL AND this6.id = $jwt.sub)
                } AND ($jwt.roles IS NOT NULL AND $param9 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param10 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this5 { .id } AS this5
                RETURN collect(this5) AS var7
            }
            RETURN this { .id, posts: var7 } AS this"
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
                \\"param4\\": \\"new-id\\",
                \\"param5\\": \\"user\\",
                \\"param6\\": \\"admin\\",
                \\"param7\\": \\"user\\",
                \\"param8\\": \\"admin\\",
                \\"param9\\": \\"user\\",
                \\"param10\\": \\"admin\\"
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
            "CYPHER 5
            MATCH (this:User)
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
            "CYPHER 5
            MATCH (this:User)
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL (*) {
                OPTIONAL MATCH (this)-[this0:HAS_POST]->(this1:Post)
                CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                } AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0, collect(DISTINCT this1) AS var3
                CALL (var3) {
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
            "CYPHER 5
            CALL {
                CREATE (this0:User)
                SET
                    this0.id = $param0,
                    this0.name = $param1,
                    this0.password = $param2
                WITH *
                CALL (this0) {
                    MATCH (this1:Post)
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this1)<-[:HAS_POST]-(this2:User)
                        WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CREATE (this0)-[this3:HAS_POST]->(this1)
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this1)<-[:HAS_POST]-(this4:User)
                        WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param9 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param10 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
                WITH *
                CALL (*) {
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param11 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param12 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var5
            }
            RETURN collect(var5) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"param1\\": \\"Bob\\",
                \\"param2\\": \\"password\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param5\\": \\"user\\",
                \\"param6\\": \\"admin\\",
                \\"param7\\": \\"user\\",
                \\"param8\\": \\"admin\\",
                \\"param9\\": \\"user\\",
                \\"param10\\": \\"admin\\",
                \\"param11\\": \\"user\\",
                \\"param12\\": \\"admin\\"
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
                            posts: { connect: { where: { node: { id: { eq: "post-id" } } } } }
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
            "CYPHER 5
            CALL {
                CREATE (this0:User)
                SET
                    this0.id = $param0,
                    this0.name = $param1,
                    this0.password = $param2
                WITH *
                CALL (this0) {
                    MATCH (this1:Post)
                    WHERE this1.id = $param3
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this1)<-[:HAS_POST]-(this2:User)
                        WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CREATE (this0)-[this3:HAS_POST]->(this1)
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this1)<-[:HAS_POST]-(this4:User)
                        WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param9 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param10 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param11 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
                WITH *
                CALL (*) {
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param12 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param13 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var5
            }
            RETURN collect(var5) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"param1\\": \\"Bob\\",
                \\"param2\\": \\"password\\",
                \\"param3\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param6\\": \\"user\\",
                \\"param7\\": \\"admin\\",
                \\"param8\\": \\"user\\",
                \\"param9\\": \\"admin\\",
                \\"param10\\": \\"user\\",
                \\"param11\\": \\"admin\\",
                \\"param12\\": \\"user\\",
                \\"param13\\": \\"admin\\"
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Post)
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this0)<-[:HAS_POST]-(this1:User)
                        WHERE ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CREATE (this)-[this2:HAS_POST]->(this0)
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this0)<-[:HAS_POST]-(this3:User)
                        WHERE ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param9 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"user\\",
                \\"param5\\": \\"admin\\",
                \\"param6\\": \\"user\\",
                \\"param7\\": \\"admin\\",
                \\"param8\\": \\"user\\",
                \\"param9\\": \\"admin\\"
            }"
        `);
    });

    test("Connect Node + User Defined Where (from update update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { posts: { connect: { where: { node: { id: { eq: "new-id" } } } } } }) {
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Post)
                    WHERE this0.id = $param0
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this0)<-[:HAS_POST]-(this1:User)
                        WHERE ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CREATE (this)-[this2:HAS_POST]->(this0)
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this0)<-[:HAS_POST]-(this3:User)
                        WHERE ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param9 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param10 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"new-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param3\\": \\"user\\",
                \\"param4\\": \\"admin\\",
                \\"param5\\": \\"user\\",
                \\"param6\\": \\"admin\\",
                \\"param7\\": \\"user\\",
                \\"param8\\": \\"admin\\",
                \\"param9\\": \\"user\\",
                \\"param10\\": \\"admin\\"
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this1)<-[:HAS_POST]-(this2:User)
                        WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    DELETE this0
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this1)<-[:HAS_POST]-(this3:User)
                        WHERE ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param9 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param10 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param11 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                \\"param3\\": \\"admin\\",
                \\"param4\\": \\"user\\",
                \\"param5\\": \\"admin\\",
                \\"param6\\": \\"user\\",
                \\"param7\\": \\"admin\\",
                \\"param8\\": \\"user\\",
                \\"param9\\": \\"admin\\",
                \\"param10\\": \\"user\\",
                \\"param11\\": \\"admin\\"
            }"
        `);
    });

    test("Disconnect Node + User Defined Where (from update update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { posts: [{ disconnect: { where: { node: { id: { eq: "new-id" } } } } }] }) {
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    WHERE this1.id = $param0
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this1)<-[:HAS_POST]-(this2:User)
                        WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    DELETE this0
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND EXISTS {
                        MATCH (this1)<-[:HAS_POST]-(this3:User)
                        WHERE ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)
                    } AND ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param8 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param9 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param10 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT (($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub) AND ($jwt.roles IS NOT NULL AND $param11 IN $jwt.roles)) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param12 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"new-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param3\\": \\"user\\",
                \\"param4\\": \\"admin\\",
                \\"param5\\": \\"user\\",
                \\"param6\\": \\"admin\\",
                \\"param7\\": \\"user\\",
                \\"param8\\": \\"admin\\",
                \\"param9\\": \\"user\\",
                \\"param10\\": \\"admin\\",
                \\"param11\\": \\"user\\",
                \\"param12\\": \\"admin\\"
            }"
        `);
    });
});
