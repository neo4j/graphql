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

describe("Cypher Auth Allow", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Content
                @auth(rules: [{ operations: [CREATE, CONNECT, DISCONNECT], bind: { creator: { id: "$jwt.sub" } } }]) {
                id: ID
                creator: User! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type Comment implements Content {
                id: ID
                creator: User!
            }

            type Post implements Content {
                id: ID
                creator: User!
            }

            type User {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            extend type User
                @auth(rules: [{ operations: [CREATE, UPDATE, CONNECT, DISCONNECT], bind: { id: "$jwt.sub" } }])
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

    test("Create Nested Node", async () => {
        const query = gql`
            mutation {
                createUsers(
                    input: [
                        {
                            id: "user-id"
                            name: "bob"
                            content: {
                                create: [
                                    {
                                        node: {
                                            Post: {
                                                id: "post-id-1"
                                                creator: { create: { node: { id: "some-user-id" } } }
                                            }
                                        }
                                    }
                                ]
                            }
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
            WITH this0
            CREATE (this0_contentPost0_node:Post)
            SET this0_contentPost0_node.id = $this0_contentPost0_node_id
            WITH this0, this0_contentPost0_node
            CREATE (this0_contentPost0_node_creator0_node:User)
            SET this0_contentPost0_node_creator0_node.id = $this0_contentPost0_node_creator0_node_id
            WITH this0, this0_contentPost0_node, this0_contentPost0_node_creator0_node
            CALL apoc.util.validate(NOT ((this0_contentPost0_node_creator0_node.id IS NOT NULL AND this0_contentPost0_node_creator0_node.id = $this0_contentPost0_node_creator0_nodeauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            MERGE (this0_contentPost0_node)<-[:HAS_CONTENT]-(this0_contentPost0_node_creator0_node)
            WITH this0, this0_contentPost0_node
            CALL apoc.util.validate(NOT ((exists((this0_contentPost0_node)<-[:HAS_CONTENT]-(:\`User\`)) AND all(auth_this0 IN [(this0_contentPost0_node)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this0_contentPost0_nodeauth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            MERGE (this0)-[:HAS_CONTENT]->(this0_contentPost0_node)
            WITH this0, this0_contentPost0_node
            CALL {
            	WITH this0_contentPost0_node
            	MATCH (this0_contentPost0_node)<-[this0_contentPost0_node_creator_User_unique:HAS_CONTENT]-(:User)
            	WITH count(this0_contentPost0_node_creator_User_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            	RETURN c AS this0_contentPost0_node_creator_User_unique_ignored
            }
            WITH this0
            CALL apoc.util.validate(NOT ((this0.id IS NOT NULL AND this0.id = $this0auth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0
            }
            RETURN [
            this0 { .id }] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"user-id\\",
                \\"this0_name\\": \\"bob\\",
                \\"this0_contentPost0_node_id\\": \\"post-id-1\\",
                \\"this0_contentPost0_node_creator0_node_id\\": \\"some-user-id\\",
                \\"this0_contentPost0_node_creator0_nodeauth_param0\\": \\"id-01\\",
                \\"this0_contentPost0_nodeauth_param0\\": \\"id-01\\",
                \\"this0auth_param0\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update Nested Node", async () => {
        const query = gql`
            mutation {
                updateUsers(
                    where: { id: "id-01" }
                    update: {
                        content: {
                            where: { node: { id: "post-id" } }
                            update: { node: { creator: { update: { node: { id: "not bound" } } } } }
                        }
                    }
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            	 WITH this
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Comment)
            	WHERE this_content0.id = $updateUsers_args_update_content0_where_this_content0param0
            	WITH this, this_content0
            	CALL {
            		WITH this, this_content0
            		MATCH (this_content0)<-[this_content0_has_content0_relationship:HAS_CONTENT]-(this_content0_creator0:User)
            		SET this_content0_creator0.id = $this_update_content0_creator0_id
            		WITH this, this_content0, this_content0_creator0
            		CALL apoc.util.validate(NOT ((this_content0_creator0.id IS NOT NULL AND this_content0_creator0.id = $this_content0_creator0auth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            		RETURN count(*) AS update_this_content0_creator0
            	}
            	WITH this, this_content0
            	CALL {
            		WITH this_content0
            		MATCH (this_content0)<-[this_content0_creator_User_unique:HAS_CONTENT]-(:User)
            		WITH count(this_content0_creator_User_unique) as c
            		CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.creator required exactly once', [0])
            		RETURN c AS this_content0_creator_User_unique_ignored
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
            	WHERE this_content0.id = $updateUsers_args_update_content0_where_this_content0param0
            	WITH this, this_content0
            	CALL {
            		WITH this, this_content0
            		MATCH (this_content0)<-[this_content0_has_content0_relationship:HAS_CONTENT]-(this_content0_creator0:User)
            		SET this_content0_creator0.id = $this_update_content0_creator0_id
            		WITH this, this_content0, this_content0_creator0
            		CALL apoc.util.validate(NOT ((this_content0_creator0.id IS NOT NULL AND this_content0_creator0.id = $this_content0_creator0auth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            		RETURN count(*) AS update_this_content0_creator0
            	}
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
            WITH this
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id-01\\",
                \\"updateUsers_args_update_content0_where_this_content0param0\\": \\"post-id\\",
                \\"this_update_content0_creator0_id\\": \\"not bound\\",
                \\"this_content0_creator0auth_param0\\": \\"id-01\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"content\\": [
                                {
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"creator\\": {
                                                \\"update\\": {
                                                    \\"node\\": {
                                                        \\"id\\": \\"not bound\\"
                                                    }
                                                }
                                            }
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
                updateUsers(where: { id: "user-id" }, connect: { content: { where: { node: { id: "content-id" } } } }) {
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
            "MATCH (this:\`User\`)
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
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_content0_node
            	WITH this, this_connect_content0_node
            	CALL apoc.util.validate(NOT ((this_connect_content0_node.id IS NOT NULL AND this_connect_content0_node.id = $this_connect_content0_nodeauth_param0) AND (exists((this_connect_content0_node)<-[:HAS_CONTENT]-(:\`User\`)) AND all(auth_this0 IN [(this_connect_content0_node)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_connect_content0_nodeauth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	RETURN count(*) AS connect_this_connect_content_Comment
            }
            CALL {
            		WITH this
            	OPTIONAL MATCH (this_connect_content1_node:Post)
            	WHERE this_connect_content1_node.id = $this_connect_content1_node_param0
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
            	WITH this, this_connect_content1_node
            	CALL apoc.util.validate(NOT ((this_connect_content1_node.id IS NOT NULL AND this_connect_content1_node.id = $this_connect_content1_nodeauth_param0) AND (exists((this_connect_content1_node)<-[:HAS_CONTENT]-(:\`User\`)) AND all(auth_this0 IN [(this_connect_content1_node)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_connect_content1_nodeauth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	RETURN count(*) AS connect_this_connect_content_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"this_connect_content0_node_param0\\": \\"content-id\\",
                \\"this_connect_content0_nodeauth_param0\\": \\"id-01\\",
                \\"this_connect_content1_node_param0\\": \\"content-id\\",
                \\"this_connect_content1_nodeauth_param0\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Disconnect Node", async () => {
        const query = gql`
            mutation {
                updateUsers(
                    where: { id: "user-id" }
                    disconnect: { content: { where: { node: { id: "content-id" } } } }
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
            "MATCH (this:\`User\`)
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
            	RETURN count(*) AS _
            }
            WITH this, this_disconnect_content0
            CALL apoc.util.validate(NOT ((this_disconnect_content0.id IS NOT NULL AND this_disconnect_content0.id = $this_disconnect_content0auth_param0) AND (exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND all(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN count(*) AS disconnect_this_disconnect_content_Comment
            }
            CALL {
            	WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            	RETURN count(*) AS _
            }
            WITH this, this_disconnect_content0
            CALL apoc.util.validate(NOT ((this_disconnect_content0.id IS NOT NULL AND this_disconnect_content0.id = $this_disconnect_content0auth_param0) AND (exists((this_disconnect_content0)<-[:HAS_CONTENT]-(:\`User\`)) AND all(auth_this0 IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN count(*) AS disconnect_this_disconnect_content_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"updateUsers_args_disconnect_content0_where_Comment_this_disconnect_content0param0\\": \\"content-id\\",
                \\"this_disconnect_content0auth_param0\\": \\"id-01\\",
                \\"updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0\\": \\"content-id\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"content\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"id\\": \\"content-id\\"
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
