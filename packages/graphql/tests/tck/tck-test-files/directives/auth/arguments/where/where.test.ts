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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../../../src";
import { createJwtRequest } from "../../../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../../../utils/tck-test-utils";

describe("Cypher Auth Where", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            union Search = Post

            type User {
                id: ID
                name: String
                posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
                content: [Search] @relationship(type: "HAS_POST", direction: OUT) # something to test unions
            }

            type Post {
                id: ID
                content: String
                creator: User @relationship(type: "HAS_POST", direction: IN)
            }

            extend type User
                @auth(rules: [{ operations: [READ, UPDATE, DELETE, CONNECT, DISCONNECT], where: { id: "$jwt.sub" } }])

            extend type User {
                password: String! @auth(rules: [{ operations: [READ], where: { id: "$jwt.sub" } }])
            }

            extend type Post {
                secretKey: String! @auth(rules: [{ operations: [READ], where: { creator: { id: "$jwt.sub" } } }])
            }

            extend type Post
                @auth(
                    rules: [
                        {
                            operations: [READ, UPDATE, DELETE, CONNECT, DISCONNECT]
                            where: { creator: { id: "$jwt.sub" } }
                        }
                    ]
                )
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.name = $this_name AND this.id IS NOT NULL AND this.id = $this_auth_where0_id
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"bob\\",
                \\"this_auth_where0_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            RETURN this { .id, posts: [ (this)-[:HAS_POST]->(this_posts:Post)  WHERE EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts_auth_where0_creator_id) | this_posts { .content } ] } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_posts_auth_where0_creator_id\\": \\"id-01\\",
                \\"this_auth_where0_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            CALL {
            WITH this
            MATCH (this)-[this_has_post_relationship:HAS_POST]->(this_post:Post)
            WHERE EXISTS((this_post)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_post)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post_auth_where0_creator_id)
            WITH collect({ node: { content: this_post.content } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS postsConnection
            }
            RETURN this { .id, postsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_post_auth_where0_creator_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            CALL {
            WITH this
            MATCH (this)-[this_has_post_relationship:HAS_POST]->(this_post:Post)
            WHERE this_post.id = $this_postsConnection.args.where.node.id AND EXISTS((this_post)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_post)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post_auth_where0_creator_id)
            WITH collect({ node: { content: this_post.content } }) AS edges
            RETURN { edges: edges, totalCount: size(edges) } AS postsConnection
            }
            RETURN this { .id, postsConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_post_auth_where0_creator_id\\": \\"id-01\\",
                \\"this_postsConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"id\\": \\"some-id\\"
                            }
                        }
                    }
                }
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            RETURN this { .id, posts: [ (this)-[:HAS_POST]->(this_posts:Post)  WHERE this_posts.content = $this_posts_content AND EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts_auth_where0_creator_id) | this_posts { .content } ] } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_posts_content\\": \\"cool\\",
                \\"this_posts_auth_where0_creator_id\\": \\"id-01\\",
                \\"this_auth_where0_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            RETURN this { .id, content:  [this_content IN [(this)-[:HAS_POST]->(this_content) WHERE (\\"Post\\" IN labels(this_content)) | head( [ this_content IN [this_content] WHERE (\\"Post\\" IN labels(this_content)) AND EXISTS((this_content)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_content)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content_Post_auth_where0_creator_id) | this_content { __resolveType: \\"Post\\",  .id } ] ) ] WHERE this_content IS NOT NULL]  } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_content_Post_auth_where0_creator_id\\": \\"id-01\\",
                \\"this_auth_where0_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_has_post_relationship:HAS_POST]->(this_Post:Post)
            WHERE EXISTS((this_Post)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_Post)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_where0_creator_id)
            WITH { node: { __resolveType: \\"Post\\", id: this_Post.id } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: totalCount } AS contentConnection
            }
            RETURN this { .id, contentConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_Post_auth_where0_creator_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_has_post_relationship:HAS_POST]->(this_Post:Post)
            WHERE this_Post.id = $this_contentConnection.args.where.Post.node.id AND EXISTS((this_Post)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_Post)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_where0_creator_id)
            WITH { node: { __resolveType: \\"Post\\", id: this_Post.id } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges, count(edge) as totalCount
            RETURN { edges: edges, totalCount: totalCount } AS contentConnection
            }
            RETURN this { .id, contentConnection } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_Post_auth_where0_creator_id\\": \\"id-01\\",
                \\"this_contentConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"Post\\": {
                                \\"node\\": {
                                    \\"id\\": \\"some-id\\"
                                }
                            }
                        }
                    }
                }
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            SET this.name = $this_update_name
            RETURN [ metaVal IN [{type: 'Updated', name: 'User', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_update_name\\": \\"Bob\\",
                \\"this_update\\": {
                    \\"name\\": \\"Bob\\"
                }
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.name = $this_name AND this.id IS NOT NULL AND this.id = $this_auth_where0_id
            SET this.name = $this_update_name
            RETURN [ metaVal IN [{type: 'Updated', name: 'User', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"bob\\",
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_update_name\\": \\"Bob\\",
                \\"this_update\\": {
                    \\"name\\": \\"Bob\\"
                }
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WITH this
            OPTIONAL MATCH (this)-[this_has_post0_relationship:HAS_POST]->(this_posts0:Post)
            WHERE EXISTS((this_posts0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_auth_where0_creator_id)
            CALL apoc.do.when(this_posts0 IS NOT NULL, \\"
            SET this_posts0.id = $this_update_posts0_id
            RETURN this, this_posts0, this_has_post0_relationship, [ metaVal IN [{type: 'Updated', name: 'Post', id: id(this_posts0), properties: $this_update_posts0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta
            \\", \\"\\", {this:this, this_posts0:this_posts0, this_has_post0_relationship:this_has_post0_relationship, updateUsers: $updateUsers, this_posts0:this_posts0, auth:$auth,this_update_posts0_id:$this_update_posts0_id,this_update_posts0:$this_update_posts0})
            YIELD value
            WITH this, this_posts0, this_has_post0_relationship, value.mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id, posts: [ (this)-[:HAS_POST]->(this_posts:Post)  WHERE EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts_auth_where0_creator_id) | this_posts { .id } ] } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_posts_auth_where0_creator_id\\": \\"id-01\\",
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_posts0_auth_where0_creator_id\\": \\"id-01\\",
                \\"this_update_posts0_id\\": \\"new-id\\",
                \\"this_update_posts0\\": {
                    \\"id\\": \\"new-id\\"
                },
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"id-01\\"
                    }
                },
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"posts\\": [
                                {
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"id\\": \\"new-id\\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                }
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.name = $this_name AND this.id IS NOT NULL AND this.id = $this_auth_where0_id
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_name\\": \\"Bob\\",
                \\"this_auth_where0_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            OPTIONAL MATCH (this)-[this_posts0_relationship:HAS_POST]->(this_posts0:Post)
            WHERE EXISTS((this_posts0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_auth_where0_creator_id)
            WITH this, this_posts0, collect(DISTINCT this_posts0) as this_posts0_to_delete, [ metaVal IN [{type: 'Deleted', name: 'Post', id: id(this_posts0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta
            FOREACH(x IN this_posts0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_posts0_auth_where0_creator_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:User)
            SET this0.id = $this0_id
            SET this0.name = $this0_name
            SET this0.password = $this0_password
            WITH this0, [ metaVal IN [{type: 'Created', name: 'User', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta
            CALL {
            WITH this0, this0_mutateMeta
            	OPTIONAL MATCH (this0_posts_connect0_node:Post)
            	WHERE EXISTS((this0_posts_connect0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this0_posts_connect0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this0_posts_connect0_node_auth_where0_creator_id)
            CALL apoc.do.when(this0_posts_connect0_node IS NOT NULL AND this0 IS NOT NULL, \\"
            			MERGE (this0)-[:HAS_POST]->(this0_posts_connect0_node)
            RETURN this0, this0_posts_connect0_node, [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_POST', toName: 'Post', id: id(this0), toID: id(this0_posts_connect0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_posts_connect0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_posts_connect0_node:this0_posts_connect0_node})
            YIELD value
            WITH this0, this0_posts_connect0_node, value.this0_posts_connect0_node_mutateMeta as this0_posts_connect_mutateMeta
            RETURN REDUCE(tmp1_this0_posts_connect_mutateMeta = [], tmp2_this0_posts_connect_mutateMeta IN COLLECT(this0_posts_connect_mutateMeta) | tmp1_this0_posts_connect_mutateMeta + tmp2_this0_posts_connect_mutateMeta) as this0_posts_connect_mutateMeta
            }
            WITH this0, this0_mutateMeta + this0_posts_connect_mutateMeta as this0_mutateMeta
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"123\\",
                \\"this0_name\\": \\"Bob\\",
                \\"this0_password\\": \\"password\\",
                \\"this0_posts_connect0_node_auth_where0_creator_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:User)
            SET this0.id = $this0_id
            SET this0.name = $this0_name
            SET this0.password = $this0_password
            WITH this0, [ metaVal IN [{type: 'Created', name: 'User', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta
            CALL {
            WITH this0, this0_mutateMeta
            	OPTIONAL MATCH (this0_posts_connect0_node:Post)
            	WHERE this0_posts_connect0_node.id = $this0_posts_connect0_node_id AND EXISTS((this0_posts_connect0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this0_posts_connect0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this0_posts_connect0_node_auth_where0_creator_id)
            CALL apoc.do.when(this0_posts_connect0_node IS NOT NULL AND this0 IS NOT NULL, \\"
            			MERGE (this0)-[:HAS_POST]->(this0_posts_connect0_node)
            RETURN this0, this0_posts_connect0_node, [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_POST', toName: 'Post', id: id(this0), toID: id(this0_posts_connect0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_posts_connect0_node_mutateMeta
            \\", \\"\\", {this0:this0, this0_posts_connect0_node:this0_posts_connect0_node})
            YIELD value
            WITH this0, this0_posts_connect0_node, value.this0_posts_connect0_node_mutateMeta as this0_posts_connect_mutateMeta
            RETURN REDUCE(tmp1_this0_posts_connect_mutateMeta = [], tmp2_this0_posts_connect_mutateMeta IN COLLECT(this0_posts_connect_mutateMeta) | tmp1_this0_posts_connect_mutateMeta + tmp2_this0_posts_connect_mutateMeta) as this0_posts_connect_mutateMeta
            }
            WITH this0, this0_mutateMeta + this0_posts_connect_mutateMeta as this0_mutateMeta
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"123\\",
                \\"this0_name\\": \\"Bob\\",
                \\"this0_password\\": \\"password\\",
                \\"this0_posts_connect0_node_id\\": \\"post-id\\",
                \\"this0_posts_connect0_node_auth_where0_creator_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            	OPTIONAL MATCH (this_posts0_connect0_node:Post)
            	WHERE EXISTS((this_posts0_connect0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0_connect0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_connect0_node_auth_where0_creator_id)
            CALL apoc.do.when(this_posts0_connect0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)-[:HAS_POST]->(this_posts0_connect0_node)
            RETURN this, this_posts0_connect0_node, [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_POST', toName: 'Post', id: id(this), toID: id(this_posts0_connect0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_posts0_connect0_node_mutateMeta
            \\", \\"\\", {this:this, this_posts0_connect0_node:this_posts0_connect0_node})
            YIELD value
            WITH this, this_posts0_connect0_node, value.this_posts0_connect0_node_mutateMeta as this_posts0_connect_mutateMeta
            RETURN REDUCE(tmp1_this_posts0_connect_mutateMeta = [], tmp2_this_posts0_connect_mutateMeta IN COLLECT(this_posts0_connect_mutateMeta) | tmp1_this_posts0_connect_mutateMeta + tmp2_this_posts0_connect_mutateMeta) as this_posts0_connect_mutateMeta
            }
            WITH this, this_posts0_connect_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_posts0_connect0_node_auth_where0_creator_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            	OPTIONAL MATCH (this_posts0_connect0_node:Post)
            	WHERE this_posts0_connect0_node.id = $this_posts0_connect0_node_id AND EXISTS((this_posts0_connect0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0_connect0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_connect0_node_auth_where0_creator_id)
            CALL apoc.do.when(this_posts0_connect0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)-[:HAS_POST]->(this_posts0_connect0_node)
            RETURN this, this_posts0_connect0_node, [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_POST', toName: 'Post', id: id(this), toID: id(this_posts0_connect0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_posts0_connect0_node_mutateMeta
            \\", \\"\\", {this:this, this_posts0_connect0_node:this_posts0_connect0_node})
            YIELD value
            WITH this, this_posts0_connect0_node, value.this_posts0_connect0_node_mutateMeta as this_posts0_connect_mutateMeta
            RETURN REDUCE(tmp1_this_posts0_connect_mutateMeta = [], tmp2_this_posts0_connect_mutateMeta IN COLLECT(this_posts0_connect_mutateMeta) | tmp1_this_posts0_connect_mutateMeta + tmp2_this_posts0_connect_mutateMeta) as this_posts0_connect_mutateMeta
            }
            WITH this, this_posts0_connect_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_posts0_connect0_node_id\\": \\"new-id\\",
                \\"this_posts0_connect0_node_auth_where0_creator_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            	OPTIONAL MATCH (this_connect_posts0_node:Post)
            	WHERE EXISTS((this_connect_posts0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_connect_posts0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_posts0_node_auth_where0_creator_id)
            CALL apoc.do.when(this_connect_posts0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)-[:HAS_POST]->(this_connect_posts0_node)
            RETURN this, this_connect_posts0_node, [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_POST', toName: 'Post', id: id(this), toID: id(this_connect_posts0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_connect_posts0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_posts0_node:this_connect_posts0_node})
            YIELD value
            WITH this, this_connect_posts0_node, value.this_connect_posts0_node_mutateMeta as this_connect_posts_mutateMeta
            RETURN REDUCE(tmp1_this_connect_posts_mutateMeta = [], tmp2_this_connect_posts_mutateMeta IN COLLECT(this_connect_posts_mutateMeta) | tmp1_this_connect_posts_mutateMeta + tmp2_this_connect_posts_mutateMeta) as this_connect_posts_mutateMeta
            }
            WITH this, this_connect_posts_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_connect_posts0_node_auth_where0_creator_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            	OPTIONAL MATCH (this_connect_posts0_node:Post)
            	WHERE this_connect_posts0_node.id = $this_connect_posts0_node_id AND EXISTS((this_connect_posts0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_connect_posts0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_posts0_node_auth_where0_creator_id)
            CALL apoc.do.when(this_connect_posts0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)-[:HAS_POST]->(this_connect_posts0_node)
            RETURN this, this_connect_posts0_node, [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_POST', toName: 'Post', id: id(this), toID: id(this_connect_posts0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_connect_posts0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_posts0_node:this_connect_posts0_node})
            YIELD value
            WITH this, this_connect_posts0_node, value.this_connect_posts0_node_mutateMeta as this_connect_posts_mutateMeta
            RETURN REDUCE(tmp1_this_connect_posts_mutateMeta = [], tmp2_this_connect_posts_mutateMeta IN COLLECT(this_connect_posts_mutateMeta) | tmp1_this_connect_posts_mutateMeta + tmp2_this_connect_posts_mutateMeta) as this_connect_posts_mutateMeta
            }
            WITH this, this_connect_posts_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_connect_posts0_node_id\\": \\"some-id\\",
                \\"this_connect_posts0_node_auth_where0_creator_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_posts0_disconnect0_rel:HAS_POST]->(this_posts0_disconnect0:Post)
            WHERE EXISTS((this_posts0_disconnect0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0_disconnect0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_disconnect0_auth_where0_creator_id)
            WITH this, this_posts0_disconnect0, this_posts0_disconnect0_rel, [ metaVal IN [{type: 'Disconnected', name: 'User', toName: 'Post', relationshipName: 'HAS_POST', id: id(this), toID: id(this_posts0_disconnect0), relationshipID: id(this_posts0_disconnect0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_mutateMeta
            FOREACH(_ IN CASE this_posts0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_posts0_disconnect0_rel
            )
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_posts0_disconnect0_auth_where0_creator_id\\": \\"id-01\\"
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_posts0_disconnect0_rel:HAS_POST]->(this_posts0_disconnect0:Post)
            WHERE this_posts0_disconnect0.id = $updateUsers.args.update.posts[0].disconnect[0].where.node.id AND EXISTS((this_posts0_disconnect0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_posts0_disconnect0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_disconnect0_auth_where0_creator_id)
            WITH this, this_posts0_disconnect0, this_posts0_disconnect0_rel, [ metaVal IN [{type: 'Disconnected', name: 'User', toName: 'Post', relationshipName: 'HAS_POST', id: id(this), toID: id(this_posts0_disconnect0), relationshipID: id(this_posts0_disconnect0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_mutateMeta
            FOREACH(_ IN CASE this_posts0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_posts0_disconnect0_rel
            )
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_posts0_disconnect0_auth_where0_creator_id\\": \\"id-01\\",
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
                }
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
            WHERE EXISTS((this_disconnect_posts0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_disconnect_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_posts0_auth_where0_creator_id)
            WITH this, this_disconnect_posts0, this_disconnect_posts0_rel, [ metaVal IN [{type: 'Disconnected', name: 'User', toName: 'Post', relationshipName: 'HAS_POST', id: id(this), toID: id(this_disconnect_posts0), relationshipID: id(this_disconnect_posts0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_mutateMeta
            FOREACH(_ IN CASE this_disconnect_posts0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_posts0_rel
            )
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_disconnect_posts0_auth_where0_creator_id\\": \\"id-01\\",
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
                }
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

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
            WHERE this_disconnect_posts0.id = $updateUsers.args.disconnect.posts[0].where.node.id AND EXISTS((this_disconnect_posts0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_disconnect_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_posts0_auth_where0_creator_id)
            WITH this, this_disconnect_posts0, this_disconnect_posts0_rel, [ metaVal IN [{type: 'Disconnected', name: 'User', toName: 'Post', relationshipName: 'HAS_POST', id: id(this), toID: id(this_disconnect_posts0), relationshipID: id(this_disconnect_posts0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_mutateMeta
            FOREACH(_ IN CASE this_disconnect_posts0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_posts0_rel
            )
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_disconnect_posts0_auth_where0_creator_id\\": \\"id-01\\",
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
                }
            }"
        `);
    });
});
