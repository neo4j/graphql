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
import { Neo4jGraphQL } from "../../../../../../src";
import { createJwtRequest } from "../../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../../utils/tck-test-utils";

describe("Cypher Auth Allow", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Post {
                id: ID
                creator: User! @relationship(type: "HAS_POST", direction: IN)
            }

            type User {
                id: ID
                name: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User
                @auth(rules: [{ operations: [CREATE, UPDATE, CONNECT, DISCONNECT], bind: { id: "$jwt.sub" } }])

            extend type Post
                @auth(rules: [{ operations: [CREATE, CONNECT, DISCONNECT], bind: { creator: { id: "$jwt.sub" } } }])
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

    test("Create Node", async () => {
        const query = gql`
            mutation {
                createUsers(input: [{ id: "user-id", name: "bob" }]) {
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:\`User\`)
                SET
                    create_this1.id = create_var0.id,
                    create_this1.name = create_var0.name
                WITH *
                WHERE apoc.util.validatePredicate(NOT ((create_this1.id IS NOT NULL AND create_this1.id = $create_param1)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"user-id\\",
                        \\"name\\": \\"bob\\"
                    }
                ],
                \\"create_param1\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Create Nested Node", async () => {
        const query = gql`
            mutation {
                createUsers(
                    input: [
                        {
                            id: "user-id"
                            name: "bob"
                            posts: {
                                create: [
                                    { node: { id: "post-id-1", creator: { create: { node: { id: "some-user-id" } } } } }
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:\`User\`)
                SET
                    create_this1.id = create_var0.id,
                    create_this1.name = create_var0.name
                WITH create_this1, create_var0
                CALL {
                    WITH create_this1, create_var0
                    UNWIND create_var0.posts.create AS create_var2
                    WITH create_var2.node AS create_var3, create_var2.edge AS create_var4, create_this1
                    CREATE (create_this5:\`Post\`)
                    SET
                        create_this5.id = create_var3.id
                    MERGE (create_this1)-[create_this6:HAS_POST]->(create_this5)
                    WITH create_this5, create_var3
                    CALL {
                        WITH create_this5, create_var3
                        UNWIND create_var3.creator.create AS create_var7
                        WITH create_var7.node AS create_var8, create_var7.edge AS create_var9, create_this5
                        CREATE (create_this10:\`User\`)
                        SET
                            create_this10.id = create_var8.id
                        MERGE (create_this5)<-[create_this11:HAS_POST]-(create_this10)
                        WITH *
                        WHERE apoc.util.validatePredicate(NOT ((create_this10.id IS NOT NULL AND create_this10.id = $create_param1)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        RETURN collect(NULL) AS create_var12
                    }
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ((exists((create_this5)<-[:HAS_POST]-(:\`User\`)) AND all(create_this13 IN [(create_this5)<-[:HAS_POST]-(create_this13:\`User\`) | create_this13] WHERE (create_this13.id IS NOT NULL AND create_this13.id = $create_param2)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH create_this5
                    CALL {
                    	WITH create_this5
                    	MATCH (create_this5)<-[create_this5_creator_User_unique:HAS_POST]-(:User)
                    	WITH count(create_this5_creator_User_unique) as c
                    	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
                    	RETURN c AS create_this5_creator_User_unique_ignored
                    }
                    RETURN collect(NULL) AS create_var14
                }
                WITH *
                WHERE apoc.util.validatePredicate(NOT ((create_this1.id IS NOT NULL AND create_this1.id = $create_param3)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"user-id\\",
                        \\"name\\": \\"bob\\",
                        \\"posts\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"id\\": \\"post-id-1\\",
                                        \\"creator\\": {
                                            \\"create\\": {
                                                \\"node\\": {
                                                    \\"id\\": \\"some-user-id\\"
                                                }
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ],
                \\"create_param1\\": \\"id-01\\",
                \\"create_param2\\": \\"id-01\\",
                \\"create_param3\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update Node", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { id: "id-01" }, update: { id: "not bound" }) {
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
            SET this.id = $this_update_id
            WITH this
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id-01\\",
                \\"this_update_id\\": \\"not bound\\",
                \\"thisauth_param0\\": \\"id-01\\",
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
                        posts: {
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
            	MATCH (this)-[this_has_post0_relationship:HAS_POST]->(this_posts0:Post)
            	WHERE this_posts0.id = $updateUsers_args_update_posts0_where_this_posts0param0
            	WITH this, this_posts0
            	CALL {
            		WITH this, this_posts0
            		MATCH (this_posts0)<-[this_posts0_has_post0_relationship:HAS_POST]-(this_posts0_creator0:User)
            		SET this_posts0_creator0.id = $this_update_posts0_creator0_id
            		WITH this, this_posts0, this_posts0_creator0
            		CALL apoc.util.validate(NOT ((this_posts0_creator0.id IS NOT NULL AND this_posts0_creator0.id = $this_posts0_creator0auth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            		RETURN count(*) AS update_this_posts0_creator0
            	}
            	WITH this, this_posts0
            	CALL {
            		WITH this_posts0
            		MATCH (this_posts0)<-[this_posts0_creator_User_unique:HAS_POST]-(:User)
            		WITH count(this_posts0_creator_User_unique) as c
            		CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            		RETURN c AS this_posts0_creator_User_unique_ignored
            	}
            	RETURN count(*) AS update_this_posts0
            }
            WITH this
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id-01\\",
                \\"updateUsers_args_update_posts0_where_this_posts0param0\\": \\"post-id\\",
                \\"this_update_posts0_creator0_id\\": \\"not bound\\",
                \\"this_posts0_creator0auth_param0\\": \\"id-01\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"posts\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"id\\": \\"post-id\\"
                                        }
                                    },
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
                updatePosts(where: { id: "post-id" }, connect: { creator: { where: { node: { id: "user-id" } } } }) {
                    posts {
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
            "MATCH (this:\`Post\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_creator0_node:User)
            	WHERE this_connect_creator0_node.id = $this_connect_creator0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this_connect_creator0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_creator0_node
            			MERGE (this)<-[:HAS_POST]-(this_connect_creator0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_creator0_node
            	WITH this, this_connect_creator0_node
            	CALL apoc.util.validate(NOT ((exists((this_connect_creator0_node)<-[:HAS_POST]-(:\`User\`)) AND all(auth_this0 IN [(this_connect_creator0_node)<-[:HAS_POST]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_connect_creator0_nodeauth_param0))) AND (this_connect_creator0_node.id IS NOT NULL AND this_connect_creator0_node.id = $this_connect_creator0_nodeauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	RETURN count(*) AS connect_this_connect_creator_User
            }
            WITH *
            WITH *
            CALL {
            	WITH this
            	MATCH (this)<-[this_creator_User_unique:HAS_POST]-(:User)
            	WITH count(this_creator_User_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            	RETURN c AS this_creator_User_unique_ignored
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"post-id\\",
                \\"this_connect_creator0_node_param0\\": \\"user-id\\",
                \\"this_connect_creator0_nodeauth_param0\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Disconnect Node", async () => {
        const query = gql`
            mutation {
                updatePosts(where: { id: "post-id" }, disconnect: { creator: { where: { node: { id: "user-id" } } } }) {
                    posts {
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
            "MATCH (this:\`Post\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_creator0_rel:HAS_POST]-(this_disconnect_creator0:User)
            WHERE this_disconnect_creator0.id = $updatePosts_args_disconnect_creator_where_User_this_disconnect_creator0param0
            CALL {
            	WITH this_disconnect_creator0, this_disconnect_creator0_rel, this
            	WITH collect(this_disconnect_creator0) as this_disconnect_creator0, this_disconnect_creator0_rel, this
            	UNWIND this_disconnect_creator0 as x
            	DELETE this_disconnect_creator0_rel
            	RETURN count(*) AS _
            }
            WITH this, this_disconnect_creator0
            CALL apoc.util.validate(NOT ((exists((this_disconnect_creator0)<-[:HAS_POST]-(:\`User\`)) AND all(auth_this0 IN [(this_disconnect_creator0)<-[:HAS_POST]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_creator0auth_param0))) AND (this_disconnect_creator0.id IS NOT NULL AND this_disconnect_creator0.id = $this_disconnect_creator0auth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN count(*) AS disconnect_this_disconnect_creator_User
            }
            WITH *
            WITH *
            CALL {
            	WITH this
            	MATCH (this)<-[this_creator_User_unique:HAS_POST]-(:User)
            	WITH count(this_creator_User_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            	RETURN c AS this_creator_User_unique_ignored
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"post-id\\",
                \\"updatePosts_args_disconnect_creator_where_User_this_disconnect_creator0param0\\": \\"user-id\\",
                \\"this_disconnect_creator0auth_param0\\": \\"id-01\\",
                \\"updatePosts\\": {
                    \\"args\\": {
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
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
