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

import { gql } from "graphql-tag";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../../src";
import { createJwtRequest } from "../../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../../utils/tck-test-utils";

describe("Cypher Auth isAuthenticated", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type History {
                url: String @authentication(operations: [READ])
            }

            type Post {
                id: String
                content: String
            }

            type User {
                id: ID
                name: String
                password: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User @authentication

            extend type Post @authentication(operations: [CREATE_RELATIONSHIP, DELETE_RELATIONSHIP, DELETE])

            extend type User {
                password: String @authentication(operations: [READ, CREATE, UPDATE])
            }

            extend type User {
                history: [History]
                    @cypher(statement: "MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h")
                    @authentication(operations: [READ])
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
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
            "MATCH (this:\`User\`)
            WITH *
            WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
            RETURN this { .id, .name } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true
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
            "MATCH (this:\`User\`)
            WITH *
            WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
            WITH *
            WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
            RETURN this { .id, .name, .password } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true
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
            "MATCH (this:\`User\`)
            WITH *
            WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
            WITH *
            WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
            CALL {
                WITH this
                UNWIND apoc.cypher.runFirstColumnMany(\\"MATCH (this)-[:HAS_HISTORY]->(h:History) RETURN h\\", { this: this, auth: $auth }) AS this0
                RETURN collect(this0 { .url }) AS this0
            }
            RETURN this { history: this0 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"auth\\": {
                    \\"isAuthenticated\\": false,
                    \\"roles\\": []
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:\`User\`)
                SET
                    create_this1.id = create_var0.id
                WITH *
                WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
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
                \\"resolvedCallbacks\\": {}
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
            "UNWIND $create_param0 AS create_var0
            CALL {
                WITH create_var0
                CREATE (create_this1:\`User\`)
                SET
                    create_this1.id = create_var0.id,
                    create_this1.password = create_var0.password
                WITH *
                WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
                WITH *
                WHERE apoc.util.validatePredicate((create_var0.password IS NOT NULL AND $isAuthenticated = false), \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
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
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WITH *
            WHERE (this.id = $param0 AND apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))
            SET this.id = $this_update_id
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"isAuthenticated\\": true,
                \\"this_update_id\\": \\"id-1\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WITH *
            WHERE (this.id = $param0 AND apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))
            WITH this
            WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
            SET this.password = $this_update_password
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"isAuthenticated\\": true,
                \\"this_update_password\\": \\"password\\",
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WITH *
            WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
            WITH this
            CALL {
            	WITH this
            	OPTIONAL MATCH (this_connect_posts0_node:Post)
            	WHERE (apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]) AND apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))
            	CALL {
            		WITH *
            		WITH collect(this_connect_posts0_node) as connectedNodes, collect(this) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this
            			UNWIND connectedNodes as this_connect_posts0_node
            			MERGE (this)-[:HAS_POST]->(this_connect_posts0_node)
            			RETURN count(*) AS _
            		}
            		RETURN count(*) AS _
            	}
            WITH this, this_connect_posts0_node
            	RETURN count(*) AS connect_this_connect_posts_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"resolvedCallbacks\\": {}
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
            "MATCH (this:\`User\`)
            WITH *
            WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)-[this_disconnect_posts0_rel:HAS_POST]->(this_disconnect_posts0:Post)
            WHERE (apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]) AND apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0]))
            CALL {
            	WITH this_disconnect_posts0, this_disconnect_posts0_rel, this
            	WITH collect(this_disconnect_posts0) as this_disconnect_posts0, this_disconnect_posts0_rel, this
            	UNWIND this_disconnect_posts0 as x
            	DELETE this_disconnect_posts0_rel
            	RETURN count(*) AS _
            }
            RETURN count(*) AS disconnect_this_disconnect_posts_Post
            }
            WITH *
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
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
            "MATCH (this:\`User\`)
            WITH *
            WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true
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
            "MATCH (this:\`User\`)
            WITH *
            WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
            WITH this
            OPTIONAL MATCH (this)-[this_posts0_relationship:HAS_POST]->(this_posts0:Post)
            WHERE apoc.util.validatePredicate($isAuthenticated = false, \\"@neo4j/graphql/UNAUTHENTICATED\\", [0])
            WITH this, collect(DISTINCT this_posts0) AS this_posts0_to_delete
            CALL {
            	WITH this_posts0_to_delete
            	UNWIND this_posts0_to_delete AS x
            	DETACH DELETE x
            	RETURN count(*) AS _
            }
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true
            }"
        `);
    });
});
