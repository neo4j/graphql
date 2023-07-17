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
import { Neo4jGraphQL } from "../../../../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../../../../utils/tck-test-utils";
import { createBearerToken } from "../../../../../../utils/create-bearer-token";

describe("@auth allow on specific interface implementation", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Content {
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

            type Post implements Content
                @authorization(
                    validate: [
                        {
                            when: BEFORE
                            operations: [READ, UPDATE, DELETE, DELETE_RELATIONSHIP, CREATE_RELATIONSHIP]
                            where: { node: { creator: { id: "$jwt.sub" } } }
                        }
                    ]
                ) {
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

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                    WITH this1 { __resolveType: \\"Comment\\", __id: id(this), .id, .content } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:HAS_CONTENT]->(this4:Post)
                    OPTIONAL MATCH (this4)<-[:HAS_CONTENT]-(this5:User)
                    WITH *, count(this5) AS creatorCount
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND this5.id = coalesce($jwt.sub, $jwtDefault))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this4 { __resolveType: \\"Post\\", __id: id(this), .id, .content } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { .id, content: var2 } AS this"
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

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $param0
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                    WHERE this1.id = $param1
                    WITH this1 { __resolveType: \\"Comment\\", __id: id(this) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:HAS_CONTENT]->(this4:Post)
                    OPTIONAL MATCH (this4)<-[:HAS_CONTENT]-(this5:User)
                    WITH *, count(this5) AS creatorCount
                    WITH *
                    WHERE (this4.id = $param2 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND this5.id = coalesce($jwt.sub, $jwtDefault))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    CALL {
                        WITH this4
                        MATCH (this4)-[this6:HAS_COMMENT]->(this7:Comment)
                        WHERE this7.id = $param6
                        WITH this7 { .content } AS this7
                        RETURN collect(this7) AS var8
                    }
                    WITH this4 { __resolveType: \\"Post\\", __id: id(this), comments: var8 } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { .id, content: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"1\\",
                \\"param2\\": \\"1\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"jwtDefault\\": {},
                \\"param6\\": \\"1\\"
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

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $param0
            WITH this
            CALL {
            	 WITH this
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Comment)
            	SET this_content0.id = $this_update_content0_id
            	WITH this, this_content0
            	CALL {
            		WITH this_content0
            		MATCH (this_content0)<-[this_content0_creator_User_unique:HAS_CONTENT]-(:User)
            		WITH count(this_content0_creator_User_unique) as c
            		WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.creator required exactly once', [0])
            		RETURN c AS this_content0_creator_User_unique_ignored
            	}
            	CALL {
            		WITH this_content0
            		MATCH (this_content0)<-[this_content0_post_Post_unique:HAS_COMMENT]-(:Post)
            		WITH count(this_content0_post_Post_unique) as c
            		WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.post required exactly once', [0])
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
            	OPTIONAL MATCH (this_content0)<-[:HAS_CONTENT]-(authorization_this0:User)
            	WITH *, count(authorization_this0) AS creatorCount
            	WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	SET this_content0.id = $this_update_content0_id
            	WITH this, this_content0
            	CALL {
            		WITH this_content0
            		MATCH (this_content0)<-[this_content0_creator_User_unique:HAS_CONTENT]-(:User)
            		WITH count(this_content0_creator_User_unique) as c
            		WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
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
                    MATCH (this)-[update_this0:HAS_CONTENT]->(update_this1:Comment)
                    WITH update_this1 { __resolveType: \\"Comment\\", __id: id(this), .id } AS update_this1
                    RETURN update_this1 AS update_var2
                    UNION
                    WITH *
                    MATCH (this)-[update_this3:HAS_CONTENT]->(update_this4:Post)
                    OPTIONAL MATCH (update_this4)<-[:HAS_CONTENT]-(update_this5:User)
                    WITH *, count(update_this5) AS creatorCount
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND update_this5.id = coalesce($jwt.sub, $jwtDefault))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH update_this4 { __resolveType: \\"Post\\", __id: id(this), .id } AS update_this4
                    RETURN update_this4 AS update_var2
                }
                WITH update_var2
                RETURN collect(update_var2) AS update_var2
            }
            RETURN collect(DISTINCT this { .id, content: update_var2 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                },
                \\"jwtDefault\\": {},
                \\"param0\\": \\"user-id\\",
                \\"this_update_content0_id\\": \\"new-id\\",
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

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $param0
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_content_Comment0_relationship:HAS_CONTENT]->(this_content_Comment0:Comment)
            WHERE this_content_Comment0.id = $this_deleteUsers_args_delete_content0_where_this_content_Comment0param0
            WITH this_content_Comment0_relationship, collect(DISTINCT this_content_Comment0) AS this_content_Comment0_to_delete
            CALL {
            	WITH this_content_Comment0_to_delete
            	UNWIND this_content_Comment0_to_delete AS x
            	DETACH DELETE x
            }
            }
            OPTIONAL MATCH (this_content_Post0)<-[:HAS_CONTENT]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            WITH *
            CALL {
            WITH *
            OPTIONAL MATCH (this)-[this_content_Post0_relationship:HAS_CONTENT]->(this_content_Post0:Post)
            WHERE this_content_Post0.id = $this_deleteUsers_args_delete_content0_where_this_content_Post0param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this_content_Post0_relationship, collect(DISTINCT this_content_Post0) AS this_content_Post0_to_delete
            CALL {
            	WITH this_content_Post0_to_delete
            	UNWIND this_content_Post0_to_delete AS x
            	DETACH DELETE x
            }
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
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
                \\"this_deleteUsers_args_delete_content0_where_this_content_Post0param0\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                },
                \\"jwtDefault\\": {}
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

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Comment_this_disconnect_content0param0
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Comment
            }
            CALL {
            	WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            OPTIONAL MATCH (this_disconnect_content0)<-[:HAS_CONTENT]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
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
                \\"updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                },
                \\"jwtDefault\\": {},
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
                        content: {
                            where: { node: { id: "post-id" } }
                            disconnect: { _on: { Post: { comments: { where: { node: { id: "comment-id" } } } } } }
                        }
                    }
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
            "MATCH (this:User)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Comment_this_disconnect_content0param0
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Comment
            }
            CALL {
            	WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            OPTIONAL MATCH (this_disconnect_content0)<-[:HAS_CONTENT]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            }
            CALL {
            WITH this, this_disconnect_content0
            OPTIONAL MATCH (this_disconnect_content0)-[this_disconnect_content0_comments0_rel:HAS_COMMENT]->(this_disconnect_content0_comments0:Comment)
            OPTIONAL MATCH (this_disconnect_content0)<-[:HAS_CONTENT]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            WHERE this_disconnect_content0_comments0.id = $updateUsers_args_disconnect_content0_disconnect__on_Post0_comments0_where_Comment_this_disconnect_content0_comments0param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
            	WITH this_disconnect_content0_comments0, this_disconnect_content0_comments0_rel, this_disconnect_content0
            	WITH collect(this_disconnect_content0_comments0) as this_disconnect_content0_comments0, this_disconnect_content0_comments0_rel, this_disconnect_content0
            	UNWIND this_disconnect_content0_comments0 as x
            	DELETE this_disconnect_content0_comments0_rel
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
                \\"updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                },
                \\"jwtDefault\\": {},
                \\"updateUsers_args_disconnect_content0_disconnect__on_Post0_comments0_where_Comment_this_disconnect_content0_comments0param0\\": \\"comment-id\\",
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

    test("Connect node", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { id: "user-id" }, connect: { content: { where: { node: { id: "post-id" } } } }) {
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
            "MATCH (this:User)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Comment)
            	WHERE this_connect_content0_node.id = $this_connect_content0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_content0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_content0_node
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            		}
            	}
            WITH this, this_connect_content0_node
            	RETURN count(*) AS connect_this_connect_content_Comment
            }
            CALL {
            		WITH this
            	OPTIONAL MATCH (this_connect_content1_node:Post)
            OPTIONAL MATCH (this_connect_content1_node)<-[:HAS_CONTENT]-(authorization_this0:User)
            WITH *, count(authorization_this0) AS creatorCount
            	WHERE this_connect_content1_node.id = $this_connect_content1_node_param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (creatorCount <> 0 AND authorization_this0.id = coalesce($jwt.sub, $jwtDefault))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	CALL {
            		WITH *
            		WITH collect(this_connect_content1_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_content1_node
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content1_node)
            		}
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
                \\"this_connect_content1_node_param0\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                },
                \\"jwtDefault\\": {},
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
