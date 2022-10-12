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

describe("@auth allow when inherited from interface", () => {
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
            }

            type Comment implements Content {
                id: ID
                content: String
                creator: User! @relationship(type: "HAS_COMMENT", direction: IN)
                post: Post! @relationship(type: "HAS_COMMENT", direction: IN)
            }

            type Post implements Content {
                id: ID
                content: String
                creator: User! @relationship(type: "HAS_POST", direction: IN)
                comments: [Comment!]! @relationship(type: "HAS_COMMENT", direction: OUT)
            }

            type User {
                id: ID
                name: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
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
            "MATCH (this:\`User\`)
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"thisauth_param0\\": \\"id-01\\"
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
            "MATCH (this:\`User\`)
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .password } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"thisauth_param0\\": \\"id-01\\"
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
            "MATCH (this:\`User\`)
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[thisthis0:HAS_POST]->(this_posts:\`Post\`)
                WHERE apoc.util.validatePredicate(NOT ((exists((this_posts)<-[:HAS_POST]-(:\`User\`)) AND any(thisthis1 IN [(this_posts)<-[:HAS_POST]-(thisthis1:\`User\`) | thisthis1] WHERE (thisthis1.id IS NOT NULL AND thisthis1.id = $thisparam0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH this_posts { .content } AS this_posts
                RETURN collect(this_posts) AS this_posts
            }
            RETURN this { .id, posts: this_posts } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"thisauth_param0\\": \\"id-01\\",
                \\"thisparam0\\": \\"id-01\\"
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
            "MATCH (this:\`Post\`)
            CALL apoc.util.validate(NOT ((exists((this)<-[:HAS_POST]-(:\`User\`)) AND any(auth_this0 IN [(this)<-[:HAS_POST]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $thisauth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this_creator:\`User\`)-[thisthis0:HAS_POST]->(this)
                WHERE (apoc.util.validatePredicate(NOT ((this_creator.id IS NOT NULL AND this_creator.id = $thisparam0)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ((this_creator.id IS NOT NULL AND this_creator.id = $this_creatorauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                WITH this_creator { .password } AS this_creator
                RETURN head(collect(this_creator)) AS this_creator
            }
            RETURN this { creator: this_creator } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_creatorauth_param0\\": \\"id-01\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"thisparam0\\": \\"id-01\\"
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[thisthis0:HAS_POST]->(this_posts:\`Post\`)
                WHERE (this_posts.id = $thisparam0 AND apoc.util.validatePredicate(NOT ((exists((this_posts)<-[:HAS_POST]-(:\`User\`)) AND any(thisthis1 IN [(this_posts)<-[:HAS_POST]-(thisthis1:\`User\`) | thisthis1] WHERE (thisthis1.id IS NOT NULL AND thisthis1.id = $thisparam1)))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                CALL {
                    WITH this_posts
                    MATCH (this_posts)-[thisthis2:HAS_COMMENT]->(this_posts_comments:\`Comment\`)
                    WHERE (this_posts_comments.id = $thisparam2 AND apoc.util.validatePredicate(NOT ((exists((this_posts_comments)<-[:HAS_COMMENT]-(:\`User\`)) AND any(thisthis3 IN [(this_posts_comments)<-[:HAS_COMMENT]-(thisthis3:\`User\`) | thisthis3] WHERE (thisthis3.id IS NOT NULL AND thisthis3.id = $thisparam3)))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
                    WITH this_posts_comments { .content } AS this_posts_comments
                    RETURN collect(this_posts_comments) AS this_posts_comments
                }
                WITH this_posts { comments: this_posts_comments } AS this_posts
                RETURN collect(this_posts) AS this_posts
            }
            RETURN this { .id, posts: this_posts } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"thisparam0\\": \\"1\\",
                \\"thisparam1\\": \\"id-01\\",
                \\"thisparam2\\": \\"1\\",
                \\"thisparam3\\": \\"id-01\\"
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH this
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.id = $this_update_id
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"old-id\\",
                \\"this_update_id\\": \\"new-id\\",
                \\"thisauth_param0\\": \\"old-id\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH this
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0) AND (this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.password = $this_update_password
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id-01\\",
                \\"this_update_password\\": \\"new-password\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`Post\`)
            WHERE this.id = $param0
            WITH this
            CALL apoc.util.validate(NOT ((exists((this)<-[:HAS_POST]-(:\`User\`)) AND any(auth_this0 IN [(this)<-[:HAS_POST]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $thisauth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            OPTIONAL MATCH (this)<-[this_has_post0_relationship:HAS_POST]-(this_creator0:User)
            CALL apoc.do.when(this_creator0 IS NOT NULL, \\"
            WITH this, this_creator0
            CALL apoc.util.validate(NOT ((this_creator0.id IS NOT NULL AND this_creator0.id = $this_creator0auth_param0)), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            SET this_creator0.id = $this_update_creator0_id
            RETURN count(*) AS _
            \\", \\"\\", {this:this, updatePosts: $updatePosts, this_creator0:this_creator0, auth:$auth,this_update_creator0_id:$this_update_creator0_id,this_creator0auth_param0:$this_creator0auth_param0})
            YIELD value AS _
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_creator_User_unique:HAS_POST]-(:User)
            	WITH count(this_creator_User_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required', [0])
            	RETURN c AS this_creator_User_unique_ignored
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"post-id\\",
                \\"this_update_creator0_id\\": \\"new-id\\",
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
                                        \\"id\\": \\"new-id\\"
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
            CALL apoc.util.validate(NOT ((exists((this)<-[:HAS_POST]-(:\`User\`)) AND any(auth_this0 IN [(this)<-[:HAS_POST]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $thisauth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            OPTIONAL MATCH (this)<-[this_has_post0_relationship:HAS_POST]-(this_creator0:User)
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
            	MATCH (this)<-[this_creator_User_unique:HAS_POST]-(:User)
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH this
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"thisauth_param0\\": \\"user-id\\"
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH this
            OPTIONAL MATCH (this)-[this_posts0_relationship:HAS_POST]->(this_posts0:Post)
            WHERE this_posts0.id = $this_deleteUsers_args_delete_posts0_where_Postparam0
            WITH this, this_posts0
            CALL apoc.util.validate(NOT ((exists((this_posts0)<-[:HAS_POST]-(:\`User\`)) AND any(auth_this0 IN [(this_posts0)<-[:HAS_POST]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_posts0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this, collect(DISTINCT this_posts0) as this_posts0_to_delete
            FOREACH(x IN this_posts0_to_delete | DETACH DELETE x)
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
                \\"this_deleteUsers_args_delete_posts0_where_Postparam0\\": \\"post-id\\",
                \\"this_posts0auth_param0\\": \\"user-id\\"
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
            WHERE this_disconnect_posts0.id = $updateUsers_args_disconnect_posts0_where_Postparam0
            WITH this, this_disconnect_posts0, this_disconnect_posts0_rel
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0) AND (exists((this_disconnect_posts0)<-[:HAS_POST]-(:\`User\`)) AND any(auth_this0 IN [(this_disconnect_posts0)<-[:HAS_POST]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_posts0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE WHEN this_disconnect_posts0 IS NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_posts0_rel
            )
            RETURN count(*) AS disconnect_this_disconnect_posts_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"updateUsers_args_disconnect_posts0_where_Postparam0\\": \\"post-id\\",
                \\"thisauth_param0\\": \\"user-id\\",
                \\"this_disconnect_posts0auth_param0\\": \\"user-id\\",
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
                },
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`Comment\`)
            WHERE this.id = $param0
            WITH this
            CALL apoc.util.validate(NOT ((exists((this)<-[:HAS_COMMENT]-(:\`User\`)) AND any(auth_this0 IN [(this)<-[:HAS_COMMENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $thisauth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_post0_disconnect0_rel:HAS_COMMENT]-(this_post0_disconnect0:Post)
            WITH this, this_post0_disconnect0, this_post0_disconnect0_rel
            CALL apoc.util.validate(NOT ((exists((this)<-[:HAS_COMMENT]-(:\`User\`)) AND any(auth_this0 IN [(this)<-[:HAS_COMMENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $thisauth_param0))) AND (exists((this_post0_disconnect0)<-[:HAS_POST]-(:\`User\`)) AND any(auth_this0 IN [(this_post0_disconnect0)<-[:HAS_POST]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_post0_disconnect0auth_param0)))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE WHEN this_post0_disconnect0 IS NULL THEN [] ELSE [1] END |
            DELETE this_post0_disconnect0_rel
            )
            WITH this, this_post0_disconnect0
            CALL {
            WITH this, this_post0_disconnect0
            OPTIONAL MATCH (this_post0_disconnect0)<-[this_post0_disconnect0_creator0_rel:HAS_POST]-(this_post0_disconnect0_creator0:User)
            WHERE this_post0_disconnect0_creator0.id = $updateComments_args_update_post_disconnect_disconnect_creator_where_Userparam0
            WITH this, this_post0_disconnect0, this_post0_disconnect0_creator0, this_post0_disconnect0_creator0_rel
            CALL apoc.util.validate(NOT ((exists((this_post0_disconnect0)<-[:HAS_POST]-(:\`User\`)) AND any(auth_this0 IN [(this_post0_disconnect0)<-[:HAS_POST]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_post0_disconnect0auth_param0))) AND (this_post0_disconnect0_creator0.id IS NOT NULL AND this_post0_disconnect0_creator0.id = $this_post0_disconnect0_creator0auth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE WHEN this_post0_disconnect0_creator0 IS NULL THEN [] ELSE [1] END |
            DELETE this_post0_disconnect0_creator0_rel
            )
            RETURN count(*) AS disconnect_this_post0_disconnect0_creator_User
            }
            RETURN count(*) AS disconnect_this_post0_disconnect_Post
            }
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_creator_User_unique:HAS_COMMENT]-(:User)
            	WITH count(this_creator_User_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.creator required', [0])
            	RETURN c AS this_creator_User_unique_ignored
            }
            CALL {
            	WITH this
            	MATCH (this)<-[this_post_Post_unique:HAS_COMMENT]-(:Post)
            	WITH count(this_post_Post_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.post required', [0])
            	RETURN c AS this_post_Post_unique_ignored
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"comment-id\\",
                \\"thisauth_param0\\": \\"user-id\\",
                \\"this_post0_disconnect0auth_param0\\": \\"user-id\\",
                \\"updateComments_args_update_post_disconnect_disconnect_creator_where_Userparam0\\": \\"user-id\\",
                \\"this_post0_disconnect0_creator0auth_param0\\": \\"user-id\\",
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
                },
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE this.id = $param0
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_posts0_node:Post)
            	WHERE this_connect_posts0_node.id = $this_connect_posts0_node_param0
            	WITH this, this_connect_posts0_node
            	CALL apoc.util.validate(NOT ((exists((this_connect_posts0_node)<-[:HAS_POST]-(:\`User\`)) AND any(auth_this0 IN [(this_connect_posts0_node)<-[:HAS_POST]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_connect_posts0_nodeauth_param0))) AND (this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	CALL {
            		WITH *
            		WITH collect(this_connect_posts0_node) as connectedNodes, collect(this) as parentNodes
            		UNWIND parentNodes as this
            		UNWIND connectedNodes as this_connect_posts0_node
            		MERGE (this)-[:HAS_POST]->(this_connect_posts0_node)
            	}
            	RETURN count(*) AS connect_this_connect_posts_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"this_connect_posts0_node_param0\\": \\"post-id\\",
                \\"this_connect_posts0_nodeauth_param0\\": \\"user-id\\",
                \\"thisauth_param0\\": \\"user-id\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
