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

describe("Cypher Auth Roles", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWTPayload @jwt {
                roles: [String!]!
            }

            type History {
                url: String
                    @authorization(
                        validate: [{ operations: [READ], where: { jwt: { roles_INCLUDES: "super-admin" } } }]
                    )
            }

            type Comment {
                id: String
                content: String
                post: Post! @relationship(type: "HAS_COMMENT", direction: IN)
            }

            type Post {
                id: String
                content: String
                creator: User! @relationship(type: "HAS_POST", direction: OUT)
                comments: [Comment!]! @relationship(type: "HAS_COMMENT", direction: OUT)
            }

            type User {
                id: ID
                name: String
                password: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User @authorization(validate: [{ where: { jwt: { roles_INCLUDES: "admin" } } }])

            extend type Post
                @authorization(
                    validate: [
                        {
                            operations: [CREATE_RELATIONSHIP, DELETE_RELATIONSHIP, DELETE]
                            where: { jwt: { roles_INCLUDES: "super-admin" } }
                        }
                    ]
                )

            extend type User {
                password: String
                    @authorization(
                        validate: [
                            { operations: [READ, CREATE, UPDATE], where: { jwt: { roles_INCLUDES: "super-admin" } } }
                        ]
                    )
            }

            extend type User {
                history: [History]
                    @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h", columnName: "h")
                    @authorization(
                        validate: [{ operations: [READ], where: { jwt: { roles_INCLUDES: "super-admin" } } }]
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
    });

    test("Read Node", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    name
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id, .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"admin\\"
            }"
        `);
    });

    test("Read Node & Field", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    name
                    password
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            RETURN this { .id, .name, .password } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"super-admin\\"
            }"
        `);
    });

    test("Read Node & Cypher Field", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    history {
                        url
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            CALL {
                WITH this
                CALL {
                    WITH this
                    WITH this AS this
                    MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h
                }
                WITH h AS this0
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param4 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0 { .url } AS this0
                RETURN collect(this0) AS var1
            }
            RETURN this { history: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"super-admin\\",
                \\"param4\\": \\"super-admin\\"
            }"
        `);
    });

    test("Create Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(input: [{ id: "1" }]) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:User)
                SET
                    create_this1.id = create_var0.id
                WITH *
                WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate((create_var0.password IS NOT NULL AND NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\"
                    }
                ],
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"create_param3\\": \\"admin\\",
                \\"create_param4\\": \\"super-admin\\"
            }"
        `);
    });

    test("Create Node & Field", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(input: [{ id: "1", password: "super-password" }]) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:User)
                SET
                    create_this1.id = create_var0.id,
                    create_this1.password = create_var0.password
                WITH *
                WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate((create_var0.password IS NOT NULL AND NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param4 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"password\\": \\"super-password\\"
                    }
                ],
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"create_param3\\": \\"admin\\",
                \\"create_param4\\": \\"super-admin\\"
            }"
        `);
    });

    test("Update Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(where: { id: "1" }, update: { id: "id-1" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE (this.id = $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            SET this.id = $this_update_id
            WITH this
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"update_param2\\": \\"admin\\",
                \\"param0\\": \\"1\\",
                \\"param3\\": \\"admin\\",
                \\"this_update_id\\": \\"id-1\\",
                \\"authorization__after_param2\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update Node & Field", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(where: { id: "1" }, update: { password: "password" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE (this.id = $param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            WITH this
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.password = $this_update_password
            WITH this
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"update_param2\\": \\"admin\\",
                \\"param0\\": \\"1\\",
                \\"param3\\": \\"admin\\",
                \\"this_update_password\\": \\"password\\",
                \\"authorization__before_param2\\": \\"super-admin\\",
                \\"authorization__after_param2\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(connect: { posts: {} }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_posts0_node:Post)
            	WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
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
            WITH this, this_connect_posts0_node
            WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this_connect_posts_Post0
            }
            WITH *
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"update_param2\\": \\"admin\\",
                \\"param2\\": \\"admin\\",
                \\"authorization__before_param2\\": \\"super-admin\\",
                \\"authorization__before_param3\\": \\"admin\\",
                \\"authorization__after_param2\\": \\"admin\\",
                \\"authorization__after_param3\\": \\"super-admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Nested Connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateComments(
                    update: {
                        post: { update: { node: { creator: { connect: { where: { node: { id: "user-id" } } } } } } }
                    }
                ) {
                    comments {
                        content
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Comment)
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_has_comment0_relationship:HAS_COMMENT]-(this_post0:Post)
            	WITH *
            	CALL {
            		WITH this, this_post0
            		OPTIONAL MATCH (this_post0_creator0_connect0_node:User)
            		WHERE this_post0_creator0_connect0_node.id = $this_post0_creator0_connect0_node_param0 AND (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            		CALL {
            			WITH *
            			WITH this, collect(this_post0_creator0_connect0_node) as connectedNodes, collect(this_post0) as parentNodes
            			CALL {
            				WITH connectedNodes, parentNodes
            				UNWIND parentNodes as this_post0
            				UNWIND connectedNodes as this_post0_creator0_connect0_node
            				MERGE (this_post0)-[:HAS_POST]->(this_post0_creator0_connect0_node)
            			}
            		}
            	WITH this, this_post0, this_post0_creator0_connect0_node
            	WITH this, this_post0, this_post0_creator0_connect0_node
            	WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            		RETURN count(*) AS connect_this_post0_creator0_connect_User0
            	}
            	WITH this, this_post0
            	CALL {
            		WITH this_post0
            		MATCH (this_post0)-[this_post0_creator_User_unique:HAS_POST]->(:User)
            		WITH count(this_post0_creator_User_unique) as c
            		WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            		RETURN c AS this_post0_creator_User_unique_ignored
            	}
            	RETURN count(*) AS update_this_post0
            }
            WITH *
            CALL {
            	WITH this
            	MATCH (this)<-[this_post_Post_unique:HAS_COMMENT]-(:Post)
            	WITH count(this_post_Post_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.post required exactly once', [0])
            	RETURN c AS this_post_Post_unique_ignored
            }
            RETURN collect(DISTINCT this { .content }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_post0_creator0_connect0_node_param0\\": \\"user-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"authorization__before_param2\\": \\"admin\\",
                \\"authorization__before_param3\\": \\"super-admin\\",
                \\"authorization__after_param2\\": \\"super-admin\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(disconnect: { posts: {} }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
            WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            CALL {
            	WITH this_disconnect_posts0, this_disconnect_posts0_rel, this
            	WITH collect(this_disconnect_posts0) as this_disconnect_posts0, this_disconnect_posts0_rel, this
            	UNWIND this_disconnect_posts0 as x
            	DELETE this_disconnect_posts0_rel
            }
            WITH this, this_disconnect_posts0
            WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            RETURN count(*) AS disconnect_this_disconnect_posts_Post
            }
            WITH *
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $update_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"update_param2\\": \\"admin\\",
                \\"param2\\": \\"admin\\",
                \\"authorization__before_param2\\": \\"admin\\",
                \\"authorization__before_param3\\": \\"super-admin\\",
                \\"authorization__after_param2\\": \\"admin\\",
                \\"authorization__after_param3\\": \\"super-admin\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"posts\\": [
                                {}
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Nested Disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateComments(
                    update: {
                        post: { update: { node: { creator: { disconnect: { where: { node: { id: "user-id" } } } } } } }
                    }
                ) {
                    comments {
                        content
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Comment)
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_has_comment0_relationship:HAS_COMMENT]-(this_post0:Post)
            	WITH this, this_post0
            	CALL {
            	WITH this, this_post0
            	OPTIONAL MATCH (this_post0)-[this_post0_creator0_disconnect0_rel:HAS_POST]->(this_post0_creator0_disconnect0:User)
            	WHERE this_post0_creator0_disconnect0.id = $updateComments_args_update_post_update_node_creator_disconnect_where_User_this_post0_creator0_disconnect0param0 AND (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__before_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	CALL {
            		WITH this_post0_creator0_disconnect0, this_post0_creator0_disconnect0_rel, this_post0
            		WITH collect(this_post0_creator0_disconnect0) as this_post0_creator0_disconnect0, this_post0_creator0_disconnect0_rel, this_post0
            		UNWIND this_post0_creator0_disconnect0 as x
            		DELETE this_post0_creator0_disconnect0_rel
            	}
            	WITH this, this_post0, this_post0_creator0_disconnect0
            	WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization__after_param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS disconnect_this_post0_creator0_disconnect_User
            	}
            	WITH this, this_post0
            	CALL {
            		WITH this_post0
            		MATCH (this_post0)-[this_post0_creator_User_unique:HAS_POST]->(:User)
            		WITH count(this_post0_creator_User_unique) as c
            		WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            		RETURN c AS this_post0_creator_User_unique_ignored
            	}
            	RETURN count(*) AS update_this_post0
            }
            WITH *
            CALL {
            	WITH this
            	MATCH (this)<-[this_post_Post_unique:HAS_COMMENT]-(:Post)
            	WITH count(this_post_Post_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.post required exactly once', [0])
            	RETURN c AS this_post_Post_unique_ignored
            }
            RETURN collect(DISTINCT this { .content }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateComments_args_update_post_update_node_creator_disconnect_where_User_this_post0_creator0_disconnect0param0\\": \\"user-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"authorization__before_param2\\": \\"super-admin\\",
                \\"authorization__before_param3\\": \\"admin\\",
                \\"authorization__after_param2\\": \\"super-admin\\",
                \\"authorization__after_param3\\": \\"admin\\",
                \\"updateComments\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"post\\": {
                                \\"update\\": {
                                    \\"node\\": {
                                        \\"creator\\": {
                                            \\"disconnect\\": {
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
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteUsers {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"admin\\"
            }"
        `);
    });

    test("Nested Delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteUsers(delete: { posts: { where: {} } }) {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param2 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this0, collect(DISTINCT this1) AS var2
                CALL {
                    WITH var2
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"super-admin\\"
            }"
        `);
    });
});
