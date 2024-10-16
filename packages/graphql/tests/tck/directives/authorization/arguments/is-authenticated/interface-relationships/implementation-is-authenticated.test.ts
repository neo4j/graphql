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

import { Neo4jGraphQL } from "../../../../../../../src";
import { createBearerToken } from "../../../../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../../../../utils/tck-test-utils";

describe("Cypher Auth isAuthenticated", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type History @node {
                url: String @authentication(operations: [READ])
            }

            interface Content {
                id: String
                content: String
            }

            type Comment implements Content @node {
                id: String
                content: String
            }

            type Post implements Content @authentication @node {
                id: String
                content: String
            }

            type User @node {
                id: ID
                name: String
                password: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
    });

    test("Create Node with isAuthenticated", async () => {
        const query = /* GraphQL */ `
            mutation {
                createPosts(input: [{ id: "1", content: "content" }]) {
                    posts {
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
                CREATE (create_this1:Post)
                SET
                    create_this1.id = create_var0.id,
                    create_this1.content = create_var0.content
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"content\\": \\"content\\"
                    }
                ]
            }"
        `);
    });

    test("Create Node without isAuthenticated", async () => {
        const query = /* GraphQL */ `
            mutation {
                createComments(input: [{ id: "1", content: "content" }]) {
                    comments {
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
                CREATE (create_this1:Comment)
                SET
                    create_this1.id = create_var0.id,
                    create_this1.content = create_var0.content
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"1\\",
                        \\"content\\": \\"content\\"
                    }
                ]
            }"
        `);
    });

    test("Update Node with bind", async () => {
        const query = /* GraphQL */ `
            mutation {
                updatePosts(where: { id_EQ: "1" }, update: { id: "id-1" }) {
                    posts {
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
            "MATCH (this:Post)
            WHERE this.id = $param0
            SET this.id = $this_update_id
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"this_update_id\\": \\"id-1\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Update Node without bind", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateComments(where: { id_EQ: "1" }, update: { id: "id-1" }) {
                    comments {
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
            "MATCH (this:Comment)
            WHERE this.id = $param0
            SET this.id = $this_update_id
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"this_update_id\\": \\"id-1\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Delete nodes with bind", async () => {
        const query = /* GraphQL */ `
            mutation {
                deletePosts {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Delete nodes without bind", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteComments {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Comment)
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("Nested Delete", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteUsers(delete: { content: { where: {} } }) {
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
            WITH *
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                WITH this0, collect(DISTINCT this1) AS var2
                CALL {
                    WITH var2
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            CALL {
                WITH *
                OPTIONAL MATCH (this)-[this4:HAS_CONTENT]->(this5:Post)
                WITH this4, collect(DISTINCT this5) AS var6
                CALL {
                    WITH var6
                    UNWIND var6 AS var7
                    DETACH DELETE var7
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
