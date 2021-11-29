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

describe("Cypher Auth isAuthenticated", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type History {
                url: String @auth(rules: [{ operations: [READ], isAuthenticated: true }])
            }

            interface Content {
                id: String
                content: String
            }

            type Comment implements Content {
                id: String
                content: String
            }

            type Post implements Content
                @auth(
                    rules: [{ operations: [READ, CREATE, UPDATE, CONNECT, DISCONNECT, DELETE], isAuthenticated: true }]
                ) {
                id: String
                content: String
            }

            type User {
                id: ID
                name: String
                password: String
                content: [Content] @relationship(type: "HAS_CONTENT", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Create Node with isAuthenticated", async () => {
        const query = gql`
            mutation {
                createPosts(input: [{ id: "1", content: "content" }]) {
                    posts {
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
            CREATE (this0:Post)
            SET this0.id = $this0_id
            SET this0.content = $this0_content
            WITH this0, [ metaVal IN [{type: 'Created', name: 'Post', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this0_mutateMeta
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT(this0_mutateMeta) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_content\\": \\"content\\",
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {}
                }
            }"
        `);
    });

    test("Create Node without isAuthenticated", async () => {
        const query = gql`
            mutation {
                createComments(input: [{ id: "1", content: "content" }]) {
                    comments {
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
            CREATE (this0:Comment)
            SET this0.id = $this0_id
            SET this0.content = $this0_content
            RETURN this0, REDUCE(tmp1_this0_mutateMeta = [], tmp2_this0_mutateMeta IN COLLECT([ metaVal IN [{type: 'Created', name: 'Comment', id: id(this0), properties: this0}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ]) | tmp1_this0_mutateMeta + tmp2_this0_mutateMeta) as this0_mutateMeta
            }
            WITH this0, this0_mutateMeta as mutateMeta
            RETURN mutateMeta, this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"1\\",
                \\"this0_content\\": \\"content\\"
            }"
        `);
    });

    test("Update Node with bind", async () => {
        const query = gql`
            mutation {
                updatePosts(where: { id: "1" }, update: { id: "id-1" }) {
                    posts {
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
            "MATCH (this:Post)
            WHERE this.id = $this_id
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.id = $this_update_id
            RETURN [ metaVal IN [{type: 'Updated', name: 'Post', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta, this { .id } AS this"
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
                    \\"roles\\": [],
                    \\"jwt\\": {}
                }
            }"
        `);
    });

    test("Update Node without bind", async () => {
        const query = gql`
            mutation {
                updateComments(where: { id: "1" }, update: { id: "id-1" }) {
                    comments {
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
            "MATCH (this:Comment)
            WHERE this.id = $this_id
            SET this.id = $this_update_id
            RETURN [ metaVal IN [{type: 'Updated', name: 'Comment', id: id(this), properties: $this_update}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_id\\": \\"1\\",
                \\"this_update_id\\": \\"id-1\\",
                \\"this_update\\": {
                    \\"id\\": \\"id-1\\"
                }
            }"
        `);
    });

    test("Connect", async () => {
        const query = gql`
            mutation {
                updateUsers(connect: { content: {} }) {
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
            	OPTIONAL MATCH (this_connect_content0_node:Comment)
            CALL apoc.do.when(this_connect_content0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            RETURN this, this_connect_content0_node, [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_CONTENT', toName: 'Comment', id: id(this), toID: id(this_connect_content0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_connect_content0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_content0_node:this_connect_content0_node})
            YIELD value
            WITH this, this_connect_content0_node, value.this_connect_content0_node_mutateMeta as this_connect_content_mutateMeta
            RETURN REDUCE(tmp1_this_connect_content_mutateMeta = [], tmp2_this_connect_content_mutateMeta IN COLLECT(this_connect_content_mutateMeta) | tmp1_this_connect_content_mutateMeta + tmp2_this_connect_content_mutateMeta) as this_connect_content_mutateMeta
            UNION
            WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Post)
            WITH this, this_connect_content0_node
            	CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.do.when(this_connect_content0_node IS NOT NULL AND this IS NOT NULL, \\"
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            RETURN this, this_connect_content0_node, [ metaVal IN [{type: 'Connected', name: 'User', relationshipName: 'HAS_CONTENT', toName: 'Post', id: id(this), toID: id(this_connect_content0_node)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_connect_content0_node_mutateMeta
            \\", \\"\\", {this:this, this_connect_content0_node:this_connect_content0_node})
            YIELD value
            WITH this, this_connect_content0_node, value.this_connect_content0_node_mutateMeta as this_connect_content_mutateMeta
            RETURN REDUCE(tmp1_this_connect_content_mutateMeta = [], tmp2_this_connect_content_mutateMeta IN COLLECT(this_connect_content_mutateMeta) | tmp1_this_connect_content_mutateMeta + tmp2_this_connect_content_mutateMeta) as this_connect_content_mutateMeta
            }
            WITH this, this_connect_content_mutateMeta as mutateMeta
            RETURN mutateMeta, this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {}
                }
            }"
        `);
    });

    test("Disconnect", async () => {
        const query = gql`
            mutation {
                updateUsers(disconnect: { content: {} }) {
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
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
            WITH this, this_disconnect_content0, this_disconnect_content0_rel, [ metaVal IN [{type: 'Disconnected', name: 'User', toName: 'Comment', relationshipName: 'HAS_CONTENT', id: id(this), toID: id(this_disconnect_content0), relationshipID: id(this_disconnect_content0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_mutateMeta
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
            )
            RETURN REDUCE(tmp1_this_mutateMeta = [], tmp2_this_mutateMeta IN COLLECT(this_mutateMeta) | tmp1_this_mutateMeta + tmp2_this_mutateMeta) as this_mutateMeta
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            WITH this, this_disconnect_content0, this_disconnect_content0_rel
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this, this_disconnect_content0, this_disconnect_content0_rel, [ metaVal IN [{type: 'Disconnected', name: 'User', toName: 'Post', relationshipName: 'HAS_CONTENT', id: id(this), toID: id(this_disconnect_content0), relationshipID: id(this_disconnect_content0_rel)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as this_mutateMeta
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
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
                            \\"content\\": [
                                {}
                            ]
                        }
                    }
                },
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {}
                }
            }"
        `);
    });

    test("Delete nodes with bind", async () => {
        const query = gql`
            mutation {
                deletePosts {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this, [ metaVal IN [{type: 'Deleted', name: 'Post', id: id(this)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            DETACH DELETE this
            RETURN mutateMeta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {}
                }
            }"
        `);
    });

    test("Delete nodes without bind", async () => {
        const query = gql`
            mutation {
                deleteComments {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Comment)
            WITH this, [ metaVal IN [{type: 'Deleted', name: 'Comment', id: id(this)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            DETACH DELETE this
            RETURN mutateMeta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested Delete", async () => {
        const query = gql`
            mutation {
                deleteUsers(delete: { content: { where: {} } }) {
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
            OPTIONAL MATCH (this)-[this_content_Comment0_relationship:HAS_CONTENT]->(this_content_Comment0:Comment)
            WITH this, this_content_Comment0, collect(DISTINCT this_content_Comment0) as this_content_Comment0_to_delete, [ metaVal IN [{type: 'Deleted', name: 'Comment', id: id(this_content_Comment0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_content_Comment0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            OPTIONAL MATCH (this)-[this_content_Post0_relationship:HAS_CONTENT]->(this_content_Post0:Post)
            WITH this, this_content_Post0, mutateMeta
            CALL apoc.util.validate(NOT(apoc.util.validatePredicate(NOT($auth.isAuthenticated = true), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this, this_content_Post0, collect(DISTINCT this_content_Post0) as this_content_Post0_to_delete, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'Post', id: id(this_content_Post0)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            FOREACH(x IN this_content_Post0_to_delete | DETACH DELETE x)
            WITH this, REDUCE(tmp1_mutateMeta = [], tmp2_mutateMeta IN COLLECT(mutateMeta) | tmp1_mutateMeta + tmp2_mutateMeta) as mutateMeta
            WITH this, mutateMeta + [ metaVal IN [{type: 'Deleted', name: 'User', id: id(this)}] WHERE metaVal IS NOT NULL AND metaVal.id IS NOT NULL AND (metaVal.toID IS NOT NULL OR metaVal.toName IS NULL) ] as mutateMeta
            DETACH DELETE this
            RETURN mutateMeta"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth\\": {
                    \\"isAuthenticated\\": true,
                    \\"roles\\": [],
                    \\"jwt\\": {}
                }
            }"
        `);
    });
});
