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
import { Neo4jGraphQL } from "../../../../../../../../src";
import { createJwtRequest } from "../../../../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../../../../utils/tck-test-utils";

describe("Cypher Auth Allow", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Comment {
                id: ID
                content: String
                creator: User @relationship(type: "HAS_COMMENT", direction: IN)
                post: Post @relationship(type: "HAS_COMMENT", direction: IN)
            }

            type Post {
                id: ID
                content: String
                creator: User @relationship(type: "HAS_POST", direction: IN)
                comments: [Comment] @relationship(type: "HAS_COMMENT", direction: OUT)
            }

            type User {
                id: ID
                name: String
                posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User
                @auth(rules: [{ operations: [READ, UPDATE, DELETE, DISCONNECT, CONNECT], allow: { id: "$jwt.sub" } }])

            extend type User {
                password: String! @auth(rules: [{ operations: [READ, UPDATE, DELETE], allow: { id: "$jwt.sub" } }])
            }

            extend type Post
                @auth(
                    rules: [
                        {
                            operations: [READ, UPDATE, DELETE, DISCONNECT, CONNECT]
                            allow: { creator: { id: "$jwt.sub" } }
                        }
                    ]
                )

            extend type Comment
                @auth(
                    rules: [
                        {
                            operations: [READ, UPDATE, DELETE, DISCONNECT, CONNECT]
                            allow: { creator: { id: "$jwt.sub" } }
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
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_allow0_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Read Node & Protected Field", async () => {
        const query = gql`
            {
                users {
                    password
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_password_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .password } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_password_auth_allow0_id\\": \\"id-01\\",
                \\"this_auth_allow0_id\\": \\"id-01\\"
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
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id, posts: [ (this)-[:HAS_POST]->(this_posts:Post)  WHERE apoc.util.validatePredicate(NOT(EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) | this_posts { .content } ] } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_posts_auth_allow0_creator_id\\": \\"id-01\\",
                \\"this_auth_allow0_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Read Relationship & Protected Field", async () => {
        const query = gql`
            {
                posts {
                    creator {
                        password
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { creator: head([ (this)<-[:HAS_POST]-(this_creator:User)  WHERE apoc.util.validatePredicate(NOT(this_creator.id IS NOT NULL AND this_creator.id = $this_creator_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT(this_creator.id IS NOT NULL AND this_creator.id = $this_creator_password_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0]) | this_creator { .password } ]) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_creator_password_auth_allow0_id\\": \\"id-01\\",
                \\"this_creator_auth_allow0_id\\": \\"id-01\\",
                \\"this_auth_allow0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Read Two Relationships", async () => {
        const query = gql`
            {
                users(where: { id: "1" }) {
                    id
                    posts(where: { id: "1" }) {
                        comments(where: { id: "1" }) {
                            content
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
            WHERE this.id = $this_id
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id, posts: [ (this)-[:HAS_POST]->(this_posts:Post)  WHERE this_posts.id = $this_posts_id AND apoc.util.validatePredicate(NOT(EXISTS((this_posts)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) | this_posts { comments: [ (this_posts)-[:HAS_COMMENT]->(this_posts_comments:Comment)  WHERE this_posts_comments.id = $this_posts_comments_id AND apoc.util.validatePredicate(NOT(EXISTS((this_posts_comments)<-[:HAS_COMMENT]-(:User)) AND ANY(creator IN [(this_posts_comments)<-[:HAS_COMMENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts_comments_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) | this_posts_comments { .content } ] } ] } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_posts_comments_id\\": \\"1\\",
                \\"this_posts_comments_auth_allow0_creator_id\\": \\"id-01\\",
                \\"this_posts_id\\": \\"1\\",
                \\"this_posts_auth_allow0_creator_id\\": \\"id-01\\",
                \\"this_id\\": \\"1\\",
                \\"this_auth_allow0_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Update Node", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { id: "old-id" }, update: { id: "new-id" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "old-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $this_id
            WITH this
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.id = $this_update_id
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"old-id\\",
                \\"this_update_id\\": \\"new-id\\",
                \\"this_auth_allow0_id\\": \\"old-id\\"
            }"
        `);
    });

    test("Update Node Property", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { id: "id-01" }, update: { password: "new-password" }) {
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
            WHERE this.id = $this_id
            WITH this
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id AND this.id IS NOT NULL AND this.id = $this_update_password_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.password = $this_update_password
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"id-01\\",
                \\"this_update_password\\": \\"new-password\\",
                \\"this_update_password_auth_allow0_id\\": \\"id-01\\",
                \\"this_auth_allow0_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Nested Update Node", async () => {
        const query = gql`
            mutation {
                updatePosts(where: { id: "post-id" }, update: { creator: { update: { node: { id: "new-id" } } } }) {
                    posts {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE this.id = $this_id
            WITH this
            CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            OPTIONAL MATCH (this)<-[this_has_post0_relationship:HAS_POST]-(this_creator0:User)
            CALL apoc.do.when(this_creator0 IS NOT NULL, \\"
            WITH this, this_creator0
            CALL apoc.util.validate(NOT(this_creator0.id IS NOT NULL AND this_creator0.id = $this_creator0_auth_allow0_id), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            SET this_creator0.id = $this_update_creator0_id
            RETURN count(*)
            \\", \\"\\", {this:this, updatePosts: $updatePosts, this_creator0:this_creator0, auth:$auth,this_update_creator0_id:$this_update_creator0_id,this_creator0_auth_allow0_id:$this_creator0_auth_allow0_id})
            YIELD value as _
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"post-id\\",
                \\"this_update_creator0_id\\": \\"new-id\\",
                \\"this_creator0_auth_allow0_id\\": \\"user-id\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"user-id\\"
                    }
                },
                \\"this_auth_allow0_creator_id\\": \\"user-id\\",
                \\"updatePosts\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"creator\\": {
                                \\"update\\": {
                                    \\"node\\": {
                                        \\"id\\": \\"new-id\\"
                                    }
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Nested Update Property", async () => {
        const query = gql`
            mutation {
                updatePosts(
                    where: { id: "post-id" }
                    update: { creator: { update: { node: { password: "new-password" } } } }
                ) {
                    posts {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE this.id = $this_id
            WITH this
            CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            OPTIONAL MATCH (this)<-[this_has_post0_relationship:HAS_POST]-(this_creator0:User)
            CALL apoc.do.when(this_creator0 IS NOT NULL, \\"
            WITH this, this_creator0
            CALL apoc.util.validate(NOT(this_creator0.id IS NOT NULL AND this_creator0.id = $this_creator0_auth_allow0_id AND this_creator0.id IS NOT NULL AND this_creator0.id = $this_update_creator0_password_auth_allow0_id), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            SET this_creator0.password = $this_update_creator0_password
            RETURN count(*)
            \\", \\"\\", {this:this, updatePosts: $updatePosts, this_creator0:this_creator0, auth:$auth,this_update_creator0_password:$this_update_creator0_password,this_update_creator0_password_auth_allow0_id:$this_update_creator0_password_auth_allow0_id,this_creator0_auth_allow0_id:$this_creator0_auth_allow0_id})
            YIELD value as _
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"post-id\\",
                \\"this_update_creator0_password\\": \\"new-password\\",
                \\"this_update_creator0_password_auth_allow0_id\\": \\"user-id\\",
                \\"this_creator0_auth_allow0_id\\": \\"user-id\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"user-id\\"
                    }
                },
                \\"this_auth_allow0_creator_id\\": \\"user-id\\",
                \\"updatePosts\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"creator\\": {
                                \\"update\\": {
                                    \\"node\\": {
                                        \\"password\\": \\"new-password\\"
                                    }
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Delete Node", async () => {
        const query = gql`
            mutation {
                deleteUsers(where: { id: "user-id" }) {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $this_id
            WITH this
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"user-id\\",
                \\"this_auth_allow0_id\\": \\"user-id\\"
            }"
        `);
    });

    test("Nested Delete Node", async () => {
        const query = gql`
            mutation {
                deleteUsers(where: { id: "user-id" }, delete: { posts: { where: { node: { id: "post-id" } } } }) {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $this_id
            WITH this
            OPTIONAL MATCH (this)-[this_posts0_relationship:HAS_POST]->(this_posts0:Post)
            WHERE this_posts0.id = $this_deleteUsers.args.delete.posts[0].where.node.id
            WITH this, this_posts0
            CALL apoc.util.validate(NOT(EXISTS((this_posts0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_posts0_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this, collect(DISTINCT this_posts0) as this_posts0_to_delete
            FOREACH(x IN this_posts0_to_delete | DETACH DELETE x)
            WITH this
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"user-id\\",
                \\"this_auth_allow0_id\\": \\"user-id\\",
                \\"this_deleteUsers\\": {
                    \\"args\\": {
                        \\"delete\\": {
                            \\"posts\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"id\\": \\"post-id\\"
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"this_posts0_auth_allow0_creator_id\\": \\"user-id\\"
            }"
        `);
    });

    test("Disconnect Node", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { id: "user-id" }, disconnect: { posts: { where: { node: { id: "post-id" } } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $this_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
            WHERE this_disconnect_posts0.id = $updateUsers.args.disconnect.posts[0].where.node.id
            WITH this, this_disconnect_posts0, this_disconnect_posts0_rel
            CALL apoc.util.validate(NOT(this_disconnect_posts0.id IS NOT NULL AND this_disconnect_posts0.id = $this_disconnect_posts0User0_allow_auth_allow0_id AND EXISTS((this_disconnect_posts0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_disconnect_posts0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_posts0Post1_allow_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE this_disconnect_posts0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_posts0_rel
            )
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"user-id\\",
                \\"this_disconnect_posts0User0_allow_auth_allow0_id\\": \\"user-id\\",
                \\"this_disconnect_posts0Post1_allow_auth_allow0_creator_id\\": \\"user-id\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"posts\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"id\\": \\"post-id\\"
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

    test("Nested Disconnect Node", async () => {
        const query = gql`
            mutation {
                updateComments(
                    where: { id: "comment-id" }
                    update: {
                        post: { disconnect: { disconnect: { creator: { where: { node: { id: "user-id" } } } } } }
                    }
                ) {
                    comments {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Comment)
            WHERE this.id = $this_id
            WITH this
            CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_COMMENT]-(:User)) AND ANY(creator IN [(this)<-[:HAS_COMMENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_post0_disconnect0_rel:HAS_COMMENT]-(this_post0_disconnect0:Post)
            WITH this, this_post0_disconnect0, this_post0_disconnect0_rel
            CALL apoc.util.validate(NOT(EXISTS((this_post0_disconnect0)<-[:HAS_COMMENT]-(:User)) AND ANY(creator IN [(this_post0_disconnect0)<-[:HAS_COMMENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post0_disconnect0Comment0_allow_auth_allow0_creator_id) AND EXISTS((this_post0_disconnect0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_post0_disconnect0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post0_disconnect0Post1_allow_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE this_post0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_post0_disconnect0_rel
            )
            WITH this, this_post0_disconnect0
            CALL {
            WITH this, this_post0_disconnect0
            OPTIONAL MATCH (this_post0_disconnect0)<-[this_post0_disconnect0_creator0_rel:HAS_POST]-(this_post0_disconnect0_creator0:User)
            WHERE this_post0_disconnect0_creator0.id = $updateComments.args.update.post.disconnect.disconnect.creator.where.node.id
            WITH this, this_post0_disconnect0, this_post0_disconnect0_creator0, this_post0_disconnect0_creator0_rel
            CALL apoc.util.validate(NOT(EXISTS((this_post0_disconnect0_creator0)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_post0_disconnect0_creator0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_post0_disconnect0_creator0Post0_allow_auth_allow0_creator_id) AND this_post0_disconnect0_creator0.id IS NOT NULL AND this_post0_disconnect0_creator0.id = $this_post0_disconnect0_creator0User1_allow_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE this_post0_disconnect0_creator0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_post0_disconnect0_creator0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"comment-id\\",
                \\"this_post0_disconnect0Comment0_allow_auth_allow0_creator_id\\": \\"user-id\\",
                \\"this_post0_disconnect0Post1_allow_auth_allow0_creator_id\\": \\"user-id\\",
                \\"this_post0_disconnect0_creator0Post0_allow_auth_allow0_creator_id\\": \\"user-id\\",
                \\"this_post0_disconnect0_creator0User1_allow_auth_allow0_id\\": \\"user-id\\",
                \\"this_auth_allow0_creator_id\\": \\"user-id\\",
                \\"updateComments\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"post\\": {
                                \\"disconnect\\": {
                                    \\"disconnect\\": {
                                        \\"creator\\": {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"id\\": \\"user-id\\"
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Connect Node", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { id: "user-id" }, connect: { posts: { where: { node: { id: "post-id" } } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $this_id
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_posts0_node:Post)
            	WHERE this_connect_posts0_node.id = $this_connect_posts0_node_id
            	WITH this, this_connect_posts0_node
            	CALL apoc.util.validate(NOT(this_connect_posts0_node.id IS NOT NULL AND this_connect_posts0_node.id = $this_connect_posts0_nodeUser0_allow_auth_allow0_id AND EXISTS((this_connect_posts0_node)<-[:HAS_POST]-(:User)) AND ANY(creator IN [(this_connect_posts0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_posts0_nodePost1_allow_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_posts0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:HAS_POST]->(this_connect_posts0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"user-id\\",
                \\"this_connect_posts0_node_id\\": \\"post-id\\",
                \\"this_connect_posts0_nodeUser0_allow_auth_allow0_id\\": \\"user-id\\",
                \\"this_connect_posts0_nodePost1_allow_auth_allow0_creator_id\\": \\"user-id\\"
            }"
        `);
    });
});
