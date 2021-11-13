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

describe("Cypher Auth Allow", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Post {
                id: ID
                creator: User @relationship(type: "HAS_POST", direction: IN)
            }

            type User {
                id: ID
                name: String
                posts: [Post] @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User
                @auth(rules: [{ operations: [CREATE, UPDATE, CONNECT, DISCONNECT], bind: { id: "$jwt.sub" } }])

            extend type Post
                @auth(rules: [{ operations: [CREATE, CONNECT, DISCONNECT], bind: { creator: { id: "$jwt.sub" } } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
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
            "CALL {
            CREATE (this0:User)
            SET this0.id = $this0_id
            SET this0.name = $this0_name
            WITH this0, [ metaVal IN [{type: 'Created', name: 'User', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL apoc.util.validate(NOT(this0.id IS NOT NULL AND this0.id = $this0_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"user-id\\",
                \\"this0_name\\": \\"bob\\",
                \\"this0_auth_bind0_id\\": \\"id-01\\"
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
            "CALL {
            CREATE (this0:User)
            SET this0.id = $this0_id
            SET this0.name = $this0_name
            WITH this0, [ metaVal IN [{type: 'Created', name: 'User', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CREATE (this0_posts0_node:Post)
            SET this0_posts0_node.id = $this0_posts0_node_id
            WITH this0, this0_posts0_node, this0_mutateMeta + [ metaVal IN [{type: 'Created', name: 'Post', id: id(this0_posts0_node), properties: this0_posts0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CREATE (this0_posts0_node_creator0_node:User)
            SET this0_posts0_node_creator0_node.id = $this0_posts0_node_creator0_node_id
            WITH this0, this0_posts0_node, this0_posts0_node_creator0_node, this0_mutateMeta + [ metaVal IN [{type: 'Created', name: 'User', id: id(this0_posts0_node_creator0_node), properties: this0_posts0_node_creator0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL apoc.util.validate(NOT(this0_posts0_node_creator0_node.id IS NOT NULL AND this0_posts0_node_creator0_node.id = $this0_posts0_node_creator0_node_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            MERGE (this0_posts0_node)<-[:HAS_POST]-(this0_posts0_node_creator0_node)
            WITH this0, this0_posts0_node, this0_mutateMeta + [ metaVal IN [{type: 'Connected', name: 'Post', relationshipName: 'HAS_POST', toName: 'User', id: id(this0_posts0_node), toID: id(this0_posts0_node_creator0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL apoc.util.validate(NOT(EXISTS((this0_posts0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this0_posts0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this0_posts0_node_auth_bind0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            MERGE (this0)-[:HAS_POST]->(this0_posts0_node)
            WITH this0, this0_mutateMeta + [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_POST', toName: 'Post', id: id(this0), toID: id(this0_posts0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL apoc.util.validate(NOT(this0.id IS NOT NULL AND this0.id = $this0_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"user-id\\",
                \\"this0_name\\": \\"bob\\",
                \\"this0_posts0_node_id\\": \\"post-id-1\\",
                \\"this0_posts0_node_creator0_node_id\\": \\"some-user-id\\",
                \\"this0_posts0_node_creator0_node_auth_bind0_id\\": \\"id-01\\",
                \\"this0_posts0_node_auth_bind0_creator_id\\": \\"id-01\\",
                \\"this0_auth_bind0_id\\": \\"id-01\\"
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
            "MATCH (this:User)
            WHERE this.id = $this_id
            SET this.id = $this_update_id
            WITH this, [ metaVal IN [{type: 'Updated', name: 'User', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"id-01\\",
                \\"this_update_id\\": \\"not bound\\",
                \\"this_update\\": {
                    \\"id\\": \\"not bound\\"
                },
                \\"this_auth_bind0_id\\": \\"id-01\\"
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
            "MATCH (this:User)
            WHERE this.id = $this_id
            WITH this
            WITH this
            OPTIONAL MATCH (this)-[this_has_post0_relationship:HAS_POST]->(this_posts0:Post)
            WHERE this_posts0.id = $updateUsers.args.update.posts[0].where.node.id
            CALL apoc.do.when(this_posts0 IS NOT NULL, \\"
            WITH this, this_posts0, this_has_post0_relationship
            WITH this, this_posts0, this_has_post0_relationship
            OPTIONAL MATCH (this_posts0)<-[this_posts0_has_post0_relationship:HAS_POST]-(this_posts0_creator0:User)
            CALL apoc.do.when(this_posts0_creator0 IS NOT NULL, \\\\\\"
            SET this_posts0_creator0.id = $this_update_posts0_creator0_id
            WITH this, this_posts0, this_has_post0_relationship, this_posts0_creator0, this_posts0_has_post0_relationship, [ metaVal IN [{type: 'Updated', name: 'User', id: id(this_posts0_creator0), properties: $this_update_posts0_creator0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            CALL apoc.util.validate(NOT(this_posts0_creator0.id IS NOT NULL AND this_posts0_creator0.id = $this_posts0_creator0_auth_bind0_id), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            RETURN this, this_posts0, this_has_post0_relationship, this_posts0_creator0, this_posts0_has_post0_relationship, mutateMeta
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_posts0:this_posts0, this_has_post0_relationship:this_has_post0_relationship, this_posts0_creator0:this_posts0_creator0, this_posts0_has_post0_relationship:this_posts0_has_post0_relationship, updateUsers: $updateUsers, this_posts0_creator0:this_posts0_creator0, auth:$auth,this_update_posts0_creator0_id:$this_update_posts0_creator0_id,this_update_posts0_creator0:$this_update_posts0_creator0,this_posts0_creator0_auth_bind0_id:$this_posts0_creator0_auth_bind0_id})
            YIELD value
            WITH this, this_posts0, this_has_post0_relationship, this_posts0_creator0, this_posts0_has_post0_relationship, value.mutateMeta as mutateMeta
            RETURN this, this_posts0, this_has_post0_relationship, mutateMeta
            \\", \\"\\", {this:this, this_posts0:this_posts0, this_has_post0_relationship:this_has_post0_relationship, updateUsers: $updateUsers, this_posts0:this_posts0, auth:$auth,this_update_posts0_creator0_id:$this_update_posts0_creator0_id,this_update_posts0_creator0:$this_update_posts0_creator0,this_posts0_creator0_auth_bind0_id:$this_posts0_creator0_auth_bind0_id})
            YIELD value
            WITH this, this_posts0, this_has_post0_relationship, value.mutateMeta as mutateMeta
            WITH this, mutateMeta
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"id-01\\",
                \\"this_update_posts0_creator0_id\\": \\"not bound\\",
                \\"this_update_posts0_creator0\\": {
                    \\"id\\": \\"not bound\\"
                },
                \\"this_posts0_creator0_auth_bind0_id\\": \\"id-01\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"jwt\\": {
                        \\"roles\\": [
                            \\"admin\\"
                        ],
                        \\"sub\\": \\"id-01\\"
                    }
                },
                \\"this_auth_bind0_id\\": \\"id-01\\",
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
                }
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
            "MATCH (this:Post)
            WHERE this.id = $this_id
            WITH this
            CALL {
            WITH this
            	OPTIONAL MATCH (this_connect_creator0_node:User)
            	WHERE this_connect_creator0_node.id = $this_connect_creator0_node_id
            CALL apoc.do.when(this_connect_creator0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)<-[:HAS_POST]-(this_connect_creator0_node)
            RETURN this, this_connect_creator0_node, [ metaVal IN [{type: 'Connected', name: 'Post', relationshipName: 'HAS_POST', toName: 'User', id: id(this), toID: id(this_connect_creator0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_connect_creator0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_creator0_node:this_connect_creator0_node})
            YIELD value
            WITH this, this_connect_creator0_node, value.this_connect_creator0_node_mutateMeta as this_connect_creator_mutateMeta
            WITH this, this_connect_creator0_node, this_connect_creator_mutateMeta
            	CALL apoc.util.validate(NOT(EXISTS((this_connect_creator0_node)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_connect_creator0_node)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_creator0_nodePost0_bind_auth_bind0_creator_id) AND this_connect_creator0_node.id IS NOT NULL AND this_connect_creator0_node.id = $this_connect_creator0_nodeUser1_bind_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN REDUCE(tmp1_this_connect_creator_mutateMeta = [], tmp2_this_connect_creator_mutateMeta IN COLLECT(this_connect_creator_mutateMeta) | tmp1_this_connect_creator_mutateMeta + tmp2_this_connect_creator_mutateMeta) as this_connect_creator_mutateMeta
            }
            WITH this, this_connect_creator_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"post-id\\",
                \\"this_connect_creator0_node_id\\": \\"user-id\\",
                \\"this_connect_creator0_nodePost0_bind_auth_bind0_creator_id\\": \\"id-01\\",
                \\"this_connect_creator0_nodeUser1_bind_auth_bind0_id\\": \\"id-01\\"
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
            "MATCH (this:Post)
            WHERE this.id = $this_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_creator0_rel:HAS_POST]-(this_disconnect_creator0:User)
            WHERE this_disconnect_creator0.id = $updatePosts.args.disconnect.creator.where.node.id
            WITH this, this_disconnect_creator0, this_disconnect_creator0_rel, [ metaVal IN [{type: 'Disconnected', name: 'Post', toName: 'User', relationshipName: 'HAS_POST', id: id(this), toID: id(this_disconnect_creator0), relationshipID: id(this_disconnect_creator0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_mutateMeta
            FOREACH(_ IN CASE this_disconnect_creator0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_creator0_rel
            )
            WITH this, this_disconnect_creator0, this_disconnect_creator0_rel, this_mutateMeta
            CALL apoc.util.validate(NOT(EXISTS((this_disconnect_creator0)<-[:HAS_POST]-(:User)) AND ALL(creator IN [(this_disconnect_creator0)<-[:HAS_POST]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_creator0Post0_bind_auth_bind0_creator_id) AND this_disconnect_creator0.id IS NOT NULL AND this_disconnect_creator0.id = $this_disconnect_creator0User1_bind_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"post-id\\",
                \\"this_disconnect_creator0Post0_bind_auth_bind0_creator_id\\": \\"id-01\\",
                \\"this_disconnect_creator0User1_bind_auth_bind0_id\\": \\"id-01\\",
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
                }
            }"
        `);
    });
});
