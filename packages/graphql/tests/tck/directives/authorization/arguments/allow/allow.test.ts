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

import { Neo4jGraphQL } from "../../../../../../src";
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../../../utils/tck-test-utils";

describe("Cypher Auth Allow", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Comment @node {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_COMMENT", direction: IN)
                post: [Post!]! @relationship(type: "HAS_COMMENT", direction: IN)
            }

            type Post @node {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_POST", direction: IN)
                comments: [Comment!]! @relationship(type: "HAS_COMMENT", direction: OUT)
            }

            type User @node {
                id: ID
                name: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User
                @authorization(
                    validate: [
                        {
                            operations: [READ, UPDATE, DELETE, DELETE_RELATIONSHIP, CREATE_RELATIONSHIP]
                            when: BEFORE
                            where: { node: { id: { eq: "$jwt.sub" } } }
                        }
                    ]
                )

            extend type User {
                password: String!
                    @authorization(
                        validate: [
                            {
                                operations: [READ, UPDATE, DELETE]
                                when: BEFORE
                                where: { node: { id: { eq: "$jwt.sub" } } }
                            }
                        ]
                    )
            }

            extend type Post
                @authorization(
                    validate: [
                        {
                            operations: [READ, UPDATE, DELETE, DELETE_RELATIONSHIP, CREATE_RELATIONSHIP]
                            when: BEFORE
                            where: { node: { creator: { some: { id: { eq: "$jwt.sub" } } } } }
                        }
                    ]
                )

            extend type Comment
                @authorization(
                    validate: [
                        {
                            operations: [READ, UPDATE, DELETE, DELETE_RELATIONSHIP, CREATE_RELATIONSHIP]
                            when: BEFORE
                            where: { node: { creator: { some: { id: { eq: "$jwt.sub" } } } } }
                        }
                    ]
                )
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
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
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                }
            }"
        `);
    });

    test("Read Node & Protected Field", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    password
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
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .password } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                }
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
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WITH DISTINCT this1
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                }
            }"
        `);
    });

    test("Read Relationship & Protected Field", async () => {
        const query = /* GraphQL */ `
            {
                posts {
                    creator {
                        password
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
            MATCH (this:Post)
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_POST]-(this0:User)
                WHERE ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)
            }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                MATCH (this)<-[this1:HAS_POST]-(this2:User)
                WITH DISTINCT this2
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this2 { .password } AS this2
                RETURN collect(this2) AS var3
            }
            RETURN this { creator: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                }
            }"
        `);
    });

    test("Read Two Relationships", async () => {
        const query = /* GraphQL */ `
            {
                users(where: { id: { eq: "1" } }) {
                    id
                    posts(where: { id: { eq: "1" } }) {
                        comments(where: { id: { eq: "1" } }) {
                            content
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
            WHERE this.id = $param0
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WITH DISTINCT this1
                WITH *
                WHERE this1.id = $param3
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL (this1) {
                    MATCH (this1)-[this3:HAS_COMMENT]->(this4:Comment)
                    WITH DISTINCT this4
                    WITH *
                    WHERE this4.id = $param4
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this4)<-[:HAS_COMMENT]-(this5:User)
                        WHERE ($jwt.sub IS NOT NULL AND this5.id = $jwt.sub)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this4 { .content } AS this4
                    RETURN collect(this4) AS var6
                }
                WITH this1 { comments: var6 } AS this1
                RETURN collect(this1) AS var7
            }
            RETURN this { .id, posts: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param3\\": \\"1\\",
                \\"param4\\": \\"1\\"
            }"
        `);
    });

    test("Update Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(where: { id: { eq: "old-id" } }, update: { id_SET: "new-id" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "old-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            SET
                this.id = $param3
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"old-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"old-id\\"
                },
                \\"param3\\": \\"new-id\\"
            }"
        `);
    });

    test("Update Node Property", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(where: { id: { eq: "id-01" } }, update: { password_SET: "new-password" }) {
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
            WHERE this.id = $param0
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            SET
                this.password = $param3
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id-01\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param3\\": \\"new-password\\"
            }"
        `);
    });

    test("Nested Update Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updatePosts(
                    where: { id: { eq: "post-id" } }
                    update: { creator: { update: { node: { id_SET: "new-id" } } } }
                ) {
                    posts {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                MATCH (this)<-[this0:HAS_POST]-(this1:User)
                WITH *
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                SET
                    this1.id = $param3
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_POST]-(this2:User)
                WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
            }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                },
                \\"param3\\": \\"new-id\\"
            }"
        `);
    });

    test("Nested Update Property", async () => {
        const query = /* GraphQL */ `
            mutation {
                updatePosts(
                    where: { id: { eq: "post-id" } }
                    update: { creator: { update: { node: { password_SET: "new-password" } } } }
                ) {
                    posts {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                MATCH (this)<-[this0:HAS_POST]-(this1:User)
                WITH *
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                SET
                    this1.password = $param3
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_POST]-(this2:User)
                WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
            }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                },
                \\"param3\\": \\"new-password\\"
            }"
        `);
    });

    test("Delete Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteUsers(where: { id: { eq: "user-id" } }) {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WHERE this.id = $param0
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                }
            }"
        `);
    });

    test("Nested Delete Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteUsers(
                    where: { id: { eq: "user-id" } }
                    delete: { posts: { where: { node: { id: { eq: "post-id" } } } } }
                ) {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WHERE this.id = $param0
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL (*) {
                OPTIONAL MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WHERE this1.id = $param3
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                \\"param0\\": \\"user-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                },
                \\"param3\\": \\"post-id\\"
            }"
        `);
    });

    test("Disconnect Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(
                    where: { id: { eq: "user-id" } }
                    update: { posts: { disconnect: { where: { node: { id: { eq: "post-id" } } } } } }
                ) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    WHERE this1.id = $param1
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this1)<-[:HAS_POST]-(this2:User)
                        WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    DELETE this0
                }
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"param1\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                }
            }"
        `);
    });

    test("Nested Disconnect Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateComments(
                    where: { id: { eq: "comment-id" } }
                    update: {
                        post: {
                            disconnect: { disconnect: { creator: { where: { node: { id: { eq: "user-id" } } } } } }
                        }
                    }
                ) {
                    comments {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Comment)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)<-[this0:HAS_COMMENT]-(this1:Post)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this1)<-[:HAS_POST]-(this2:User)
                        WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this)<-[:HAS_COMMENT]-(this3:User)
                        WHERE ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CALL (this1) {
                        CALL (this1) {
                            OPTIONAL MATCH (this1)<-[this4:HAS_POST]-(this5:User)
                            WHERE this5.id = $param3
                            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this5.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                            WITH *
                            CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                                MATCH (this1)<-[:HAS_POST]-(this6:User)
                                WHERE ($jwt.sub IS NOT NULL AND this6.id = $jwt.sub)
                            }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                            WITH *
                            DELETE this4
                        }
                    }
                    WITH *
                    DELETE this0
                }
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_COMMENT]-(this7:User)
                WHERE ($jwt.sub IS NOT NULL AND this7.id = $jwt.sub)
            }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"comment-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                },
                \\"param3\\": \\"user-id\\"
            }"
        `);
    });

    test("Connect Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(
                    where: { id: { eq: "user-id" } }
                    update: { posts: { connect: { where: { node: { id: { eq: "post-id" } } } } } }
                ) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Post)
                    WHERE this0.id = $param1
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this0)<-[:HAS_POST]-(this1:User)
                        WHERE ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CREATE (this)-[this2:HAS_POST]->(this0)
                }
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"param1\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                }
            }"
        `);
    });
});
