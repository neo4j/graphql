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

describe("Cypher Auth Where", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            interface Content
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
                creator: User! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type User {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            type Comment implements Content {
                id: ID
                content: String
                creator: User!
            }

            type Post implements Content {
                id: ID
                content: String
                creator: User!
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
            "MATCH (this:\`Post\`)
            WHERE (exists((this)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $auth_param0)))
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\"
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
            "MATCH (this:\`Post\`)
            WHERE (this.content = $param0 AND (exists((this)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $auth_param0))))
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"bob\\",
                \\"auth_param0\\": \\"id-01\\"
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:\`HAS_CONTENT\`]->(this1:\`Comment\`)
                    WHERE (exists((this1)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(this2 IN [(this1)<-[:\`HAS_CONTENT\`]-(this2:\`User\`) | this2] WHERE (this2.id IS NOT NULL AND this2.id = $param1)))
                    WITH this1 { __resolveType: \\"Comment\\", __id: id(this) } AS this1
                    RETURN this1 AS var3
                    UNION
                    WITH *
                    MATCH (this)-[this4:\`HAS_CONTENT\`]->(this5:\`Post\`)
                    WHERE (exists((this5)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(this6 IN [(this5)<-[:\`HAS_CONTENT\`]-(this6:\`User\`) | this6] WHERE (this6.id IS NOT NULL AND this6.id = $param2)))
                    WITH this5 { __resolveType: \\"Post\\", __id: id(this), .id } AS this5
                    RETURN this5 AS var3
                }
                WITH var3
                RETURN collect(var3) AS var3
            }
            RETURN this { .id, content: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"param1\\": \\"id-01\\",
                \\"param2\\": \\"id-01\\"
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:\`HAS_CONTENT\`]->(this1:\`Comment\`)
                    WHERE (exists((this1)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(this2 IN [(this1)<-[:\`HAS_CONTENT\`]-(this2:\`User\`) | this2] WHERE (this2.id IS NOT NULL AND this2.id = $param1)))
                    WITH { node: { __resolveType: \\"Comment\\", __id: id(this1) } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this3:\`HAS_CONTENT\`]->(this4:\`Post\`)
                    WHERE (exists((this4)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(this5 IN [(this4)<-[:\`HAS_CONTENT\`]-(this5:\`User\`) | this5] WHERE (this5.id IS NOT NULL AND this5.id = $param2)))
                    WITH { node: { __resolveType: \\"Post\\", __id: id(this4), id: this4.id } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var6
            }
            RETURN this { .id, contentConnection: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"param1\\": \\"id-01\\",
                \\"param2\\": \\"id-01\\"
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:\`HAS_CONTENT\`]->(this1:\`Comment\`)
                    WHERE (this1.id = $param1 AND (exists((this1)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(this2 IN [(this1)<-[:\`HAS_CONTENT\`]-(this2:\`User\`) | this2] WHERE (this2.id IS NOT NULL AND this2.id = $param2))))
                    WITH { node: { __resolveType: \\"Comment\\", __id: id(this1) } } AS edge
                    RETURN edge
                    UNION
                    WITH this
                    MATCH (this)-[this3:\`HAS_CONTENT\`]->(this4:\`Post\`)
                    WHERE (this4.id = $param3 AND (exists((this4)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(this5 IN [(this4)<-[:\`HAS_CONTENT\`]-(this5:\`User\`) | this5] WHERE (this5.id IS NOT NULL AND this5.id = $param4))))
                    WITH { node: { __resolveType: \\"Post\\", __id: id(this4), id: this4.id } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var6
            }
            RETURN this { .id, contentConnection: var6 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"param1\\": \\"some-id\\",
                \\"param2\\": \\"id-01\\",
                \\"param3\\": \\"some-id\\",
                \\"param4\\": \\"id-01\\"
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
            "MATCH (this:\`Post\`)
            WHERE (exists((this)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $auth_param0)))
            SET this.content = $this_update_content
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_creator_User_unique:\`HAS_CONTENT\`]-(:User)
            	WITH count(this_creator_User_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            	RETURN c AS this_creator_User_unique_ignored
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"this_update_content\\": \\"Bob\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`Post\`)
            WHERE (this.content = $param0 AND (exists((this)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $auth_param0))))
            SET this.content = $this_update_content
            WITH this
            CALL {
            	WITH this
            	MATCH (this)<-[this_creator_User_unique:\`HAS_CONTENT\`]-(:User)
            	WITH count(this_creator_User_unique) as c
            	CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            	RETURN c AS this_creator_User_unique_ignored
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"bob\\",
                \\"auth_param0\\": \\"id-01\\",
                \\"this_update_content\\": \\"Bob\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            WITH this
            CALL {
            	 WITH this
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_has_content0_relationship:\`HAS_CONTENT\`]->(this_content0:Comment)
            	WHERE (exists((this_content0)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_content0)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0auth_param0)))
            	SET this_content0.id = $this_update_content0_id
            	WITH this, this_content0
            	CALL {
            		WITH this_content0
            		MATCH (this_content0)<-[this_content0_creator_User_unique:\`HAS_CONTENT\`]-(:User)
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
            	MATCH (this)-[this_has_content0_relationship:\`HAS_CONTENT\`]->(this_content0:Post)
            	WHERE (exists((this_content0)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_content0)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0auth_param0)))
            	SET this_content0.id = $this_update_content0_id
            	WITH this, this_content0
            	CALL {
            		WITH this_content0
            		MATCH (this_content0)<-[this_content0_creator_User_unique:\`HAS_CONTENT\`]-(:User)
            		WITH count(this_content0_creator_User_unique) as c
            		CALL apoc.util.validate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDPost.creator required exactly once', [0])
            		RETURN c AS this_content0_creator_User_unique_ignored
            	}
            	RETURN count(*) AS update_this_content0
            }
            RETURN count(*) AS update_this_Post
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"this_content0auth_param0\\": \\"id-01\\",
                \\"this_update_content0_id\\": \\"new-id\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`Post\`)
            WHERE (exists((this)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $auth_param0)))
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\"
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
            "MATCH (this:\`Post\`)
            WHERE (this.content = $param0 AND (exists((this)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $auth_param0))))
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Bob\\",
                \\"auth_param0\\": \\"id-01\\"
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content_Comment0_relationship:HAS_CONTENT]->(this_content_Comment0:Comment)
            WHERE (exists((this_content_Comment0)<-[:HAS_CONTENT]-(:\`User\`)) AND all(auth_this0 IN [(this_content_Comment0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content_Comment0auth_param0)))
            WITH this_content_Comment0_relationship, collect(DISTINCT this_content_Comment0) AS this_content_Comment0_to_delete
            CALL {
            	WITH this_content_Comment0_to_delete
            	UNWIND this_content_Comment0_to_delete AS x
            	DETACH DELETE x
            }
            }
            WITH *
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content_Post0_relationship:HAS_CONTENT]->(this_content_Post0:Post)
            WHERE (exists((this_content_Post0)<-[:HAS_CONTENT]-(:\`User\`)) AND all(auth_this0 IN [(this_content_Post0)<-[:HAS_CONTENT]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content_Post0auth_param0)))
            WITH this_content_Post0_relationship, collect(DISTINCT this_content_Post0) AS this_content_Post0_to_delete
            CALL {
            	WITH this_content_Post0_to_delete
            	UNWIND this_content_Post0_to_delete AS x
            	DETACH DELETE x
            }
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"this_content_Comment0auth_param0\\": \\"id-01\\",
                \\"this_content_Post0auth_param0\\": \\"id-01\\"
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
            	WHERE (exists((this0_content_connect0_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this0_content_connect0_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this0_content_connect0_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this0_content_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_content_connect0_node
            			MERGE (this0)-[:\`HAS_CONTENT\`]->(this0_content_connect0_node)
            		}
            	}
            WITH this0, this0_content_connect0_node
            	RETURN count(*) AS connect_this0_content_connect_Comment
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_content_connect1_node:Post)
            	WHERE (exists((this0_content_connect1_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this0_content_connect1_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this0_content_connect1_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this0_content_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_content_connect1_node
            			MERGE (this0)-[:\`HAS_CONTENT\`]->(this0_content_connect1_node)
            		}
            	}
            WITH this0, this0_content_connect1_node
            	RETURN count(*) AS connect_this0_content_connect_Post
            }
            RETURN this0
            }
            RETURN [ this0 { .id } ] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"123\\",
                \\"this0_name\\": \\"Bob\\",
                \\"this0_password\\": \\"password\\",
                \\"this0_content_connect0_nodeauth_param0\\": \\"id-01\\",
                \\"this0_content_connect1_nodeauth_param0\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
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
            	WHERE this0_content_connect0_node.id = $this0_content_connect0_node_param0 AND (exists((this0_content_connect0_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this0_content_connect0_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this0_content_connect0_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this0_content_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_content_connect0_node
            			MERGE (this0)-[:\`HAS_CONTENT\`]->(this0_content_connect0_node)
            		}
            	}
            WITH this0, this0_content_connect0_node
            	RETURN count(*) AS connect_this0_content_connect_Comment
            }
            CALL {
            		WITH this0
            	OPTIONAL MATCH (this0_content_connect1_node:Post)
            	WHERE this0_content_connect1_node.id = $this0_content_connect1_node_param0 AND (exists((this0_content_connect1_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this0_content_connect1_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this0_content_connect1_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this0_content_connect1_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_content_connect1_node
            			MERGE (this0)-[:\`HAS_CONTENT\`]->(this0_content_connect1_node)
            		}
            	}
            WITH this0, this0_content_connect1_node
            	RETURN count(*) AS connect_this0_content_connect_Post
            }
            RETURN this0
            }
            RETURN [ this0 { .id } ] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_id\\": \\"123\\",
                \\"this0_name\\": \\"Bob\\",
                \\"this0_password\\": \\"password\\",
                \\"this0_content_connect0_node_param0\\": \\"post-id\\",
                \\"this0_content_connect0_nodeauth_param0\\": \\"id-01\\",
                \\"this0_content_connect1_node_param0\\": \\"post-id\\",
                \\"this0_content_connect1_nodeauth_param0\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            WITH this
            CALL {
            	 WITH this
            WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_content0_connect0_node:Comment)
            	WHERE (exists((this_content0_connect0_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_content0_connect0_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0_connect0_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this_content0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_content0_connect0_node
            			MERGE (this)-[:\`HAS_CONTENT\`]->(this_content0_connect0_node)
            		}
            	}
            WITH this, this_content0_connect0_node
            	RETURN count(*) AS connect_this_content0_connect_Comment
            }
            RETURN count(*) AS update_this_Comment
            }
            CALL {
            	 WITH this
            	WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_content0_connect0_node:Post)
            	WHERE (exists((this_content0_connect0_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_content0_connect0_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0_connect0_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this_content0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_content0_connect0_node
            			MERGE (this)-[:\`HAS_CONTENT\`]->(this_content0_connect0_node)
            		}
            	}
            WITH this, this_content0_connect0_node
            	RETURN count(*) AS connect_this_content0_connect_Post
            }
            RETURN count(*) AS update_this_Post
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"this_content0_connect0_nodeauth_param0\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            WITH this
            CALL {
            	 WITH this
            WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_content0_connect0_node:Comment)
            	WHERE this_content0_connect0_node.id = $this_content0_connect0_node_param0 AND (exists((this_content0_connect0_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_content0_connect0_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0_connect0_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this_content0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_content0_connect0_node
            			MERGE (this)-[:\`HAS_CONTENT\`]->(this_content0_connect0_node)
            		}
            	}
            WITH this, this_content0_connect0_node
            	RETURN count(*) AS connect_this_content0_connect_Comment
            }
            RETURN count(*) AS update_this_Comment
            }
            CALL {
            	 WITH this
            	WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_content0_connect0_node:Post)
            	WHERE this_content0_connect0_node.id = $this_content0_connect0_node_param0 AND (exists((this_content0_connect0_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_content0_connect0_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0_connect0_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this_content0_connect0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_content0_connect0_node
            			MERGE (this)-[:\`HAS_CONTENT\`]->(this_content0_connect0_node)
            		}
            	}
            WITH this, this_content0_connect0_node
            	RETURN count(*) AS connect_this_content0_connect_Post
            }
            RETURN count(*) AS update_this_Post
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"this_content0_connect0_node_param0\\": \\"new-id\\",
                \\"this_content0_connect0_nodeauth_param0\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Comment)
            	WHERE (exists((this_connect_content0_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_connect_content0_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_connect_content0_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this_connect_content0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_content0_node
            			MERGE (this)-[:\`HAS_CONTENT\`]->(this_connect_content0_node)
            		}
            	}
            WITH this, this_connect_content0_node
            	RETURN count(*) AS connect_this_connect_content_Comment
            }
            CALL {
            		WITH this
            	OPTIONAL MATCH (this_connect_content1_node:Post)
            	WHERE (exists((this_connect_content1_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_connect_content1_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_connect_content1_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this_connect_content1_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_content1_node
            			MERGE (this)-[:\`HAS_CONTENT\`]->(this_connect_content1_node)
            		}
            	}
            WITH this, this_connect_content1_node
            	RETURN count(*) AS connect_this_connect_content_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"this_connect_content0_nodeauth_param0\\": \\"id-01\\",
                \\"this_connect_content1_nodeauth_param0\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_content0_node:Comment)
            	WHERE this_connect_content0_node.id = $this_connect_content0_node_param0 AND (exists((this_connect_content0_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_connect_content0_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_connect_content0_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this_connect_content0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_content0_node
            			MERGE (this)-[:\`HAS_CONTENT\`]->(this_connect_content0_node)
            		}
            	}
            WITH this, this_connect_content0_node
            	RETURN count(*) AS connect_this_connect_content_Comment
            }
            CALL {
            		WITH this
            	OPTIONAL MATCH (this_connect_content1_node:Post)
            	WHERE this_connect_content1_node.id = $this_connect_content1_node_param0 AND (exists((this_connect_content1_node)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_connect_content1_node)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_connect_content1_nodeauth_param0)))
            	CALL {
            		WITH *
            		WITH collect(this_connect_content1_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_content1_node
            			MERGE (this)-[:\`HAS_CONTENT\`]->(this_connect_content1_node)
            		}
            	}
            WITH this, this_connect_content1_node
            	RETURN count(*) AS connect_this_connect_content_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"this_connect_content0_node_param0\\": \\"some-id\\",
                \\"this_connect_content0_nodeauth_param0\\": \\"id-01\\",
                \\"this_connect_content1_node_param0\\": \\"some-id\\",
                \\"this_connect_content1_nodeauth_param0\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            WITH this
            CALL {
            	 WITH this
            WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content0_disconnect0_rel:\`HAS_CONTENT\`]->(this_content0_disconnect0:Comment)
            WHERE (exists((this_content0_disconnect0)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_content0_disconnect0)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0_disconnect0auth_param0)))
            CALL {
            	WITH this_content0_disconnect0, this_content0_disconnect0_rel, this
            	WITH collect(this_content0_disconnect0) as this_content0_disconnect0, this_content0_disconnect0_rel, this
            	UNWIND this_content0_disconnect0 as x
            	DELETE this_content0_disconnect0_rel
            }
            RETURN count(*) AS disconnect_this_content0_disconnect_Comment
            }
            RETURN count(*) AS update_this_Comment
            }
            CALL {
            	 WITH this
            	WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content0_disconnect0_rel:\`HAS_CONTENT\`]->(this_content0_disconnect0:Post)
            WHERE (exists((this_content0_disconnect0)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_content0_disconnect0)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0_disconnect0auth_param0)))
            CALL {
            	WITH this_content0_disconnect0, this_content0_disconnect0_rel, this
            	WITH collect(this_content0_disconnect0) as this_content0_disconnect0, this_content0_disconnect0_rel, this
            	UNWIND this_content0_disconnect0 as x
            	DELETE this_content0_disconnect0_rel
            }
            RETURN count(*) AS disconnect_this_content0_disconnect_Post
            }
            RETURN count(*) AS update_this_Post
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"this_content0_disconnect0auth_param0\\": \\"id-01\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            WITH this
            CALL {
            	 WITH this
            WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content0_disconnect0_rel:\`HAS_CONTENT\`]->(this_content0_disconnect0:Comment)
            WHERE this_content0_disconnect0.id = $updateUsers_args_update_content0_disconnect0_where_Comment_this_content0_disconnect0param0 AND (exists((this_content0_disconnect0)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_content0_disconnect0)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0_disconnect0auth_param0)))
            CALL {
            	WITH this_content0_disconnect0, this_content0_disconnect0_rel, this
            	WITH collect(this_content0_disconnect0) as this_content0_disconnect0, this_content0_disconnect0_rel, this
            	UNWIND this_content0_disconnect0 as x
            	DELETE this_content0_disconnect0_rel
            }
            RETURN count(*) AS disconnect_this_content0_disconnect_Comment
            }
            RETURN count(*) AS update_this_Comment
            }
            CALL {
            	 WITH this
            	WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_content0_disconnect0_rel:\`HAS_CONTENT\`]->(this_content0_disconnect0:Post)
            WHERE this_content0_disconnect0.id = $updateUsers_args_update_content0_disconnect0_where_Post_this_content0_disconnect0param0 AND (exists((this_content0_disconnect0)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_content0_disconnect0)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_content0_disconnect0auth_param0)))
            CALL {
            	WITH this_content0_disconnect0, this_content0_disconnect0_rel, this
            	WITH collect(this_content0_disconnect0) as this_content0_disconnect0, this_content0_disconnect0_rel, this
            	UNWIND this_content0_disconnect0 as x
            	DELETE this_content0_disconnect0_rel
            }
            RETURN count(*) AS disconnect_this_content0_disconnect_Post
            }
            RETURN count(*) AS update_this_Post
            }
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"updateUsers_args_update_content0_disconnect0_where_Comment_this_content0_disconnect0param0\\": \\"new-id\\",
                \\"this_content0_disconnect0auth_param0\\": \\"id-01\\",
                \\"updateUsers_args_update_content0_disconnect0_where_Post_this_content0_disconnect0param0\\": \\"new-id\\",
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
                },
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:\`HAS_CONTENT\`]->(this_disconnect_content0:Comment)
            WHERE (exists((this_disconnect_content0)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_disconnect_content0)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Comment
            }
            CALL {
            	WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:\`HAS_CONTENT\`]->(this_disconnect_content0:Post)
            WHERE (exists((this_disconnect_content0)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_disconnect_content0)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"this_disconnect_content0auth_param0\\": \\"id-01\\",
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
                },
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WHERE (this.id IS NOT NULL AND this.id = $auth_param0)
            WITH this
            WHERE (this.id IS NOT NULL AND this.id = $thisauth_param0)
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:\`HAS_CONTENT\`]->(this_disconnect_content0:Comment)
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Comment_this_disconnect_content0param0 AND (exists((this_disconnect_content0)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_disconnect_content0)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Comment
            }
            CALL {
            	WITH this
            OPTIONAL MATCH (this)-[this_disconnect_content0_rel:\`HAS_CONTENT\`]->(this_disconnect_content0:Post)
            WHERE this_disconnect_content0.id = $updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0 AND (exists((this_disconnect_content0)<-[:\`HAS_CONTENT\`]-(:\`User\`)) AND all(auth_this0 IN [(this_disconnect_content0)<-[:\`HAS_CONTENT\`]-(auth_this0:\`User\`) | auth_this0] WHERE (auth_this0.id IS NOT NULL AND auth_this0.id = $this_disconnect_content0auth_param0)))
            CALL {
            	WITH this_disconnect_content0, this_disconnect_content0_rel, this
            	WITH collect(this_disconnect_content0) as this_disconnect_content0, this_disconnect_content0_rel, this
            	UNWIND this_disconnect_content0 as x
            	DELETE this_disconnect_content0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_content_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"auth_param0\\": \\"id-01\\",
                \\"thisauth_param0\\": \\"id-01\\",
                \\"updateUsers_args_disconnect_content0_where_Comment_this_disconnect_content0param0\\": \\"some-id\\",
                \\"this_disconnect_content0auth_param0\\": \\"id-01\\",
                \\"updateUsers_args_disconnect_content0_where_Post_this_disconnect_content0param0\\": \\"some-id\\",
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
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
