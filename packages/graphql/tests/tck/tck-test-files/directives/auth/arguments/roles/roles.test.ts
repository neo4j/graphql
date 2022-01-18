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
import { formatCypher, translateQuery, formatParams } from "../../../../../utils/tck-test-utils";
import { createJwtRequest } from "../../../../../../utils/create-jwt-request";

describe("Cypher Auth Roles", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type History {
                url: String @auth(rules: [{ operations: [READ], roles: ["super-admin"] }])
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

            extend type User
                @auth(rules: [{ operations: [READ, CREATE, UPDATE, CONNECT, DISCONNECT, DELETE], roles: ["admin"] }])

            extend type Post @auth(rules: [{ operations: [CONNECT, DISCONNECT, DELETE], roles: ["super-admin"] }])

            extend type User {
                password: String @auth(rules: [{ operations: [READ, CREATE, UPDATE], roles: ["super-admin"] }])
            }

            extend type User {
                history: [History]
                    @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h")
                    @auth(rules: [{ operations: [READ], roles: ["super-admin"] }])
            }
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
                    name
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id, .name } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });

    test("Read Node & Field", async () => {
        const query = gql`
            {
                users {
                    id
                    name
                    password
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL apoc.util.validate(NOT(ANY(r IN [\\"super-admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .id, .name, .password } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });

    test("Read Node & Cypher Field", async () => {
        const query = gql`
            {
                users {
                    history {
                        url
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL apoc.util.validate(NOT(ANY(r IN [\\"super-admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { history: [this_history IN apoc.cypher.runFirstColumn(\\"MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h\\", {this: this, auth: $auth}, true) WHERE apoc.util.validatePredicate(NOT(ANY(r IN [\\"super-admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) | this_history { .url }] } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });

    test("Create Node", async () => {
        const query = gql`
            mutation {
                createUsers(input: [{ id: "1" }]) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:User)
            SET this0.id = $this0_id
            WITH this0
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0
            }
            RETURN
            this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });

    test("Create Node & Field", async () => {
        const query = gql`
            mutation {
                createUsers(input: [{ id: "1", password: "super-password" }]) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:User)
            SET this0.id = $this0_id
            SET this0.password = $this0_password
            WITH this0
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this0
            CALL apoc.util.validate(NOT(ANY(r IN [\\"super-admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0
            }
            RETURN
            this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_password\\": \\"super-password\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });

    test("Update Node", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { id: "1" }, update: { id: "id-1" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $this_id
            WITH this
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.id = $this_update_id
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_id\\": \\"id-1\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });

    test("Update Node & Field", async () => {
        const query = gql`
            mutation {
                updateUsers(where: { id: "1" }, update: { password: "password" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id = $this_id
            WITH this
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN [\\"super-admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.password = $this_update_password
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_password\\": \\"password\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });

    test("Connect", async () => {
        const query = gql`
            mutation {
                updateUsers(connect: { posts: {} }) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_posts0_node:Post)
            	WITH this, this_connect_posts0_node
            	CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN [\\"super-admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });

    test("Nested Connect", async () => {
        const query = gql`
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

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Comment)
            WITH this
            OPTIONAL MATCH (this)<-[this_has_comment0_relationship:HAS_COMMENT]-(this_post0:Post)
            CALL apoc.do.when(this_post0 IS NOT NULL, \\"
            WITH this, this_post0
            CALL {
            	WITH this, this_post0
            	OPTIONAL MATCH (this_post0_creator0_connect0_node:User)
            	WHERE this_post0_creator0_connect0_node.id = $this_post0_creator0_connect0_node_id
            	WITH this, this_post0, this_post0_creator0_connect0_node
            	CALL apoc.util.validate(NOT(ANY(r IN [\\\\\\"super-admin\\\\\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN [\\\\\\"admin\\\\\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            	FOREACH(_ IN CASE this_post0 WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_post0_creator0_connect0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this_post0)-[:HAS_POST]->(this_post0_creator0_connect0_node)
            		)
            	)
            	RETURN count(*)
            }
            WITH this, this_post0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(
                        apoc.cypher.runFirstColumn('MATCH p=(this_post0)-[:HAS_POST]->(:User)
            RETURN count(nodes(p)) = 1', { this_post0: this_post0 }, false)
                    ), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN count(*)
            \\", \\"\\", {this:this, updateComments: $updateComments, this_post0:this_post0, auth:$auth,this_post0_creator0_connect0_node_id:$this_post0_creator0_connect0_node_id})
            YIELD value as _
            WITH this
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(
                        apoc.cypher.runFirstColumn('MATCH p=(this)<-[:HAS_COMMENT]-(:Post)
            RETURN count(nodes(p)) = 1', { this: this }, false)
                    ), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.post required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_post0_creator0_connect0_node_id\\": \\"user-id\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                },
                \\"updateComments\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"post\\": {
                                \\"update\\": {
                                    \\"node\\": {
                                        \\"creator\\": {
                                            \\"connect\\": {
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
                }
            }"
        `);
    });

    test("Disconnect", async () => {
        const query = gql`
            mutation {
                updateUsers(disconnect: { posts: {} }) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
            WITH this, this_disconnect_posts0, this_disconnect_posts0_rel
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN [\\"super-admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            FOREACH(_ IN CASE this_disconnect_posts0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_posts0_rel
            )
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"posts\\": [
                                {}
                            ]
                        }
                    }
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
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });

    test("Nested Disconnect", async () => {
        const query = gql`
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

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Comment)
            WITH this
            OPTIONAL MATCH (this)<-[this_has_comment0_relationship:HAS_COMMENT]-(this_post0:Post)
            CALL apoc.do.when(this_post0 IS NOT NULL, \\"
            WITH this, this_post0
            CALL {
            WITH this, this_post0
            OPTIONAL MATCH (this_post0)-[this_post0_creator0_disconnect0_rel:HAS_POST]->(this_post0_creator0_disconnect0:User)
            WHERE this_post0_creator0_disconnect0.id = $updateComments.args.update.post.update.node.creator.disconnect.where.node.id
            WITH this, this_post0, this_post0_creator0_disconnect0, this_post0_creator0_disconnect0_rel
            CALL apoc.util.validate(NOT(ANY(r IN [\\\\\\"super-admin\\\\\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN [\\\\\\"admin\\\\\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            FOREACH(_ IN CASE this_post0_creator0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_post0_creator0_disconnect0_rel
            )
            RETURN count(*)
            }
            WITH this, this_post0
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(
                        apoc.cypher.runFirstColumn('MATCH p=(this_post0)-[:HAS_POST]->(:User)
            RETURN count(nodes(p)) = 1', { this_post0: this_post0 }, false)
                    ), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN count(*)
            \\", \\"\\", {this:this, updateComments: $updateComments, this_post0:this_post0, auth:$auth})
            YIELD value as _
            WITH this
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT(
                        apoc.cypher.runFirstColumn('MATCH p=(this)<-[:HAS_COMMENT]-(:Post)
            RETURN count(nodes(p)) = 1', { this: this }, false)
                    ), '@neo4j/graphql/RELATIONSHIP-REQUIREDComment.post required', [0])), '@neo4j/graphql/RELATIONSHIP-REQUIRED', [0])
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                },
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
                }
            }"
        `);
    });

    test("Delete", async () => {
        const query = gql`
            mutation {
                deleteUsers {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH this
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });

    test("Nested Delete", async () => {
        const query = gql`
            mutation {
                deleteUsers(delete: { posts: { where: {} } }) {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH this
            OPTIONAL MATCH (this)-[this_posts0_relationship:HAS_POST]->(this_posts0:Post)
            WITH this, this_posts0
            CALL apoc.util.validate(NOT(ANY(r IN [\\"super-admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this, collect(DISTINCT this_posts0) as this_posts0_to_delete
            FOREACH(x IN this_posts0_to_delete | DETACH DELETE x)
            WITH this
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"super_admin\\"
                    }
                }
            }"
        `);
    });
});
