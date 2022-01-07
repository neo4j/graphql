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
import { createJwtRequest } from "../../../../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../../../../utils/tck-test-utils";

describe("Cypher Auth Where", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Content {
                id: ID
                content: String
                creator: User @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type User {
                id: ID
                name: String
                content: [Content] @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            type Comment implements Content {
                id: ID
                content: String
                creator: User
            }

            type Post implements Content
                @auth(
                    rules: [
                        {
                            operations: [READ, UPDATE, DELETE, CONNECT, DISCONNECT]
                            where: { creator: { id: "$jwt.sub" } }
                        }
                    ]
                ) {
                id: ID
                content: String
                creator: User
            }

            extend type User
                @auth(rules: [{ operations: [READ, UPDATE, DELETE, CONNECT, DISCONNECT], where: { id: "$jwt.sub" } }])

            extend type User {
                password: String! @auth(rules: [{ operations: [READ], where: { id: "$jwt.sub" } }])
            }

            extend type Post {
                secretKey: String! @auth(rules: [{ operations: [READ], where: { creator: { id: "$jwt.sub" } } }])
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
                posts {
                    id
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE EXISTS((this)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_where0_creator_id)
            RETURN this { .id } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Read Node + User Defined Where", async () => {
        const query = gql`
            {
                posts(where: { content: "bob" }) {
                    id
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE this.content = $this_content AND EXISTS((this)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_where0_creator_id)
            RETURN this { .id } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_content\\": \\"bob\\",
                \\"this_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Read interface relationship field", async () => {
        const query = gql`
            {
                users {
                    id
                    content {
                        ... on Post {
                            id
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
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            MATCH (this)-[:HAS_CONTENT]->(this_Comment:Comment)
            RETURN { __resolveType: \\"Comment\\" } AS content
            UNION
            WITH this
            MATCH (this)-[:HAS_CONTENT]->(this_Post:Post)
            WHERE EXISTS((this_Post)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_Post)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_where0_creator_id)
            RETURN { __resolveType: \\"Post\\", id: this_Post.id } AS content
            }
            RETURN this { .id, content: collect(content) } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_Post_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Read interface relationship Using Connection", async () => {
        const query = gql`
            {
                users {
                    id
                    contentConnection {
                        edges {
                            node {
                                ... on Post {
                                    id
                                }
                            }
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
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_has_content_relationship:HAS_CONTENT]->(this_Comment:Comment)
            WITH { node: { __resolveType: \\"Comment\\" } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_has_content_relationship:HAS_CONTENT]->(this_Post:Post)
            WHERE EXISTS((this_Post)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_Post)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_where0_creator_id)
            WITH { node: { __resolveType: \\"Post\\", id: this_Post.id } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges
            RETURN { edges: edges, totalCount: size(edges) } AS contentConnection
            }
            RETURN this { .id, contentConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_Post_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Read interface relationship Using Connection + User Defined Where", async () => {
        const query = gql`
            {
                users {
                    id
                    contentConnection(where: { node: { id: "some-id" } }) {
                        edges {
                            node {
                                ... on Post {
                                    id
                                }
                            }
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
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            CALL {
            WITH this
            CALL {
            WITH this
            MATCH (this)-[this_has_content_relationship:HAS_CONTENT]->(this_Comment:Comment)
            WHERE this_Comment.id = $this_contentConnection.args.where.node.id
            WITH { node: { __resolveType: \\"Comment\\" } } AS edge
            RETURN edge
            UNION
            WITH this
            MATCH (this)-[this_has_content_relationship:HAS_CONTENT]->(this_Post:Post)
            WHERE this_Post.id = $this_contentConnection.args.where.node.id AND EXISTS((this_Post)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_Post)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_Post_auth_where0_creator_id)
            WITH { node: { __resolveType: \\"Post\\", id: this_Post.id } } AS edge
            RETURN edge
            }
            WITH collect(edge) as edges
            RETURN { edges: edges, totalCount: size(edges) } AS contentConnection
            }
            RETURN this { .id, contentConnection } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_Post_auth_where0_creator_id\\": \\"id-01\\",
                \\"this_contentConnection\\": {
                    \\"args\\": {
                        \\"where\\": {
                            \\"node\\": {
                                \\"id\\": \\"some-id\\"
                            }
                        }
                    }
                }
            }"
        `);
    });

    test("Update Node", async () => {
        const query = gql`
            mutation {
                updatePosts(update: { content: "Bob" }) {
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
            WHERE EXISTS((this)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_where0_creator_id)
            SET this.content = $this_update_content
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_creator_id\\": \\"id-01\\",
                \\"this_update_content\\": \\"Bob\\"
            }"
        `);
    });

    test("Update Node + User Defined Where", async () => {
        const query = gql`
            mutation {
                updatePosts(where: { content: "bob" }, update: { content: "Bob" }) {
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
            WHERE this.content = $this_content AND EXISTS((this)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_where0_creator_id)
            SET this.content = $this_update_content
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_content\\": \\"bob\\",
                \\"this_auth_where0_creator_id\\": \\"id-01\\",
                \\"this_update_content\\": \\"Bob\\"
            }"
        `);
    });

    test("Update Nested Node", async () => {
        const query = gql`
            mutation {
                updateUsers(update: { content: { update: { node: { id: "new-id" } } } }) {
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
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Comment)
            CALL apoc.do.when(this_content0 IS NOT NULL, \\"
            SET this_content0.id = $this_update_content0_id
            RETURN count(*)
            \\", \\"\\", {this:this, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_id:$this_update_content0_id})
            YIELD value as _
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_has_content0_relationship:HAS_CONTENT]->(this_content0:Post)
            WHERE EXISTS((this_content0)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content0_auth_where0_creator_id)
            CALL apoc.do.when(this_content0 IS NOT NULL, \\"
            SET this_content0.id = $this_update_content0_id
            RETURN count(*)
            \\", \\"\\", {this:this, updateUsers: $updateUsers, this_content0:this_content0, auth:$auth,this_update_content0_id:$this_update_content0_id})
            YIELD value as _
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_update_content0_id\\": \\"new-id\\",
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
                \\"this_content0_auth_where0_creator_id\\": \\"id-01\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"content\\": [
                                {
                                    \\"update\\": {
                                        \\"node\\": {
                                            \\"id\\": \\"new-id\\"
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

    test("Delete Node", async () => {
        const query = gql`
            mutation {
                deletePosts {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE EXISTS((this)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_where0_creator_id)
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Delete Node + User Defined Where", async () => {
        const query = gql`
            mutation {
                deletePosts(where: { content: "Bob" }) {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE this.content = $this_content AND EXISTS((this)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_auth_where0_creator_id)
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_content\\": \\"Bob\\",
                \\"this_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Delete Nested Node", async () => {
        const query = gql`
            mutation {
                deleteUsers(delete: { content: { where: {} } }) {
                    nodesDeleted
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            OPTIONAL MATCH (this)-[this_content_Comment0_relationship:HAS_CONTENT]->(this_content_Comment0:Comment)
            WITH this, collect(DISTINCT this_content_Comment0) as this_content_Comment0_to_delete
            FOREACH(x IN this_content_Comment0_to_delete | DETACH DELETE x)
            WITH this
            OPTIONAL MATCH (this)-[this_content_Post0_relationship:HAS_CONTENT]->(this_content_Post0:Post)
            WHERE EXISTS((this_content_Post0)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_content_Post0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content_Post0_auth_where0_creator_id)
            WITH this, collect(DISTINCT this_content_Post0) as this_content_Post0_to_delete
            FOREACH(x IN this_content_Post0_to_delete | DETACH DELETE x)
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_content_Post0_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Connect Node (from create)", async () => {
        const query = gql`
            mutation {
                createUsers(
                    input: [
                        { id: "123", name: "Bob", password: "password", content: { connect: { where: { node: {} } } } }
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
            SET this0.password = $this0_password
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_content_connect0_node:Comment)
            	FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this0_content_connect0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:HAS_CONTENT]->(this0_content_connect0_node)
            		)
            	)
            	RETURN count(*)
            UNION
            	WITH this0
            	OPTIONAL MATCH (this0_content_connect0_node:Post)
            	WHERE EXISTS((this0_content_connect0_node)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this0_content_connect0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this0_content_connect0_node_auth_where0_creator_id)
            	FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this0_content_connect0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:HAS_CONTENT]->(this0_content_connect0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN this0
            }
            RETURN
            this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"123\\",
                \\"this0_name\\": \\"Bob\\",
                \\"this0_password\\": \\"password\\",
                \\"this0_content_connect0_node_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Connect Node + User Defined Where (from create)", async () => {
        const query = gql`
            mutation {
                createUsers(
                    input: [
                        {
                            id: "123"
                            name: "Bob"
                            password: "password"
                            content: { connect: { where: { node: { id: "post-id" } } } }
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
            SET this0.password = $this0_password
            WITH this0
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_content_connect0_node:Comment)
            	WHERE this0_content_connect0_node.id = $this0_content_connect0_node_id
            	FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this0_content_connect0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:HAS_CONTENT]->(this0_content_connect0_node)
            		)
            	)
            	RETURN count(*)
            UNION
            	WITH this0
            	OPTIONAL MATCH (this0_content_connect0_node:Post)
            	WHERE this0_content_connect0_node.id = $this0_content_connect0_node_id AND EXISTS((this0_content_connect0_node)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this0_content_connect0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this0_content_connect0_node_auth_where0_creator_id)
            	FOREACH(_ IN CASE this0 WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this0_content_connect0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this0)-[:HAS_CONTENT]->(this0_content_connect0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN this0
            }
            RETURN
            this0 { .id } AS this0"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"123\\",
                \\"this0_name\\": \\"Bob\\",
                \\"this0_password\\": \\"password\\",
                \\"this0_content_connect0_node_id\\": \\"post-id\\",
                \\"this0_content_connect0_node_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Connect Node (from update update)", async () => {
        const query = gql`
            mutation {
                updateUsers(update: { content: { connect: { where: { node: {} } } } }) {
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
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_content0_connect0_node:Comment)
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_content0_connect0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:HAS_CONTENT]->(this_content0_connect0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN count(*)
            UNION
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_content0_connect0_node:Post)
            	WHERE EXISTS((this_content0_connect0_node)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_content0_connect0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content0_connect0_node_auth_where0_creator_id)
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_content0_connect0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:HAS_CONTENT]->(this_content0_connect0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_content0_connect0_node_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Connect Node + User Defined Where (from update update)", async () => {
        const query = gql`
            mutation {
                updateUsers(update: { content: { connect: { where: { node: { id: "new-id" } } } } }) {
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
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_content0_connect0_node:Comment)
            	WHERE this_content0_connect0_node.id = $this_content0_connect0_node_id
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_content0_connect0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:HAS_CONTENT]->(this_content0_connect0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN count(*)
            UNION
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_content0_connect0_node:Post)
            	WHERE this_content0_connect0_node.id = $this_content0_connect0_node_id AND EXISTS((this_content0_connect0_node)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_content0_connect0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content0_connect0_node_auth_where0_creator_id)
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_content0_connect0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:HAS_CONTENT]->(this_content0_connect0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_content0_connect0_node_id\\": \\"new-id\\",
                \\"this_content0_connect0_node_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Connect Node (from update connect)", async () => {
        const query = gql`
            mutation {
                updateUsers(connect: { content: { where: { node: {} } } }) {
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
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Comment)
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_content0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            		)
            	)
            	RETURN count(*)
            UNION
            	WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Post)
            	WHERE EXISTS((this_connect_content0_node)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_connect_content0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_content0_node_auth_where0_creator_id)
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_content0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_connect_content0_node_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Connect Node + User Defined Where (from update connect)", async () => {
        const query = gql`
            mutation {
                updateUsers(connect: { content: { where: { node: { id: "some-id" } } } }) {
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
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Comment)
            	WHERE this_connect_content0_node.id = $this_connect_content0_node_id
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_content0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            		)
            	)
            	RETURN count(*)
            UNION
            	WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Post)
            	WHERE this_connect_content0_node.id = $this_connect_content0_node_id AND EXISTS((this_connect_content0_node)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_connect_content0_node)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_connect_content0_node_auth_where0_creator_id)
            	FOREACH(_ IN CASE this WHEN NULL THEN [] ELSE [1] END |
            		FOREACH(_ IN CASE this_connect_content0_node WHEN NULL THEN [] ELSE [1] END |
            			MERGE (this)-[:HAS_CONTENT]->(this_connect_content0_node)
            		)
            	)
            	RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_connect_content0_node_id\\": \\"some-id\\",
                \\"this_connect_content0_node_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Disconnect Node (from update update)", async () => {
        const query = gql`
            mutation {
                updateUsers(update: { content: { disconnect: { where: {} } } }) {
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
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content0_disconnect0_rel:HAS_CONTENT]->(this_content0_disconnect0:Comment)
            FOREACH(_ IN CASE this_content0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_content0_disconnect0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            UNION
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content0_disconnect0_rel:HAS_CONTENT]->(this_content0_disconnect0:Post)
            WHERE EXISTS((this_content0_disconnect0)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_content0_disconnect0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content0_disconnect0_auth_where0_creator_id)
            FOREACH(_ IN CASE this_content0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_content0_disconnect0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_content0_disconnect0_auth_where0_creator_id\\": \\"id-01\\"
            }"
        `);
    });

    test("Disconnect Node + User Defined Where (from update update)", async () => {
        const query = gql`
            mutation {
                updateUsers(update: { content: [{ disconnect: { where: { node: { id: "new-id" } } } }] }) {
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
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content0_disconnect0_rel:HAS_CONTENT]->(this_content0_disconnect0:Comment)
            WHERE this_content0_disconnect0.id = $updateUsers.args.update.content[0].disconnect[0].where.node.id
            FOREACH(_ IN CASE this_content0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_content0_disconnect0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            UNION
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content0_disconnect0_rel:HAS_CONTENT]->(this_content0_disconnect0:Post)
            WHERE this_content0_disconnect0.id = $updateUsers.args.update.content[0].disconnect[0].where.node.id AND EXISTS((this_content0_disconnect0)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_content0_disconnect0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_content0_disconnect0_auth_where0_creator_id)
            FOREACH(_ IN CASE this_content0_disconnect0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_content0_disconnect0_rel
            )
            RETURN count(*)
            }
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_content0_disconnect0_auth_where0_creator_id\\": \\"id-01\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"update\\": {
                            \\"content\\": [
                                {
                                    \\"disconnect\\": [
                                        {
                                            \\"where\\": {
                                                \\"node\\": {
                                                    \\"id\\": \\"new-id\\"
                                                }
                                            }
                                        }
                                    ]
                                }
                            ]
                        }
                    }
                }
            }"
        `);
    });

    test("Disconnect Node (from update disconnect)", async () => {
        const query = gql`
            mutation {
                updateUsers(disconnect: { content: { where: {} } }) {
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
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
            )
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            WHERE EXISTS((this_disconnect_content0)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0_auth_where0_creator_id)
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
            )
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_disconnect_content0_auth_where0_creator_id\\": \\"id-01\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"content\\": [
                                {
                                    \\"where\\": {}
                                }
                            ]
                        }
                    }
                }
            }"
        `);
    });

    test("Disconnect Node + User Defined Where (from update disconnect)", async () => {
        const query = gql`
            mutation {
                updateUsers(disconnect: { content: { where: { node: { id: "some-id" } } } }) {
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
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            WHERE this.id IS NOT NULL AND this.id = $this_auth_where0_id
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Comment)
            WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
            )
            RETURN count(*)
            UNION
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:HAS_CONTENT]->(this_disconnect_content0:Post)
            WHERE this_disconnect_content0.id = $updateUsers.args.disconnect.content[0].where.node.id AND EXISTS((this_disconnect_content0)<-[:HAS_CONTENT]-(:User)) AND ALL(creator IN [(this_disconnect_content0)<-[:HAS_CONTENT]-(creator:User) | creator] WHERE creator.id IS NOT NULL AND creator.id = $this_disconnect_content0_auth_where0_creator_id)
            FOREACH(_ IN CASE this_disconnect_content0 WHEN NULL THEN [] ELSE [1] END |
            DELETE this_disconnect_content0_rel
            )
            RETURN count(*)
            }
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_auth_where0_id\\": \\"id-01\\",
                \\"this_disconnect_content0_auth_where0_creator_id\\": \\"id-01\\",
                \\"updateUsers\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"content\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"id\\": \\"some-id\\"
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
