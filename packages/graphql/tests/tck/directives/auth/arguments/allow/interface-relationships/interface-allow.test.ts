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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../../../src";
import { createJwtRequest } from "../../../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../../../utils/tck-test-utils";

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
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
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
            "MATCH (this:\`User\`)
            WHERE apoc.util.validatePredicate(NOT ((this.id IS NOT NULL AND this.id = $param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL {
            WITH *
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_CONTENT]->(this_Comment:\`Comment\`)
                WHERE apoc.util.validatePredicate(NOT ((exists((this_Comment)<-[:HAS_CONTENT]-(:\`User\`)) AND any(this1 IN [(this_Comment)<-[:HAS_CONTENT]-(this1:\`User\`) | this1] WHERE (this1.id IS NOT NULL AND this1.id = $param1)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN { __resolveType: \\"Comment\\", id: this_Comment.id, content: this_Comment.content } AS this_content
                UNION
                WITH this
                MATCH (this)-[this2:HAS_CONTENT]->(this_Post:\`Post\`)
                WHERE apoc.util.validatePredicate(NOT ((exists((this_Post)<-[:HAS_CONTENT]-(:\`User\`)) AND any(this3 IN [(this_Post)<-[:HAS_CONTENT]-(this3:\`User\`) | this3] WHERE (this3.id IS NOT NULL AND this3.id = $param2)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN { __resolveType: \\"Post\\", id: this_Post.id, content: this_Post.content } AS this_content
            }
            RETURN collect(this_content) AS this_content
            }
            RETURN this { .id, content: this_content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id-01\\",
                \\"param1\\": \\"id-01\\",
                \\"param2\\": \\"id-01\\"
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
            "MATCH (this:\`User\`)
            WHERE (this.id = $param0 AND apoc.util.validatePredicate(NOT ((this.id IS NOT NULL AND this.id = $param1)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            WITH *
            CALL {
            WITH *
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_CONTENT]->(this_Comment:\`Comment\`)
                WHERE (apoc.util.validatePredicate(NOT ((exists((this_Comment)<-[:HAS_CONTENT]-(:\`User\`)) AND any(this1 IN [(this_Comment)<-[:HAS_CONTENT]-(this1:\`User\`) | this1] WHERE (this1.id IS NOT NULL AND this1.id = $param2)))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND this_Comment.id = $param3)
                RETURN { __resolveType: \\"Comment\\" } AS this_content
                UNION
                WITH this
                MATCH (this)-[this2:HAS_CONTENT]->(this_Post:\`Post\`)
                WHERE (apoc.util.validatePredicate(NOT ((exists((this_Post)<-[:HAS_CONTENT]-(:\`User\`)) AND any(this3 IN [(this_Post)<-[:HAS_CONTENT]-(this3:\`User\`) | this3] WHERE (this3.id IS NOT NULL AND this3.id = $param4)))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND this_Post.id = $param5)
                CALL {
                    WITH this_Post
                    MATCH (this_Post)-[this4:HAS_COMMENT]->(this_Post_comments:\`Comment\`)
                    WHERE (this_Post_comments.id = $param6 AND apoc.util.validatePredicate(NOT ((exists((this_Post_comments)<-[:HAS_CONTENT]-(:\`User\`)) AND any(this5 IN [(this_Post_comments)<-[:HAS_CONTENT]-(this5:\`User\`) | this5] WHERE (this5.id IS NOT NULL AND this5.id = $param7)))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    WITH this_Post_comments { .content } AS this_Post_comments
                    RETURN collect(this_Post_comments) AS this_Post_comments
                }
                RETURN { __resolveType: \\"Post\\", comments: this_Post_comments } AS this_content
            }
            RETURN collect(this_content) AS this_content
            }
            RETURN this { .id, content: this_content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"id-01\\",
                \\"param2\\": \\"id-01\\",
                \\"param3\\": \\"1\\",
                \\"param4\\": \\"id-01\\",
                \\"param5\\": \\"1\\",
                \\"param6\\": \\"1\\",
                \\"param7\\": \\"id-01\\"
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH this
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            	 WITH this
            WITH this
            OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Comment)
            CALL apoc.do.when(this_content0 IS NOT NULL, \\"
            WITH this, this_content0
            CALL apoc.util.validate(NOT ((exists((this_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0auth_param0)))), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            SET this_content0.id = $this_update_content0_id
            WITH this, this_content0
            CALL {
            	WITH this_content0
            	MATCH (this_content0)<-[this_content0_creator_User_unique:HAS_CONTENT]-(:User)
            	WITH count(this_content0_creator_User_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.creator required', [0])
            	RETURN c AS this_content0_creator_User_unique_ignored
            }
            CALL {
            	WITH this_content0
            	MATCH (this_content0)<-[this_content0_post_Post_unique:HAS_COMMENT]-(:Post)
            	WITH count(this_content0_post_Post_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.post required', [0])
            	RETURN c AS this_content0_post_Post_unique_ignored
            }
            RETURN count(*) AS _
            \\", \\"\\", {this:this, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_id:$this_update_content0_id,this_content0auth_param0:$this_content0auth_param0})
            YIELD value AS _
            RETURN count(*) AS update_this_Comment
            }
            CALL {
            	 WITH this
            	WITH this
            OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Post)
            CALL apoc.do.when(this_content0 IS NOT NULL, \\"
            WITH this, this_content0
            CALL apoc.util.validate(NOT ((exists((this_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0auth_param0)))), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            SET this_content0.id = $this_update_content0_id
            WITH this, this_content0
            CALL {
            	WITH this_content0
            	MATCH (this_content0)<-[this_content0_creator_User_unique:HAS_CONTENT]-(:User)
            	WITH count(this_content0_creator_User_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required', [0])
            	RETURN c AS this_content0_creator_User_unique_ignored
            }
            RETURN count(*) AS _
            \\", \\"\\", {this:this, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_id:$this_update_content0_id,this_content0auth_param0:$this_content0auth_param0})
            YIELD value AS _
            RETURN count(*) AS update_this_Post
            }
            WITH *
            WITH *
            CALL {
            WITH *
            CALL {
                WITH this
                MATCH (this)-[update_this0:HAS_CONTENT]->(this_Comment:\`Comment\`)
                WHERE apoc.util.validatePredicate(NOT ((exists((this_Comment)<-[:HAS_CONTENT]-(:\`User\`)) AND any(update_this1 IN [(this_Comment)<-[:HAS_CONTENT]-(update_this1:\`User\`) | update_this1] WHERE (update_this1.id IS NOT NULL AND update_this1.id = $update_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN { __resolveType: \\"Comment\\", id: this_Comment.id } AS this_content
                UNION
                WITH this
                MATCH (this)-[update_this2:HAS_CONTENT]->(this_Post:\`Post\`)
                WHERE apoc.util.validatePredicate(NOT ((exists((this_Post)<-[:HAS_CONTENT]-(:\`User\`)) AND any(update_this3 IN [(this_Post)<-[:HAS_CONTENT]-(update_this3:\`User\`) | update_this3] WHERE (update_this3.id IS NOT NULL AND update_this3.id = $update_param1)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN { __resolveType: \\"Post\\", id: this_Post.id } AS this_content
            }
            RETURN collect(this_content) AS this_content
            }
            RETURN collect(DISTINCT this { .id, content: this_content }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"update_param0\\": \\"user-id\\",
                \\"update_param1\\": \\"user-id\\",
                \\"param0\\": \\"user-id\\",
                \\"this_update_content0_id\\": \\"new-id\\",
                \\"this_content0auth_param0\\": \\"user-id\\",
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
                \\"thisauth_param0\\": \\"user-id\\",
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
                },
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`Post\`)
            WHERE this.id = $param0
            WITH this
            CALL apoc.util.validate(NOT ((exists((this)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $thisauth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            OPTIONAL MATCH (this)<-[this_has_content0_relationship:HAS_CONTENT]-(this_creator0:User)
            CALL apoc.do.when(this_creator0 IS NOT NULL, \\"
            WITH this, this_creator0
            CALL apoc.util.validate(NOT ((this_creator0.id IS NOT NULL AND this_creator0.id = $this_creator0auth_param0) AND (this_creator0.id IS NOT NULL AND this_creator0.id = $this_creator0auth_param0)), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            SET this_creator0.password = $this_update_creator0_password
            RETURN count(*) AS _
            \\", \\"\\", {this:this, updatePosts: $updatePosts, this_creator0:this_creator0, auth:$auth,this_update_creator0_password:$this_update_creator0_password,this_creator0auth_param0:$this_creator0auth_param0})
            YIELD value AS _
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_creator_User_unique:HAS_CONTENT]-(:User)
            	WITH count(this_creator_User_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required', [0])
            	RETURN c AS this_creator_User_unique_ignored
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"post-id\\",
                \\"this_update_creator0_password\\": \\"new-password\\",
                \\"this_creator0auth_param0\\": \\"user-id\\",
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
                \\"thisauth_param0\\": \\"user-id\\",
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
                },
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content_Comment0_relationship:HAS_CONTENT]->(this_content_Comment0:Comment)
            WHERE this_content_Comment0.id = $this_deleteUsers_args_delete_content0_where_Commentparam0
            WITH this, this_content_Comment0, this_content_Comment0_relationship
            CALL apoc.util.validate(NOT ((exists((this_content_Comment0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_content_Comment0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content_Comment0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this_content_Comment0_relationship, collect(DISTINCT this_content_Comment0) AS this_content_Comment0_to_delete
            CALL {
            	WITH this_content_Comment0_to_delete
            	UNWIND this_content_Comment0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            RETURN count(*) AS _this_content_Comment0_relationship
            }
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content_Post0_relationship:HAS_CONTENT]->(this_content_Post0:Post)
            WHERE this_content_Post0.id = $this_deleteUsers_args_delete_content0_where_Postparam0
            WITH this, this_content_Post0, this_content_Post0_relationship
            CALL apoc.util.validate(NOT ((exists((this_content_Post0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_content_Post0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content_Post0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this_content_Post0_relationship, collect(DISTINCT this_content_Post0) AS this_content_Post0_to_delete
            CALL {
            	WITH this_content_Post0_to_delete
            	UNWIND this_content_Post0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            RETURN count(*) AS _this_content_Post0_relationship
            }
            WITH this
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"thisauth_param0\\": \\"user-id\\",
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
                \\"this_deleteUsers_args_delete_content0_where_Commentparam0\\": \\"post-id\\",
                \\"this_content_Comment0auth_param0\\": \\"user-id\\",
                \\"this_deleteUsers_args_delete_content0_where_Postparam0\\": \\"post-id\\",
                \\"this_content_Post0auth_param0\\": \\"user-id\\"
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Commentparam0
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0) AND (exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Comment
            }
            CALL {
            	WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Postparam0
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0) AND (exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"updateUsers_args_disconnect_content0_where_Commentparam0\\": \\"post-id\\",
                \\"thisauth_param0\\": \\"user-id\\",
                \\"this_disconnect_content0auth_param0\\": \\"user-id\\",
                \\"updateUsers_args_disconnect_content0_where_Postparam0\\": \\"post-id\\",
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
                },
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Commentparam0
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0) AND (exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Comment
            }
            CALL {
            	WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Postparam0
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0) AND (exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            	RETURN count(*) AS _
            }
            WITH this, this_disconnect_content0
            CALL {
            WITH this, this_disconnect_content0
            OPTIONAL MATCH (this_disconnect_content0)-[this_disconnect_content0_comments0_rel:HAS_COMMENT]->(this_disconnect_content0_comments0:Comment)
            WHERE this_disconnect_content0_comments0.id = $updateUsers_args_disconnect_content0_disconnect__on_Post0_comments0_where_Commentparam0
            WITH this, this_disconnect_content0, this_disconnect_content0_comments0, this_disconnect_content0_comments0_rel
            CALL apoc.util.validate(NOT ((exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0))) AND (exists((this_disconnect_content0_comments0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0_comments0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0_comments0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0_comments0, this_disconnect_content0_comments0_rel
            	WITH collect(this_disconnect_content0_comments0) as this_disconnect_content0_comments0, this_disconnect_content0_comments0_rel
            	UNWIND this_disconnect_content0_comments0 as x
            	DELETE this_disconnect_content0_comments0_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_content0_comments_Comment
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"updateUsers_args_disconnect_content0_where_Commentparam0\\": \\"post-id\\",
                \\"thisauth_param0\\": \\"user-id\\",
                \\"this_disconnect_content0auth_param0\\": \\"user-id\\",
                \\"updateUsers_args_disconnect_content0_where_Postparam0\\": \\"post-id\\",
                \\"updateUsers_args_disconnect_content0_disconnect__on_Post0_comments0_where_Commentparam0\\": \\"comment-id\\",
                \\"this_disconnect_content0_comments0auth_param0\\": \\"user-id\\",
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
                },
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Comment)
            	WHERE this_connect_content0_node.id = $this_connect_content0_node_param0
            	WITH this, this_connect_content0_node
            	CALL apoc.util.validate(NOT ((exists((this_connect_content0_node)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_connect_content0_node)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_connect_content0_nodeauth_param0))) AND (this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	CALL {
            		WITH *
            		WITH collect(this_connect_content0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_content0_node
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_content0_node
            	RETURN count(*) AS connect_this_connect_content_Comment
            }
            CALL {
            		WITH this
            	OPTIONAL MATCH (this_connect_content1_node:Post)
            	WHERE this_connect_content1_node.id = $this_connect_content1_node_param0
            	WITH this, this_connect_content1_node
            	CALL apoc.util.validate(NOT ((exists((this_connect_content1_node)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_connect_content1_node)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_connect_content1_nodeauth_param0))) AND (this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	CALL {
            		WITH *
            		WITH collect(this_connect_content1_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_content1_node
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content1_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_content1_node
            	RETURN count(*) AS connect_this_connect_content_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"this_connect_content0_node_param0\\": \\"post-id\\",
                \\"this_connect_content0_nodeauth_param0\\": \\"user-id\\",
                \\"thisauth_param0\\": \\"user-id\\",
                \\"this_connect_content1_node_param0\\": \\"post-id\\",
                \\"this_connect_content1_nodeauth_param0\\": \\"user-id\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
