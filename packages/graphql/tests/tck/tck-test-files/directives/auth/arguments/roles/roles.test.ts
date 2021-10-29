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
import { createJwtRequest } from "../../../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../../../utils/tck-test-utils";

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
                post: Post @relationship(type: "HAS_COMMENT", direction: IN)
            }

            type Post {
                id: String
                content: String
                creator: User @relationship(type: "HAS_POST", direction: OUT)
                comments: [Comment] @relationship(type: "HAS_COMMENT", direction: OUT)
            }

            type User {
                id: ID
                name: String
                password: String
                posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
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
            RETURN this { .id, .name } AS this"
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
            RETURN this { .id, .name, .password } AS this"
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
            RETURN this { history: [this_history IN apoc.cypher.runFirstColumn(\\"MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h\\", {this: this, auth: $auth}, true) WHERE apoc.util.validatePredicate(NOT(ANY(r IN [\\"super-admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0]) | this_history { .url }] } AS this"
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
            WITH this0, [ metaVal IN [{type: 'Created', name: 'User', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .id } AS this0"
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
            WITH this0, [ metaVal IN [{type: 'Created', name: 'User', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this0_mutateMeta
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this0, this0_mutateMeta
            CALL apoc.util.validate(NOT(ANY(r IN [\\"super-admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .id } AS this0"
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
            CALL apoc.util.validate(NOT(ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.id = $this_update_id
            RETURN [ metaVal IN [{type: 'Updated', name: 'User', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_id\\": \\"id-1\\",
                \\"this_update\\": {
                    \\"id\\": \\"id-1\\"
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
            CALL apoc.util.validate(NOT(ANY(r IN [\\"super-admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN [\\"admin\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.password = $this_update_password
            RETURN [ metaVal IN [{type: 'Updated', name: 'User', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_password\\": \\"password\\",
                \\"this_update\\": {
                    \\"password\\": \\"password\\"
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
            CALL apoc.do.when(this_connect_posts0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)-[:HAS_POST]->(this_connect_posts0_node)
            RETURN this, this_connect_posts0_node, [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_POST', toName: 'Post', id: id(this), toID: id(this_connect_posts0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_connect_posts0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_posts0_node:this_connect_posts0_node})
            YIELD value
            WITH this, this_connect_posts0_node, value.this_connect_posts0_node_mutateMeta as this_connect_posts_mutateMeta
            RETURN REDUCE(tmp1_this_connect_posts_mutateMeta = [], tmp2_this_connect_posts_mutateMeta IN COLLECT(this_connect_posts_mutateMeta) | tmp1_this_connect_posts_mutateMeta + tmp2_this_connect_posts_mutateMeta) as this_connect_posts_mutateMeta
            }
            WITH this, this_connect_posts_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
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
            WITH this
            OPTIONAL MATCH (this)<-[this_has_comment0_relationship:HAS_COMMENT]-(this_post0:Post)
            CALL apoc.do.when(this_post0 IS NOT NULL, \\"
            WITH this, this_post0, this_has_comment0_relationship
            WITH this, this_post0, this_has_comment0_relationship
            CALL {
            WITH this, this_post0, this_has_comment0_relationship
            	OPTIONAL MATCH (this_post0_creator0_connect0_node:User)
            	WHERE this_post0_creator0_connect0_node.id = $this_post0_creator0_connect0_node_id
            WITH this, this_post0, this_has_comment0_relationship, this_post0_creator0_connect0_node
            	CALL apoc.util.validate(NOT(ANY(r IN [\\\\\\"super-admin\\\\\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN [\\\\\\"admin\\\\\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            CALL apoc.do.when(this_post0_creator0_connect0_node IS NOT NULL AND this_post0 IS NOT NULL, \\\\\\"
            			MERGE (this_post0)-[:HAS_POST]->(this_post0_creator0_connect0_node)
            RETURN this, this_post0, this_has_comment0_relationship, this_post0_creator0_connect0_node, [ metaVal IN [{type: 'Connected', name: 'Post', relationshipName: 'HAS_POST', toName: 'User', id: id(this_post0), toID: id(this_post0_creator0_connect0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_post0_creator0_connect0_node_mutateMeta
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_post0:this_post0, this_has_comment0_relationship:this_has_comment0_relationship, this_post0_creator0_connect0_node:this_post0_creator0_connect0_node})
            YIELD value
            WITH this, this_post0, this_has_comment0_relationship, this_post0_creator0_connect0_node, value.this_post0_creator0_connect0_node_mutateMeta as this_post0_creator0_connect_mutateMeta
            RETURN REDUCE(tmp1_this_post0_creator0_connect_mutateMeta = [], tmp2_this_post0_creator0_connect_mutateMeta IN COLLECT(this_post0_creator0_connect_mutateMeta) | tmp1_this_post0_creator0_connect_mutateMeta + tmp2_this_post0_creator0_connect_mutateMeta) as this_post0_creator0_connect_mutateMeta
            }
            WITH this, this_post0, this_has_comment0_relationship, this_post0_creator0_connect_mutateMeta as mutateMeta
            RETURN this, this_post0, this_has_comment0_relationship, mutateMeta
            \\", \\"\\", {this:this, this_post0:this_post0, this_has_comment0_relationship:this_has_comment0_relationship, updateComments: $updateComments, this_post0:this_post0, auth:$auth,this_post0_creator0_connect0_node_id:$this_post0_creator0_connect0_node_id})
            YIELD value
            WITH this, this_post0, this_has_comment0_relationship, value.mutateMeta as mutateMeta
            RETURN mutateMeta, this { .content } AS this"
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
            WITH this, this_disconnect_posts0, this_disconnect_posts0_rel, [ metaVal IN [{type: 'Disconnected', name: 'User', toName: 'Post', relationshipName: 'HAS_POST', id: id(this), toID: id(this_disconnect_posts0), relationshipID: id(this_disconnect_posts0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_mutateMeta
            FOREACH(_ IN CASE this_disconnect_posts0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_posts0_rel
            )
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
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
            WITH this
            OPTIONAL MATCH (this)<-[this_has_comment0_relationship:HAS_COMMENT]-(this_post0:Post)
            CALL apoc.do.when(this_post0 IS NOT NULL, \\"
            WITH this, this_post0, this_has_comment0_relationship
            WITH this, this_post0, this_has_comment0_relationship
            CALL {
            WITH this, this_post0, this_has_comment0_relationship
            OPTIONAL MATCH (this_post0)-[this_post0_creator0_disconnect0_rel:HAS_POST]->(this_post0_creator0_disconnect0:User)
            WHERE this_post0_creator0_disconnect0.id = $updateComments.args.update.post.update.node.creator.disconnect.where.node.id
            WITH this, this_post0, this_has_comment0_relationship, this_post0_creator0_disconnect0, this_post0_creator0_disconnect0_rel
            CALL apoc.util.validate(NOT(ANY(r IN [\\\\\\"super-admin\\\\\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND ANY(r IN [\\\\\\"admin\\\\\\"] WHERE ANY(rr IN $auth.roles WHERE r = rr))), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            WITH this, this_post0, this_has_comment0_relationship, this_post0_creator0_disconnect0, this_post0_creator0_disconnect0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Post', toName: 'User', relationshipName: 'HAS_POST', id: id(this_post0), toID: id(this_post0_creator0_disconnect0), relationshipID: id(this_post0_creator0_disconnect0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as this_post0_mutateMeta
            FOREACH(_ IN CASE this_post0_creator0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_post0_creator0_disconnect0_rel
            )
            RETURN REDUCE(tmp1_this_post0_mutateMeta = [], tmp2_this_post0_mutateMeta IN COLLECT(this_post0_mutateMeta) | tmp1_this_post0_mutateMeta + tmp2_this_post0_mutateMeta) as this_post0_mutateMeta
            }
            WITH this, this_post0, this_has_comment0_relationship, this_post0_mutateMeta as mutateMeta
            RETURN this, this_post0, this_has_comment0_relationship, mutateMeta
            \\", \\"\\", {this:this, this_post0:this_post0, this_has_comment0_relationship:this_has_comment0_relationship, updateComments: $updateComments, this_post0:this_post0, auth:$auth})
            YIELD value
            WITH this, this_post0, this_has_comment0_relationship, value.mutateMeta as mutateMeta
            RETURN mutateMeta, this { .content } AS this"
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
            WITH this, this_posts0, collect(DISTINCT this_posts0) as this_posts0_to_delete, [ metaVal IN [{type: 'Deleted', name: 'Post', id: id(this_posts0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL ] as mutateMeta
            FOREACH(x IN this_posts0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
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
