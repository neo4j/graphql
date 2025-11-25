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

import { Neo4jGraphQL } from "../../../../../../src";
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../../../utils/tck-test-utils";

describe("Cypher Auth Allow", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Post @node {
                id: ID
                creator: [User!]! @relationship(type: "HAS_POST", direction: IN)
            }

            type User @node {
                id: ID
                name: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User
                @authorization(
                    validate: {
                        when: AFTER
                        operations: [CREATE, UPDATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                        where: { node: { id: { eq: "$jwt.sub" } } }
                    }
                )

            extend type Post
                @authorization(
                    validate: [
                        {
                            when: AFTER
                            operations: [CREATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                            where: { node: { creator: { some: { id: { eq: "$jwt.sub" } } } } }
                        }
                    ]
                )
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("Create Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(input: [{ id: "user-id", name: "bob" }]) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
                CREATE (create_this1:User)
                SET
                    create_this1.id = create_var0.id,
                    create_this1.name = create_var0.name
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND create_this1.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"user-id\\",
                        \\"name\\": \\"bob\\"
                    }
                ],
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                }
            }"
        `);
    });

    test("Create Nested Node", async () => {
        const query = /* GraphQL */ `
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

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
                CREATE (create_this1:User)
                SET
                    create_this1.id = create_var0.id,
                    create_this1.name = create_var0.name
                WITH create_this1, create_var0
                CALL (create_this1, create_var0) {
                    UNWIND create_var0.posts.create AS create_var2
                    CREATE (create_this3:Post)
                    SET
                        create_this3.id = create_var2.node.id
                    MERGE (create_this1)-[create_this4:HAS_POST]->(create_this3)
                    WITH create_this3, create_var2
                    CALL (create_this3, create_var2) {
                        UNWIND create_var2.node.creator.create AS create_var5
                        CREATE (create_this6:User)
                        SET
                            create_this6.id = create_var5.node.id
                        MERGE (create_this3)<-[create_this7:HAS_POST]-(create_this6)
                        WITH *
                        CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND create_this6.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        RETURN collect(NULL) AS create_var8
                    }
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (create_this3)<-[:HAS_POST]-(create_this9:User)
                        WHERE ($jwt.sub IS NOT NULL AND create_this9.id = $jwt.sub)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    RETURN collect(NULL) AS create_var10
                }
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND create_this1.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"user-id\\",
                        \\"name\\": \\"bob\\",
                        \\"posts\\": {
                            \\"create\\": [
                                {
                                    \\"node\\": {
                                        \\"id\\": \\"post-id-1\\",
                                        \\"creator\\": {
                                            \\"create\\": [
                                                {
                                                    \\"node\\": {
                                                        \\"id\\": \\"some-user-id\\"
                                                    }
                                                }
                                            ]
                                        }
                                    }
                                }
                            ]
                        }
                    }
                ],
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                }
            }"
        `);
    });

    test("Update Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(where: { id: { eq: "id-01" } }, update: { id_SET: "not bound" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE this.id = $param0
            SET
                this.id = $param1
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id-01\\",
                \\"param1\\": \\"not bound\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                }
            }"
        `);
    });

    test("Update Nested Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(
                    where: { id: { eq: "id-01" } }
                    update: {
                        posts: {
                            update: {
                                where: { node: { id: { eq: "post-id" } } }
                                node: { creator: { update: { node: { id_SET: "not bound" } } } }
                            }
                        }
                    }
                ) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                WITH *
                WHERE this1.id = $param1
                WITH *
                CALL (*) {
                    MATCH (this1)<-[this2:HAS_POST]-(this3:User)
                    WITH *
                    SET
                        this3.id = $param2
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"id-01\\",
                \\"param1\\": \\"post-id\\",
                \\"param2\\": \\"not bound\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                }
            }"
        `);
    });

    test("Connect Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updatePosts(
                    where: { id: { eq: "post-id" } }
                    update: { creator: { connect: { where: { node: { id: { eq: "user-id" } } } } } }
                ) {
                    posts {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:User)
                    WHERE this0.id = $param1
                    CREATE (this)<-[this1:HAS_POST]-(this0)
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this)<-[:HAS_POST]-(this2:User)
                        WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"post-id\\",
                \\"param1\\": \\"user-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                }
            }"
        `);
    });

    test("Disconnect Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updatePosts(
                    where: { id: { eq: "post-id" } }
                    update: { creator: { disconnect: { where: { node: { id: { eq: "user-id" } } } } } }
                ) {
                    posts {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            WITH *
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)<-[this0:HAS_POST]-(this1:User)
                    WHERE this1.id = $param1
                    WITH *
                    DELETE this0
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this)<-[:HAS_POST]-(this2:User)
                        WHERE ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"post-id\\",
                \\"param1\\": \\"user-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                }
            }"
        `);
    });
});
