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
import { Neo4jGraphQL } from "../../../../../../../../src";
import { createJwtRequest } from "../../../../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../../../../utils/tck-test-utils";

describe("Cypher Auth Allow", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Content {
                id: ID
                creator: User @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type Comment implements Content {
                id: ID
                creator: User
            }

            type Post implements Content
                @auth(
                    rules: [
                        { operations: [CREATE, UPDATE, CONNECT, DISCONNECT], bind: { creator: { id: "$jwt.sub" } } }
                    ]
                ) {
                id: ID
                creator: User
            }

            type User {
                id: ID
                name: String
                content: [Content] @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            extend type User
                @auth(rules: [{ operations: [CREATE, UPDATE, CONNECT, DISCONNECT], bind: { id: "$jwt.sub" } }])
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Create Nested Node with bind", async () => {
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
            WITH this0, [ metaVal IN [{type: 'Created', name: 'User', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CREATE (this0_contentPost0_node:Post)
            SET this0_contentPost0_node.id = $this0_contentPost0_node_id
            WITH this0, this0_contentPost0_node, this0_mutateMeta + [ metaVal IN [{type: 'Created', name: 'Post', id: id(this0_contentPost0_node), properties: this0_contentPost0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CREATE (this0_contentPost0_node_creator0_node:User)
            SET this0_contentPost0_node_creator0_node.id = $this0_contentPost0_node_creator0_node_id
            WITH this0, this0_contentPost0_node, this0_contentPost0_node_creator0_node, this0_mutateMeta + [ metaVal IN [{type: 'Created', name: 'User', id: id(this0_contentPost0_node_creator0_node), properties: this0_contentPost0_node_creator0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL apoc.util.validate(NOT(this0_contentPost0_node_creator0_node.id IS NOT NULL AND this0_contentPost0_node_creator0_node.id = $this0_contentPost0_node_creator0_node_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            MERGE (this0_contentPost0_node)<-[:HAS_CONTENT]-(this0_contentPost0_node_creator0_node)
            WITH this0, this0_contentPost0_node, this0_mutateMeta + [ metaVal IN [{type: 'Connected', name: 'Post', relationshipName: 'HAS_CONTENT', toName: 'User', id: id(this0_contentPost0_node), toID: id(this0_contentPost0_node_creator0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL apoc.util.validate(NOT(EXISTS((this0_contentPost0_node)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this0_contentPost0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this0_contentPost0_node_auth_bind0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            MERGE (this0)-[:HAS_CONTENT]->(this0_contentPost0_node)
            WITH this0, this0_mutateMeta + [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_CONTENT', toName: 'Post', id: id(this0), toID: id(this0_contentPost0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
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
                \\"this0_contentPost0_node_id\\": \\"post-id-1\\",
                \\"this0_contentPost0_node_creator0_node_id\\": \\"some-user-id\\",
                \\"this0_contentPost0_node_creator0_node_auth_bind0_id\\": \\"id-01\\",
                \\"this0_contentPost0_node_auth_bind0_creator_id\\": \\"id-01\\",
                \\"this0_auth_bind0_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Create Nested Node without bind", async () => {
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
                                            Comment: {
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
            WITH this0, [ metaVal IN [{type: 'Created', name: 'User', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CREATE (this0_contentComment0_node:Comment)
            SET this0_contentComment0_node.id = $this0_contentComment0_node_id
            WITH this0, this0_contentComment0_node, this0_mutateMeta + [ metaVal IN [{type: 'Created', name: 'Comment', id: id(this0_contentComment0_node), properties: this0_contentComment0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CREATE (this0_contentComment0_node_creator0_node:User)
            SET this0_contentComment0_node_creator0_node.id = $this0_contentComment0_node_creator0_node_id
            WITH this0, this0_contentComment0_node, this0_contentComment0_node_creator0_node, this0_mutateMeta + [ metaVal IN [{type: 'Created', name: 'User', id: id(this0_contentComment0_node_creator0_node), properties: this0_contentComment0_node_creator0_node}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL apoc.util.validate(NOT(this0_contentComment0_node_creator0_node.id IS NOT NULL AND this0_contentComment0_node_creator0_node.id = $this0_contentComment0_node_creator0_node_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            MERGE (this0_contentComment0_node)<-[:HAS_CONTENT]-(this0_contentComment0_node_creator0_node)
            MERGE (this0)-[:HAS_CONTENT]->(this0_contentComment0_node)
            WITH this0, this0_mutateMeta + [ metaVal IN [{type: 'Connected', name: 'Comment', relationshipName: 'HAS_CONTENT', toName: 'User', id: id(this0_contentComment0_node), toID: id(this0_contentComment0_node_creator0_node)},{type: 'Connected', name: 'User', relationshipName: 'HAS_CONTENT', toName: 'Comment', id: id(this0), toID: id(this0_contentComment0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
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
                \\"this0_contentComment0_node_id\\": \\"post-id-1\\",
                \\"this0_contentComment0_node_creator0_node_id\\": \\"some-user-id\\",
                \\"this0_contentComment0_node_creator0_node_auth_bind0_id\\": \\"id-01\\",
                \\"this0_auth_bind0_id\\": \\"id-01\\"
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
            "MATCH (this:User)
            WHERE this.id = $this_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Comment)
            WHERE this_content0.id = $updateUsers.args.update.content[0].where.node.id
            CALL apoc.do.when(this_content0 IS NOT NULL, \\"
            WITH this, this_content0, this_has_content0_relationship
            WITH this, this_content0, this_has_content0_relationship
            OPTIONAL MATCH (this_content0)<-[this_content0_has_content0_relationship:HAS_CONTENT]-(this_content0_creator0:User)
            CALL apoc.do.when(this_content0_creator0 IS NOT NULL, \\\\\\"
            SET this_content0_creator0.id = $this_update_content0_creator0_id
            WITH this, this_content0, this_has_content0_relationship, this_content0_creator0, this_content0_has_content0_relationship, [ metaVal IN [{type: 'Updated', name: 'User', id: id(this_content0_creator0), properties: $this_update_content0_creator0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            CALL apoc.util.validate(NOT(this_content0_creator0.id IS NOT NULL AND this_content0_creator0.id = $this_content0_creator0_auth_bind0_id), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            RETURN this, this_content0, this_has_content0_relationship, this_content0_creator0, this_content0_has_content0_relationship, mutateMeta
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_content0:this_content0, this_has_content0_relationship:this_has_content0_relationship, this_content0_creator0:this_content0_creator0, this_content0_has_content0_relationship:this_content0_has_content0_relationship, updateUsers: $updateUsers, this_content0_creator0:this_content0_creator0, auth:$auth,this_update_content0_creator0_id:$this_update_content0_creator0_id,this_update_content0_creator0:$this_update_content0_creator0,this_content0_creator0_auth_bind0_id:$this_content0_creator0_auth_bind0_id})
            YIELD value
            WITH this, this_content0, this_has_content0_relationship, this_content0_creator0, this_content0_has_content0_relationship, value.mutateMeta as mutateMeta
            RETURN this, this_content0, this_has_content0_relationship, mutateMeta
            \\", \\"\\", {this:this, this_content0:this_content0, this_has_content0_relationship:this_has_content0_relationship, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_creator0_id:$this_update_content0_creator0_id,this_update_content0_creator0:$this_update_content0_creator0,this_content0_creator0_auth_bind0_id:$this_content0_creator0_auth_bind0_id})
            YIELD value
            WITH this, this_content0, this_has_content0_relationship, value.mutateMeta as this_mutateMeta
            RETURN this_mutateMeta
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Post)
            WHERE this_content0.id = $updateUsers.args.update.content[0].where.node.id
            CALL apoc.do.when(this_content0 IS NOT NULL, \\"
            WITH this, this_content0, this_has_content0_relationship
            WITH this, this_content0, this_has_content0_relationship
            OPTIONAL MATCH (this_content0)<-[this_content0_has_content0_relationship:HAS_CONTENT]-(this_content0_creator0:User)
            CALL apoc.do.when(this_content0_creator0 IS NOT NULL, \\\\\\"
            SET this_content0_creator0.id = $this_update_content0_creator0_id
            WITH this, this_content0, this_has_content0_relationship, this_content0_creator0, this_content0_has_content0_relationship, [ metaVal IN [{type: 'Updated', name: 'User', id: id(this_content0_creator0), properties: $this_update_content0_creator0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            CALL apoc.util.validate(NOT(this_content0_creator0.id IS NOT NULL AND this_content0_creator0.id = $this_content0_creator0_auth_bind0_id), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            RETURN this, this_content0, this_has_content0_relationship, this_content0_creator0, this_content0_has_content0_relationship, mutateMeta
            \\\\\\", \\\\\\"\\\\\\", {this:this, this_content0:this_content0, this_has_content0_relationship:this_has_content0_relationship, this_content0_creator0:this_content0_creator0, this_content0_has_content0_relationship:this_content0_has_content0_relationship, updateUsers: $updateUsers, this_content0_creator0:this_content0_creator0, auth:$auth,this_update_content0_creator0_id:$this_update_content0_creator0_id,this_update_content0_creator0:$this_update_content0_creator0,this_content0_creator0_auth_bind0_id:$this_content0_creator0_auth_bind0_id})
            YIELD value
            WITH this, this_content0, this_has_content0_relationship, this_content0_creator0, this_content0_has_content0_relationship, value.mutateMeta as mutateMeta
            WITH this, this_content0, this_has_content0_relationship, mutateMeta
            CALL apoc.util.validate(NOT(EXISTS((this_content0)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content0_auth_bind0_creator_id)), \\\\\\"@neo4j/graphql/FORBIDDEN\\\\\\", [0])
            RETURN this, this_content0, this_has_content0_relationship, mutateMeta
            \\", \\"\\", {this:this, this_content0:this_content0, this_has_content0_relationship:this_has_content0_relationship, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_creator0_id:$this_update_content0_creator0_id,this_update_content0_creator0:$this_update_content0_creator0,this_content0_creator0_auth_bind0_id:$this_content0_creator0_auth_bind0_id,this_content0_auth_bind0_creator_id:$this_content0_auth_bind0_creator_id})
            YIELD value
            WITH this, this_content0, this_has_content0_relationship, value.mutateMeta as this_mutateMeta
            RETURN this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            WITH this, mutateMeta
            CALL apoc.util.validate(NOT(this.id IS NOT NULL AND this.id = $this_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"id-01\\",
                \\"this_update_content0_creator0_id\\": \\"not bound\\",
                \\"this_update_content0_creator0\\": {
                    \\"id\\": \\"not bound\\"
                },
                \\"this_content0_creator0_auth_bind0_id\\": \\"id-01\\",
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
                \\"this_content0_auth_bind0_creator_id\\": \\"id-01\\",
                \\"this_auth_bind0_id\\": \\"id-01\\",
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
                }
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
            "MATCH (this:User)
            WHERE this.id = $this_id
            WITH this
            CALL {
            WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Comment)
            	WHERE this_connect_content0_node.id = $this_connect_content0_node_id
            CALL apoc.do.when(this_connect_content0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            RETURN this, this_connect_content0_node, [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_CONTENT', toName: 'Comment', id: id(this), toID: id(this_connect_content0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_connect_content0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_content0_node:this_connect_content0_node})
            YIELD value
            WITH this, this_connect_content0_node, value.this_connect_content0_node_mutateMeta as this_connect_content_mutateMeta
            WITH this, this_connect_content0_node, this_connect_content_mutateMeta
            	CALL apoc.util.validate(NOT(this_connect_content0_node.id IS NOT NULL AND this_connect_content0_node.id = $this_connect_content0_nodeUser0_bind_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN REDUCE(tmp1_this_connect_content_mutateMeta = [], tmp2_this_connect_content_mutateMeta IN COLLECT(this_connect_content_mutateMeta) | tmp1_this_connect_content_mutateMeta + tmp2_this_connect_content_mutateMeta) as this_connect_content_mutateMeta
            UNION
            WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Post)
            	WHERE this_connect_content0_node.id = $this_connect_content0_node_id
            CALL apoc.do.when(this_connect_content0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            RETURN this, this_connect_content0_node, [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_CONTENT', toName: 'Post', id: id(this), toID: id(this_connect_content0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_connect_content0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_content0_node:this_connect_content0_node})
            YIELD value
            WITH this, this_connect_content0_node, value.this_connect_content0_node_mutateMeta as this_connect_content_mutateMeta
            WITH this, this_connect_content0_node, this_connect_content_mutateMeta
            	CALL apoc.util.validate(NOT(this_connect_content0_node.id IS NOT NULL AND this_connect_content0_node.id = $this_connect_content0_nodeUser0_bind_auth_bind0_id AND EXISTS((this_connect_content0_node)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_connect_content0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_content0_nodePost1_bind_auth_bind0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN REDUCE(tmp1_this_connect_content_mutateMeta = [], tmp2_this_connect_content_mutateMeta IN COLLECT(this_connect_content_mutateMeta) | tmp1_this_connect_content_mutateMeta + tmp2_this_connect_content_mutateMeta) as this_connect_content_mutateMeta
            }
            WITH this, this_connect_content_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"user-id\\",
                \\"this_connect_content0_node_id\\": \\"content-id\\",
                \\"this_connect_content0_nodeUser0_bind_auth_bind0_id\\": \\"id-01\\",
                \\"this_connect_content0_nodePost1_bind_auth_bind0_creator_id\\": \\"id-01\\"
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
            "MATCH (this:User)
            WHERE this.id = $this_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
            WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id
            WITH this, this_disconnect_content0, this_disconnect_content0_rel, [ metaVal IN [{type: 'Disconnected', name: 'User', toName: 'Comment', relationshipName: 'HAS_CONTENT', id: id(this), toID: id(this_disconnect_content0), relationshipID: id(this_disconnect_content0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_mutateMeta
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
            )
            WITH this, this_disconnect_content0, this_disconnect_content0_rel, this_mutateMeta
            CALL apoc.util.validate(NOT(this_disconnect_content0.id IS NOT NULL AND this_disconnect_content0.id = $this_disconnect_content0User0_bind_auth_bind0_id), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id
            WITH this, this_disconnect_content0, this_disconnect_content0_rel, [ metaVal IN [{type: 'Disconnected', name: 'User', toName: 'Post', relationshipName: 'HAS_CONTENT', id: id(this), toID: id(this_disconnect_content0), relationshipID: id(this_disconnect_content0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_mutateMeta
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
            )
            WITH this, this_disconnect_content0, this_disconnect_content0_rel, this_mutateMeta
            CALL apoc.util.validate(NOT(this_disconnect_content0.id IS NOT NULL AND this_disconnect_content0.id = $this_disconnect_content0User0_bind_auth_bind0_id AND EXISTS((this_disconnect_content0)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0Post1_bind_auth_bind0_creator_id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            }
            WITH this, this_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"user-id\\",
                \\"this_disconnect_content0User0_bind_auth_bind0_id\\": \\"id-01\\",
                \\"this_disconnect_content0Post1_bind_auth_bind0_creator_id\\": \\"id-01\\",
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
                }
            }"
        `);
    });
});
