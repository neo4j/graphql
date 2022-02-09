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
import { createJwtRequest } from "../../../../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../../../../utils/tck-test-utils";

describe("@auth allow with interface relationships", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Content
                @auth(
                    rules: [
                        {
                            operations: [READ, UPDATE, DELETE, DISCONNECT, CONNECT]
                            allow: { creator: { id: "$jwt.sub" } }
                        }
                    ]
                ) {
                id: ID
                content: String
                creator: User! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type Comment implements Content {
                id: ID
                content: String
                creator: User!
                post: Post! @relationship(type: "HAS_COMMENT", direction: IN)
            }

            type Post implements Content {
                id: ID
                content: String
                creator: User!
                comments: [Comment!]! @relationship(type: "HAS_COMMENT", direction: OUT)
            }

            type User {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            extend type User
                @auth(rules: [{ operations: [READ, UPDATE, DELETE, DISCONNECT, CONNECT], allow: { id: "$jwt.sub" } }])

            extend type User {
                password: String! @auth(rules: [{ operations: [READ, UPDATE, DELETE], allow: { id: "$jwt.sub" } }])
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("read allow protected interface relationship", async () => {
        const query = gql`
            {
                users {
                    id
                    content {
                        id
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
            WITH this
            CALL {
            WITH this
            MATCH (this)-[:HAS_CONTENT]->(this_Comment:Comment)
            CALL apoc.util.validate(NOT(EXISTS((this_Comment)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_Comment)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Comment_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { __resolveType: \\"Comment\\", id: this_Comment.id, content: this_Comment.content } AS content
            UNION
            WITH this
            MATCH (this)-[:HAS_CONTENT]->(this_Post:Post)
            CALL apoc.util.validate(NOT(EXISTS((this_Post)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_Post)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { __resolveType: \\"Post\\", id: this_Post.id, content: this_Post.content } AS content
            }
            RETURN this { .id, content: collect(content) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_Comment_auth_allow0_creator_id\\": \\"id-01\\",
                \\"this_Post_auth_allow0_creator_id\\": \\"id-01\\",
                \\"this_auth_allow0_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Read Two Relationships", async () => {
        const query = gql`
            {
                users(where: { id: "1" }) {
                    id
                    content(where: { id: "1" }) {
                        ... on Post {
                            comments(where: { id: "1" }) {
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
            WHERE this.id = $this_id
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            WITH this
            MATCH (this)-[:HAS_CONTENT]->(this_Comment:Comment)
            CALL apoc.util.validate(NOT(EXISTS((this_Comment)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_Comment)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Comment_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WHERE this_Comment.id = $this_content.args.where.id
            RETURN { __resolveType: \\"Comment\\" } AS content
            UNION
            WITH this
            MATCH (this)-[:HAS_CONTENT]->(this_Post:Post)
            CALL apoc.util.validate(NOT(EXISTS((this_Post)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_Post)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WHERE this_Post.id = $this_content.args.where.id
            RETURN { __resolveType: \\"Post\\", comments: [ (this_Post)-[:HAS_COMMENT]->(this_Post_comments:Comment)  WHERE this_Post_comments.id = $this_Post_comments_id AND apoc.util.validatePredicate(NOT(EXISTS((this_Post_comments)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_Post_comments)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_comments_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) | this_Post_comments { .content } ] } AS content
            }
            RETURN this { .id, content: collect(content) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_Comment_auth_allow0_creator_id\\": \\"id-01\\",
                \\"this_Post_auth_allow0_creator_id\\": \\"id-01\\",
                \\"this_Post_comments_id\\": \\"1\\",
                \\"this_Post_comments_auth_allow0_creator_id\\": \\"id-01\\",
                \\"this_content\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"id\\": \\"1\\"
                        }
                    }
                },
                \\"this_auth_allow0_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Nested Update Node", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { id: "user-id" }, update: { content: { update: { node: { id: "new-id" } } } }) {
                    users {
                        id
                        content {
                            id
                        }
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
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_allow0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Comment)
            CALL apoc.do.when(this_content0 IS NOT NULL, \\"
            WITH this, this_content0
            CALL apoc.util.validate(NOT(EXISTS((this_content0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content0_auth_allow0_creator_id)), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            SET this_content0.id = $this_update_content0_id
            WITH this, this_content0
            CALL {
            	WITH this_content0
            	MATCH (this_content0)<-[this_content0_creator_User_unique:HAS_CONTENT]-(:User)
            	WITH count(this_content0_creator_User_unique) as c
            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.creator required', [0])
            	RETURN c AS this_content0_creator_User_unique_ignored
            }
            CALL {
            	WITH this_content0
            	MATCH (this_content0)<-[this_content0_post_Post_unique:HAS_COMMENT]-(:Post)
            	WITH count(this_content0_post_Post_unique) as c
            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.post required', [0])
            	RETURN c AS this_content0_post_Post_unique_ignored
            }
            RETURN count(*)
            \\", \\"\\", {this:this, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_id:$this_update_content0_id,this_content0_auth_allow0_creator_id:$this_content0_auth_allow0_creator_id})
            YIELD value as _
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Post)
            CALL apoc.do.when(this_content0 IS NOT NULL, \\"
            WITH this, this_content0
            CALL apoc.util.validate(NOT(EXISTS((this_content0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content0_auth_allow0_creator_id)), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            SET this_content0.id = $this_update_content0_id
            WITH this, this_content0
            CALL {
            	WITH this_content0
            	MATCH (this_content0)<-[this_content0_creator_User_unique:HAS_CONTENT]-(:User)
            	WITH count(this_content0_creator_User_unique) as c
            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required', [0])
            	RETURN c AS this_content0_creator_User_unique_ignored
            }
            RETURN count(*)
            \\", \\"\\", {this:this, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_id:$this_update_content0_id,this_content0_auth_allow0_creator_id:$this_content0_auth_allow0_creator_id})
            YIELD value as _
            RETURN count(*)
            }
            WITH this
            CALL {
            WITH this
            MATCH (this)-[:HAS_CONTENT]->(this_Comment:Comment)
            CALL apoc.util.validate(NOT(EXISTS((this_Comment)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_Comment)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Comment_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { __resolveType: \\"Comment\\", id: this_Comment.id } AS content
            UNION
            WITH this
            MATCH (this)-[:HAS_CONTENT]->(this_Post:Post)
            CALL apoc.util.validate(NOT(EXISTS((this_Post)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_Post)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN { __resolveType: \\"Post\\", id: this_Post.id } AS content
            }
            RETURN this { .id, content: collect(content) } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"user-id\\",
                \\"this_update_content0_id\\": \\"new-id\\",
                \\"this_content0_auth_allow0_creator_id\\": \\"user-id\\",
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
                \\"this_auth_allow0_id\\": \\"user-id\\",
                \\"this_Comment_auth_allow0_creator_id\\": \\"user-id\\",
                \\"this_Post_auth_allow0_creator_id\\": \\"user-id\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"content\\": [
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
            CALL apoc.util.validate(NOT(EXISTS((this)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            OPTIONAL MATCH (this)<-[this_has_content0_relationship:HAS_CONTENT]-(this_creator0:User)
            CALL apoc.do.when(this_creator0 IS NOT NULL, \\"
            WITH this, this_creator0
            CALL apoc.util.validate(NOT(this_creator0.id IS NOT NULL AND this_creator0.id = $this_creator0_auth_allow0_id AND this_creator0.id IS NOT NULL AND this_creator0.id = $this_update_creator0_password_auth_allow0_id), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            SET this_creator0.password = $this_update_creator0_password
            RETURN count(*)
            \\", \\"\\", {this:this, updatePosts: $updatePosts, this_creator0:this_creator0, auth:$auth,this_update_creator0_password:$this_update_creator0_password,this_update_creator0_password_auth_allow0_id:$this_update_creator0_password_auth_allow0_id,this_creator0_auth_allow0_id:$this_creator0_auth_allow0_id})
            YIELD value as _
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_creator_User_unique:HAS_CONTENT]-(:User)
            	WITH count(this_creator_User_unique) as c
            	CALL apoc.util.validate(NOT(c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required', [0])
            	RETURN c AS this_creator_User_unique_ignored
            }
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

    test("Nested Delete Node", async () => {
        const query = gql`
            mutation {
                deleteUsers(where: { id: "user-id" }, delete: { content: { where: { node: { id: "post-id" } } } }) {
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
            OPTIONAL MATCH (this)-[this_content_Comment0_relationship:HAS_CONTENT]->(this_content_Comment0:Comment)
            WHERE this_content_Comment0.id = $this_deleteUsers.args.delete.content[0].where.node.id
            WITH this, this_content_Comment0
            CALL apoc.util.validate(NOT(EXISTS((this_content_Comment0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_content_Comment0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content_Comment0_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this, collect(DISTINCT this_content_Comment0) as this_content_Comment0_to_delete
            FOREACH(x IN this_content_Comment0_to_delete | DETACH DELETE x)
            WITH this
            OPTIONAL MATCH (this)-[this_content_Post0_relationship:HAS_CONTENT]->(this_content_Post0:Post)
            WHERE this_content_Post0.id = $this_deleteUsers.args.delete.content[0].where.node.id
            WITH this, this_content_Post0
            CALL apoc.util.validate(NOT(EXISTS((this_content_Post0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_content_Post0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content_Post0_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this, collect(DISTINCT this_content_Post0) as this_content_Post0_to_delete
            FOREACH(x IN this_content_Post0_to_delete | DETACH DELETE x)
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
                            \\"content\\": [
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
                \\"this_content_Comment0_auth_allow0_creator_id\\": \\"user-id\\",
                \\"this_content_Post0_auth_allow0_creator_id\\": \\"user-id\\"
            }"
        `);
    });

    test("Disconnect Node", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { id: "user-id" }, disconnect: { content: { where: { node: { id: "post-id" } } } }) {
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
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
            WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT(this_disconnect_content0.id IS NOT NULL AND this_disconnect_content0.id = $this_disconnect_content0User0_allow_auth_allow0_id AND EXISTS((this_disconnect_content0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0Comment1_allow_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
            )
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT(this_disconnect_content0.id IS NOT NULL AND this_disconnect_content0.id = $this_disconnect_content0User0_allow_auth_allow0_id AND EXISTS((this_disconnect_content0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0Post1_allow_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
            )
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"user-id\\",
                \\"this_disconnect_content0User0_allow_auth_allow0_id\\": \\"user-id\\",
                \\"this_disconnect_content0Comment1_allow_auth_allow0_creator_id\\": \\"user-id\\",
                \\"this_disconnect_content0Post1_allow_auth_allow0_creator_id\\": \\"user-id\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"content\\": [
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
                updateUsers(
                    where: { id: "user-id" }
                    disconnect: {
                        content: [
                            {
                                where: { node: { id: "post-id" } }
                                disconnect: { _on: { Post: [{ comments: { where: { node: { id: "comment-id" } } } }] } }
                            }
                        ]
                    }
                ) {
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
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
            WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT(this_disconnect_content0.id IS NOT NULL AND this_disconnect_content0.id = $this_disconnect_content0User0_allow_auth_allow0_id AND EXISTS((this_disconnect_content0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0Comment1_allow_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
            )
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT(this_disconnect_content0.id IS NOT NULL AND this_disconnect_content0.id = $this_disconnect_content0User0_allow_auth_allow0_id AND EXISTS((this_disconnect_content0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0Post1_allow_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
            )
            WITH this, this_disconnect_content0
            CALL {
            WITH this, this_disconnect_content0
            OPTIONAL MATCH (this_disconnect_content0)-[this_disconnect_content0_comments0_rel:HAS_COMMENT]->(this_disconnect_content0_comments0:Comment)
            WHERE this_disconnect_content0_comments0.id = $updateUsers.args.disconnect.content[0].disconnect._on.Post[0].comments[0].where.node.id
            WITH this, this_disconnect_content0, this_disconnect_content0_comments0, this_disconnect_content0_comments0_rel
            CALL apoc.util.validate(NOT(EXISTS((this_disconnect_content0_comments0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_disconnect_content0_comments0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0_comments0Post0_allow_auth_allow0_creator_id) AND EXISTS((this_disconnect_content0_comments0)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_disconnect_content0_comments0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0_comments0Comment1_allow_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE this_disconnect_content0_comments0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_comments0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"user-id\\",
                \\"this_disconnect_content0User0_allow_auth_allow0_id\\": \\"user-id\\",
                \\"this_disconnect_content0Comment1_allow_auth_allow0_creator_id\\": \\"user-id\\",
                \\"this_disconnect_content0Post1_allow_auth_allow0_creator_id\\": \\"user-id\\",
                \\"this_disconnect_content0_comments0Post0_allow_auth_allow0_creator_id\\": \\"user-id\\",
                \\"this_disconnect_content0_comments0Comment1_allow_auth_allow0_creator_id\\": \\"user-id\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"content\\": [
                                {
                                    \\"disconnect\\": {
                                        \\"_on\\": {
                                            \\"Post\\": [
                                                {
                                                    \\"comments\\": [
                                                        {
                                                            \\"where\\": {
                                                                \\"node\\": {
                                                                    \\"id\\": \\"comment-id\\"
                                                                }
                                                            }
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    },
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

    test("Connect Node", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { id: "user-id" }, connect: { content: { where: { node: { id: "post-id" } } } }) {
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
            	OPTIONAL MATCH (this_connect_content0_node:Comment)
            	WHERE this_connect_content0_node.id = $this_connect_content0_node_id
            	WITH this, this_connect_content0_node
            	CALL apoc.util.validate(NOT(this_connect_content0_node.id IS NOT NULL AND this_connect_content0_node.id = $this_connect_content0_nodeUser0_allow_auth_allow0_id AND EXISTS((this_connect_content0_node)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_connect_content0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_content0_nodeComment1_allow_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_content0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            		)
            	)
            	RETURN count(*)
            UNION
            	WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Post)
            	WHERE this_connect_content0_node.id = $this_connect_content0_node_id
            	WITH this, this_connect_content0_node
            	CALL apoc.util.validate(NOT(this_connect_content0_node.id IS NOT NULL AND this_connect_content0_node.id = $this_connect_content0_nodeUser0_allow_auth_allow0_id AND EXISTS((this_connect_content0_node)<-[:HAS_CONTENT]-(:User)) AND ANY(creator IN [(this_connect_content0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_content0_nodePost1_allow_auth_allow0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_content0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"user-id\\",
                \\"this_connect_content0_node_id\\": \\"post-id\\",
                \\"this_connect_content0_nodeUser0_allow_auth_allow0_id\\": \\"user-id\\",
                \\"this_connect_content0_nodeComment1_allow_auth_allow0_creator_id\\": \\"user-id\\",
                \\"this_connect_content0_nodePost1_allow_auth_allow0_creator_id\\": \\"user-id\\"
            }"
        `);
    });
});
