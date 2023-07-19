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
import { Neo4jGraphQL } from "../../../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../../../utils/tck-test-utils";
import { createBearerToken } from "../../../../../utils/create-bearer-token";

describe("Cypher Auth Where", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
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
                creator: User! @relationship(type: "HAS_POST", direction: IN)
            }

            extend type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])

            extend type User {
                password: String! @authorization(filter: [{ operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }

            extend type Post {
                secretKey: String!
                    @authorization(filter: [{ operations: [READ], where: { node: { creator: { id: "$jwt.sub" } } } }])
            }

            extend type Post @authorization(filter: [{ where: { node: { creator: { id: "$jwt.sub" } } } }])
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
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
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
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("Read Node + User Defined Where", async () => {
        const query = gql`
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
            WHERE (this.name = $param0 AND ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)))
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
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("Read Relationship", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                WITH *, count(this2) AS creatorCount
                WITH *
                WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND this2.id = coalesce($jwt.sub, $jwtDefault)))
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
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("Read Connection", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                WITH *, count(this2) AS creatorCount
                WITH *
                WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND this2.id = coalesce($jwt.sub, $jwtDefault)))
                WITH { node: { content: this1.content } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            RETURN this { .id, postsConnection: var3 } AS this"
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
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("Read Connection + User Defined Where", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                WITH *, count(this2) AS creatorCount
                WITH *
                WHERE (this1.id = $param3 AND ($isAuthenticated = true AND (creatorCount <> 0 AND this2.id = coalesce($jwt.sub, $jwtDefault))))
                WITH { node: { content: this1.content } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            RETURN this { .id, postsConnection: var3 } AS this"
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
                \\"jwtDefault\\": {},
                \\"param3\\": \\"some-id\\"
            }"
        `);
    });

    test("Read Union Relationship + User Defined Where", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                WITH *, count(this2) AS creatorCount
                WITH *
                WHERE (this1.content = $param3 AND ($isAuthenticated = true AND (creatorCount <> 0 AND this2.id = coalesce($jwt.sub, $jwtDefault))))
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
                \\"jwtDefault\\": {},
                \\"param3\\": \\"cool\\"
            }"
        `);
    });

    test("Read Union", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WITH *, count(this2) AS creatorCount
                    WITH *
                    WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND this2.id = coalesce($jwt.sub, $jwtDefault)))
                    WITH this1 { __resolveType: \\"Post\\", __id: id(this), .id } AS this1
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
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("Read Union Using Connection", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WITH *, count(this2) AS creatorCount
                    WITH *
                    WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND this2.id = coalesce($jwt.sub, $jwtDefault)))
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
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("Read Union Using Connection + User Defined Where", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WITH *, count(this2) AS creatorCount
                    WITH *
                    WHERE (this1.id = $param3 AND ($isAuthenticated = true AND (creatorCount <> 0 AND this2.id = coalesce($jwt.sub, $jwtDefault))))
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
                \\"jwtDefault\\": {},
                \\"param3\\": \\"some-id\\"
            }"
        `);
    });

    test("Update Node", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            SET this.name = $this_update_name
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
                \\"jwtDefault\\": {},
                \\"this_update_name\\": \\"Bob\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update Node + User Defined Where", async () => {
        const query = gql`
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
            WHERE (this.name = $param0 AND ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)))
            SET this.name = $this_update_name
            RETURN collect(DISTINCT this { .id }) AS data"
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
                \\"jwtDefault\\": {},
                \\"this_update_name\\": \\"Bob\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update Nested Node", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_has_post0_relationship:HAS_POST]->(this_posts0:Post)
            	OPTIONAL MATCH (this_posts0)<-[:HAS_POST]-(authorization_this0:User)
            	WITH *, count(authorization_this0) AS creatorCount
            	WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault)))
            	SET this_posts0.id = $this_update_posts0_id
            	WITH this, this_posts0
            	CALL {
            		WITH this_posts0
            		MATCH (this_posts0)<-[this_posts0_creator_User_unique:HAS_POST]-(:User)
            		WITH count(this_posts0_creator_User_unique) as c
            		WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            		RETURN c AS this_posts0_creator_User_unique_ignored
            	}
            	RETURN count(*) AS update_this_posts0
            }
            WITH *
            CALL {
                WITH this
                MATCH (this)-[update_this0:HAS_POST]->(update_this1:Post)
                OPTIONAL MATCH (update_this1)<-[:HAS_POST]-(update_this2:User)
                WITH *, count(update_this2) AS creatorCount
                WITH *
                WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND update_this2.id = coalesce($jwt.sub, $jwtDefault)))
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
                \\"jwtDefault\\": {},
                \\"this_update_posts0_id\\": \\"new-id\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Delete Node", async () => {
        const query = gql`
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
            WITH *
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
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
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("Delete Node + User Defined Where", async () => {
        const query = gql`
            mutation {
                deleteUsers(where: { name: "Bob" }) {
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
            WITH *
            WHERE (this.name = $param0 AND ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)))
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Bob\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("Delete Nested Node", async () => {
        const query = gql`
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
            WITH *
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            OPTIONAL MATCH (this_posts0)<-[:HAS_POST]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_posts0_relationship:HAS_POST]->(this_posts0:Post)
            WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault)))
            WITH this_posts0_relationship, collect(DISTINCT this_posts0) AS this_posts0_to_delete
            CALL {
            	WITH this_posts0_to_delete
            	UNWIND this_posts0_to_delete AS x
            	DETACH DELETE x
            }
            }
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
                \\"jwtDefault\\": {}
            }"
        `);
    });

    test("Connect Node (from create)", async () => {
        const query = gql`
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
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_posts_connect0_node:Post)
            OPTIONAL MATCH (this0_posts_connect0_node)<-[:HAS_POST]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            	WHERE (($isAuthenticated = true AND this0.id = coalesce($jwt.sub, $jwtDefault)) AND ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))))
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
            	RETURN count(*) AS connect_this0_posts_connect_Post
            }
            RETURN this0
            }
            RETURN [this0 { .id }] AS data"
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
                \\"jwtDefault\\": {},
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Node + User Defined Where (from create)", async () => {
        const query = gql`
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
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_posts_connect0_node:Post)
            OPTIONAL MATCH (this0_posts_connect0_node)<-[:HAS_POST]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            	WHERE this0_posts_connect0_node.id = $this0_posts_connect0_node_param0 AND (($isAuthenticated = true AND this0.id = coalesce($jwt.sub, $jwtDefault)) AND ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))))
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
            	RETURN count(*) AS connect_this0_posts_connect_Post
            }
            RETURN this0
            }
            RETURN [this0 { .id }] AS data"
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
                \\"jwtDefault\\": {},
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Node (from update update)", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_posts0_connect0_node:Post)
            OPTIONAL MATCH (this_posts0_connect0_node)<-[:HAS_POST]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            	WHERE (($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)) AND ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))))
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
            	RETURN count(*) AS connect_this_posts0_connect_Post
            }
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
                \\"jwtDefault\\": {},
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Node + User Defined Where (from update update)", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_posts0_connect0_node:Post)
            OPTIONAL MATCH (this_posts0_connect0_node)<-[:HAS_POST]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            	WHERE this_posts0_connect0_node.id = $this_posts0_connect0_node_param0 AND (($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)) AND ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))))
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
            	RETURN count(*) AS connect_this_posts0_connect_Post
            }
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
                \\"jwtDefault\\": {},
                \\"this_posts0_connect0_node_param0\\": \\"new-id\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Node (from update connect)", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_posts0_node:Post)
            OPTIONAL MATCH (this_connect_posts0_node)<-[:HAS_POST]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            	WHERE (($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)) AND ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))))
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
            	RETURN count(*) AS connect_this_connect_posts_Post
            }
            WITH *
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
                \\"jwtDefault\\": {},
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect Node + User Defined Where (from update connect)", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_posts0_node:Post)
            OPTIONAL MATCH (this_connect_posts0_node)<-[:HAS_POST]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            	WHERE this_connect_posts0_node.id = $this_connect_posts0_node_param0 AND (($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)) AND ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))))
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
            	RETURN count(*) AS connect_this_connect_posts_Post
            }
            WITH *
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
                \\"jwtDefault\\": {},
                \\"this_connect_posts0_node_param0\\": \\"some-id\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Disconnect Node (from update update)", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_posts0_disconnect0_rel:HAS_POST]->(this_posts0_disconnect0:Post)
            OPTIONAL MATCH (this_posts0_disconnect0)<-[:HAS_POST]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            WHERE (($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)) AND ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))))
            CALL {
            	WITH this_posts0_disconnect0, this_posts0_disconnect0_rel, this
            	WITH collect(this_posts0_disconnect0) as this_posts0_disconnect0, this_posts0_disconnect0_rel, this
            	UNWIND this_posts0_disconnect0 as x
            	DELETE this_posts0_disconnect0_rel
            }
            RETURN count(*) AS disconnect_this_posts0_disconnect_Post
            }
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
                \\"jwtDefault\\": {},
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Disconnect Node + User Defined Where (from update update)", async () => {
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_posts0_disconnect0_rel:HAS_POST]->(this_posts0_disconnect0:Post)
            OPTIONAL MATCH (this_posts0_disconnect0)<-[:HAS_POST]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            WHERE this_posts0_disconnect0.id = $updateUsers_args_update_posts0_disconnect0_where_Post_this_posts0_disconnect0param0 AND (($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)) AND ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))))
            CALL {
            	WITH this_posts0_disconnect0, this_posts0_disconnect0_rel, this
            	WITH collect(this_posts0_disconnect0) as this_posts0_disconnect0, this_posts0_disconnect0_rel, this
            	UNWIND this_posts0_disconnect0 as x
            	DELETE this_posts0_disconnect0_rel
            }
            RETURN count(*) AS disconnect_this_posts0_disconnect_Post
            }
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
                \\"jwtDefault\\": {},
                \\"updateUsers_args_update_posts0_disconnect0_where_Post_this_posts0_disconnect0param0\\": \\"new-id\\",
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
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
            OPTIONAL MATCH (this_disconnect_posts0)<-[:HAS_POST]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            WHERE (($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)) AND ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))))
            CALL {
            	WITH this_disconnect_posts0, this_disconnect_posts0_rel, this
            	WITH collect(this_disconnect_posts0) as this_disconnect_posts0, this_disconnect_posts0_rel, this
            	UNWIND this_disconnect_posts0 as x
            	DELETE this_disconnect_posts0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_posts_Post
            }
            WITH *
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
                \\"jwtDefault\\": {},
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
        const query = gql`
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
            WHERE ($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault))
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
            OPTIONAL MATCH (this_disconnect_posts0)<-[:HAS_POST]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            WHERE this_disconnect_posts0.id = $updateUsers_args_disconnect_posts0_where_Post_this_disconnect_posts0param0 AND (($isAuthenticated = true AND this.id = coalesce($jwt.sub, $jwtDefault)) AND ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))))
            CALL {
            	WITH this_disconnect_posts0, this_disconnect_posts0_rel, this
            	WITH collect(this_disconnect_posts0) as this_disconnect_posts0, this_disconnect_posts0_rel, this
            	UNWIND this_disconnect_posts0 as x
            	DELETE this_disconnect_posts0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_posts_Post
            }
            WITH *
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
                \\"jwtDefault\\": {},
                \\"updateUsers_args_disconnect_posts0_where_Post_this_disconnect_posts0param0\\": \\"some-id\\",
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
