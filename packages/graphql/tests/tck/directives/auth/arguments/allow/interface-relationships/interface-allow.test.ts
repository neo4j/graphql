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
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:HAS_CONTENT]->(this1:\`Comment\`)
                    WHERE apoc.util.validatePredicate(NOT ((exists((this1)<-[:HAS_CONTENT]-(:\`User\`)) AND any(this2 IN [(this1)<-[:HAS_CONTENT]-(this2:\`User\`) | this2] WHERE (this2.id IS NOT NULL AND this2.id = $param1)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this1 { __resolveType: \\"Comment\\", __id: id(this), .id, .content } AS this1
                    RETURN this1 AS var3
                    UNION
                    WITH *
                    MATCH (this)-[this4:HAS_CONTENT]->(this5:\`Post\`)
                    WHERE apoc.util.validatePredicate(NOT ((exists((this5)<-[:HAS_CONTENT]-(:\`User\`)) AND any(this6 IN [(this5)<-[:HAS_CONTENT]-(this6:\`User\`) | this6] WHERE (this6.id IS NOT NULL AND this6.id = $param2)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this5 { __resolveType: \\"Post\\", __id: id(this), .id, .content } AS this5
                    RETURN this5 AS var3
                }
                WITH var3
                RETURN collect(var3) AS var3
            }
            RETURN this { .id, content: var3 } AS this"
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
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:HAS_CONTENT]->(this1:\`Comment\`)
                    WHERE (this1.id = $param2 AND apoc.util.validatePredicate(NOT ((exists((this1)<-[:HAS_CONTENT]-(:\`User\`)) AND any(this2 IN [(this1)<-[:HAS_CONTENT]-(this2:\`User\`) | this2] WHERE (this2.id IS NOT NULL AND this2.id = $param3)))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    WITH this1 { __resolveType: \\"Comment\\", __id: id(this) } AS this1
                    RETURN this1 AS var3
                    UNION
                    WITH *
                    MATCH (this)-[this4:HAS_CONTENT]->(this5:\`Post\`)
                    WHERE (this5.id = $param4 AND apoc.util.validatePredicate(NOT ((exists((this5)<-[:HAS_CONTENT]-(:\`User\`)) AND any(this6 IN [(this5)<-[:HAS_CONTENT]-(this6:\`User\`) | this6] WHERE (this6.id IS NOT NULL AND this6.id = $param5)))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    CALL {
                        WITH this5
                        MATCH (this5)-[this7:HAS_COMMENT]->(this8:\`Comment\`)
                        WHERE (this8.id = $param6 AND apoc.util.validatePredicate(NOT ((exists((this8)<-[:HAS_CONTENT]-(:\`User\`)) AND any(this9 IN [(this8)<-[:HAS_CONTENT]-(this9:\`User\`) | this9] WHERE (this9.id IS NOT NULL AND this9.id = $param7)))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                        WITH this8 { .content } AS this8
                        RETURN collect(this8) AS var10
                    }
                    WITH this5 { __resolveType: \\"Post\\", __id: id(this), comments: var10 } AS this5
                    RETURN this5 AS var3
                }
                WITH var3
                RETURN collect(var3) AS var3
            }
            RETURN this { .id, content: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"id-01\\",
                \\"param2\\": \\"1\\",
                \\"param3\\": \\"id-01\\",
                \\"param4\\": \\"1\\",
                \\"param5\\": \\"id-01\\",
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
            CALL {
            	WITH this
            	MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Comment)
            	WITH this, this_content0
            	CALL apoc.util.validate(NOT ((exists((this_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	SET this_content0.id = $this_update_content0_id
            	WITH this, this_content0
            	CALL {
            		WITH this_content0
            		MATCH (this_content0)<-[this_content0_creator_User_unique:HAS_CONTENT]-(:User)
            		WITH count(this_content0_creator_User_unique) as c
            		CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.creator required exactly once', [0])
            		RETURN c AS this_content0_creator_User_unique_ignored
            	}
            	CALL {
            		WITH this_content0
            		MATCH (this_content0)<-[this_content0_post_Post_unique:HAS_COMMENT]-(:Post)
            		WITH count(this_content0_post_Post_unique) as c
            		CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.post required exactly once', [0])
            		RETURN c AS this_content0_post_Post_unique_ignored
            	}
            	RETURN count(*) AS update_this_content0
            }
            RETURN count(*) AS update_this_Comment
            }
            CALL {
            	 WITH this
            	WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Post)
            	WITH this, this_content0
            	CALL apoc.util.validate(NOT ((exists((this_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	SET this_content0.id = $this_update_content0_id
            	WITH this, this_content0
            	CALL {
            		WITH this_content0
            		MATCH (this_content0)<-[this_content0_creator_User_unique:HAS_CONTENT]-(:User)
            		WITH count(this_content0_creator_User_unique) as c
            		CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            		RETURN c AS this_content0_creator_User_unique_ignored
            	}
            	RETURN count(*) AS update_this_content0
            }
            RETURN count(*) AS update_this_Post
            }
            WITH *
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[update_this0:HAS_CONTENT]->(update_this1:\`Comment\`)
                    WHERE apoc.util.validatePredicate(NOT ((exists((update_this1)<-[:HAS_CONTENT]-(:\`User\`)) AND any(update_this2 IN [(update_this1)<-[:HAS_CONTENT]-(update_this2:\`User\`) | update_this2] WHERE (update_this2.id IS NOT NULL AND update_this2.id = $update_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH update_this1 { __resolveType: \\"Comment\\", __id: id(this), .id } AS update_this1
                    RETURN update_this1 AS update_var3
                    UNION
                    WITH *
                    MATCH (this)-[update_this4:HAS_CONTENT]->(update_this5:\`Post\`)
                    WHERE apoc.util.validatePredicate(NOT ((exists((update_this5)<-[:HAS_CONTENT]-(:\`User\`)) AND any(update_this6 IN [(update_this5)<-[:HAS_CONTENT]-(update_this6:\`User\`) | update_this6] WHERE (update_this6.id IS NOT NULL AND update_this6.id = $update_param1)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH update_this5 { __resolveType: \\"Post\\", __id: id(this), .id } AS update_this5
                    RETURN update_this5 AS update_var3
                }
                WITH update_var3
                RETURN collect(update_var3) AS update_var3
            }
            RETURN collect(DISTINCT this { .id, content: update_var3 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"update_param0\\": \\"user-id\\",
                \\"update_param1\\": \\"user-id\\",
                \\"param0\\": \\"user-id\\",
                \\"this_update_content0_id\\": \\"new-id\\",
                \\"this_content0auth_param0\\": \\"user-id\\",
                \\"thisauth_param0\\": \\"user-id\\",
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
            CALL {
            	WITH this
            	MATCH (this)<-[this_has_content0_relationship:HAS_CONTENT]-(this_creator0:User)
            	WITH this, this_creator0
            	CALL apoc.util.validate(NOT ((this_creator0.id IS NOT NULL AND this_creator0.id = $this_creator0auth_param0) AND (this_creator0.id IS NOT NULL AND this_creator0.id = $this_creator0auth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	SET this_creator0.password = $this_update_creator0_password
            	RETURN count(*) AS update_this_creator0
            }
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_creator_User_unique:HAS_CONTENT]-(:User)
            	WITH count(this_creator_User_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            	RETURN c AS this_creator_User_unique_ignored
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"post-id\\",
                \\"this_update_creator0_password\\": \\"new-password\\",
                \\"this_creator0auth_param0\\": \\"user-id\\",
                \\"thisauth_param0\\": \\"user-id\\",
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
            WITH this
            OPTIONAL MATCH (this)-[this_content_Comment0_relationship:HAS_CONTENT]->(this_content_Comment0:Comment)
            WHERE this_content_Comment0.id = $this_deleteUsers_args_delete_content0_where_this_content_Comment0param0
            WITH this, this_content_Comment0
            CALL apoc.util.validate(NOT ((exists((this_content_Comment0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_content_Comment0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content_Comment0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this, collect(DISTINCT this_content_Comment0) AS this_content_Comment0_to_delete
            CALL {
            	WITH this_content_Comment0_to_delete
            	UNWIND this_content_Comment0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            WITH this
            OPTIONAL MATCH (this)-[this_content_Post0_relationship:HAS_CONTENT]->(this_content_Post0:Post)
            WHERE this_content_Post0.id = $this_deleteUsers_args_delete_content0_where_this_content_Post0param0
            WITH this, this_content_Post0
            CALL apoc.util.validate(NOT ((exists((this_content_Post0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_content_Post0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content_Post0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this, collect(DISTINCT this_content_Post0) AS this_content_Post0_to_delete
            CALL {
            	WITH this_content_Post0_to_delete
            	UNWIND this_content_Post0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
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
                \\"this_deleteUsers_args_delete_content0_where_this_content_Comment0param0\\": \\"post-id\\",
                \\"this_content_Comment0auth_param0\\": \\"user-id\\",
                \\"this_deleteUsers_args_delete_content0_where_this_content_Post0param0\\": \\"post-id\\",
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
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Comment_this_disconnect_content0param0
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0) AND (exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Comment
            }
            CALL {
            	WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0) AND (exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
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
                \\"updateUsers_args_disconnect_content0_where_Comment_this_disconnect_content0param0\\": \\"post-id\\",
                \\"thisauth_param0\\": \\"user-id\\",
                \\"this_disconnect_content0auth_param0\\": \\"user-id\\",
                \\"updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0\\": \\"post-id\\",
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
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Comment_this_disconnect_content0param0
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0) AND (exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Comment
            }
            CALL {
            	WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0) AND (exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            	RETURN count(*) AS _
            }
            CALL {
            WITH this, this_disconnect_content0
            OPTIONAL MATCH (this_disconnect_content0)-[this_disconnect_content0_comments0_rel:HAS_COMMENT]->(this_disconnect_content0_comments0:Comment)
            WHERE this_disconnect_content0_comments0.id = $updateUsers_args_disconnect_content0_disconnect__on_Post0_comments0_where_Comment_this_disconnect_content0_comments0param0
            WITH this, this_disconnect_content0, this_disconnect_content0_comments0, this_disconnect_content0_comments0_rel
            CALL apoc.util.validate(NOT ((exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0))) AND (exists((this_disconnect_content0_comments0)<-[:HAS_CONTENT]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_content0_comments0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0_comments0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0_comments0, this_disconnect_content0_comments0_rel, this_disconnect_content0
            	WITH collect(this_disconnect_content0_comments0) as this_disconnect_content0_comments0, this_disconnect_content0_comments0_rel, this_disconnect_content0
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
                \\"updateUsers_args_disconnect_content0_where_Comment_this_disconnect_content0param0\\": \\"post-id\\",
                \\"thisauth_param0\\": \\"user-id\\",
                \\"this_disconnect_content0auth_param0\\": \\"user-id\\",
                \\"updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0\\": \\"post-id\\",
                \\"updateUsers_args_disconnect_content0_disconnect__on_Post0_comments0_where_Comment_this_disconnect_content0_comments0param0\\": \\"comment-id\\",
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
