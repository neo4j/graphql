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

describe("Cypher Auth Where", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Content {
                id: ID
                content: String
                creator: [User!]! @declareRelationship
            }

            type User @node {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            type Comment implements Content @node {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type Post implements Content
                @node
                @authorization(
                    filter: [
                        {
                            operations: [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                            where: { node: { creator: { some: { id: { eq: "$jwt.sub" } } } } }
                        }
                    ]
                ) {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            extend type User
                @authorization(
                    filter: [
                        {
                            operations: [READ, UPDATE, DELETE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                            where: { node: { id: { eq: "$jwt.sub" } } }
                        }
                    ]
                )

            extend type User {
                password: String!
                    @authorization(filter: [{ operations: [READ], where: { node: { id: { eq: "$jwt.sub" } } } }])
            }

            extend type Post {
                secretKey: String!
                    @authorization(
                        filter: [
                            { operations: [READ], where: { node: { creator: { some: { id: { eq: "$jwt.sub" } } } } } }
                        ]
                    )
            }
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

    test("Read Node", async () => {
        const query = /* GraphQL */ `
            {
                posts {
                    id
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            WITH *
            WHERE ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_CONTENT]-(this0:User)
                WHERE ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)
            })
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
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

    test("Read Node + User Defined Where", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { content: { eq: "bob" } }) {
                    id
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            WITH *
            WHERE (this.content = $param0 AND ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_CONTENT]-(this0:User)
                WHERE ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)
            }))
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"bob\\",
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

    test("Read interface relationship field", async () => {
        const query = /* GraphQL */ `
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

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                    WITH this1 { __resolveType: \\"Comment\\", __id: id(this1) } AS var2
                    RETURN var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:HAS_CONTENT]->(this4:Post)
                    WHERE ($isAuthenticated = true AND EXISTS {
                        MATCH (this4)<-[:HAS_CONTENT]-(this5:User)
                        WHERE ($jwt.sub IS NOT NULL AND this5.id = $jwt.sub)
                    })
                    WITH this4 { .id, __resolveType: \\"Post\\", __id: id(this4) } AS var2
                    RETURN var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { .id, content: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
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

    test("Read interface relationship Using Connection", async () => {
        const query = /* GraphQL */ `
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

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            CALL (this) {
                CALL (this) {
                    CALL (this) {
                        WITH this
                        MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                        WITH { node: { __resolveType: \\"Comment\\", __id: id(this1) } } AS edge
                        RETURN edge
                        UNION
                        WITH this
                        MATCH (this)-[this2:HAS_CONTENT]->(this3:Post)
                        WHERE ($isAuthenticated = true AND EXISTS {
                            MATCH (this3)<-[:HAS_CONTENT]-(this4:User)
                            WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub)
                        })
                        WITH { node: { __resolveType: \\"Post\\", __id: id(this3), id: this3.id } } AS edge
                        RETURN edge
                    }
                    RETURN collect(edge) AS edges
                }
                WITH edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var5
            }
            RETURN this { .id, contentConnection: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
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

    test("Read interface relationship Using Connection + User Defined Where", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    contentConnection(where: { node: { id: { eq: "some-id" } } }) {
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

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            CALL (this) {
                CALL (this) {
                    CALL (this) {
                        WITH this
                        MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                        WHERE this1.id = $param2
                        WITH { node: { __resolveType: \\"Comment\\", __id: id(this1) } } AS edge
                        RETURN edge
                        UNION
                        WITH this
                        MATCH (this)-[this2:HAS_CONTENT]->(this3:Post)
                        WHERE (this3.id = $param3 AND ($isAuthenticated = true AND EXISTS {
                            MATCH (this3)<-[:HAS_CONTENT]-(this4:User)
                            WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub)
                        }))
                        WITH { node: { __resolveType: \\"Post\\", __id: id(this3), id: this3.id } } AS edge
                        RETURN edge
                    }
                    RETURN collect(edge) AS edges
                }
                WITH edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var5
            }
            RETURN this { .id, contentConnection: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"some-id\\",
                \\"param3\\": \\"some-id\\"
            }"
        `);
    });

    test("Update Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updatePosts(update: { content_SET: "Bob" }) {
                    posts {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            WITH *
            WHERE ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_CONTENT]-(this0:User)
                WHERE ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)
            })
            SET
                this.content = $param2
            WITH this
            WITH *
            WHERE ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_CONTENT]-(this1:User)
                WHERE ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)
            })
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param2\\": \\"Bob\\"
            }"
        `);
    });

    test("Update Node + User Defined Where", async () => {
        const query = /* GraphQL */ `
            mutation {
                updatePosts(where: { content: { eq: "bob" } }, update: { content_SET: "Bob" }) {
                    posts {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            WITH *
            WHERE (this.content = $param0 AND ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_CONTENT]-(this0:User)
                WHERE ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)
            }))
            SET
                this.content = $param3
            WITH this
            WITH *
            WHERE ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_CONTENT]-(this1:User)
                WHERE ($jwt.sub IS NOT NULL AND this1.id = $jwt.sub)
            })
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"bob\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param3\\": \\"Bob\\"
            }"
        `);
    });

    test("Update Nested Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { content: { update: { node: { id_SET: "new-id" } } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                WITH *
                SET
                    this1.id = $param0
            }
            WITH *
            CALL (*) {
                MATCH (this)-[this2:HAS_CONTENT]->(this3:Post)
                WITH *
                WHERE ($isAuthenticated = true AND EXISTS {
                    MATCH (this3)<-[:HAS_CONTENT]-(this4:User)
                    WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub)
                })
                SET
                    this3.id = $param3
            }
            WITH this
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"new-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param3\\": \\"new-id\\"
            }"
        `);
    });

    test("Delete Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                deletePosts {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            WHERE ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_CONTENT]-(this0:User)
                WHERE ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)
            })
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
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

    test("Delete Node + User Defined Where", async () => {
        const query = /* GraphQL */ `
            mutation {
                deletePosts(where: { content: { eq: "Bob" } }) {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            WHERE (this.content = $param0 AND ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:HAS_CONTENT]-(this0:User)
                WHERE ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)
            }))
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Bob\\",
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

    test("Delete Nested Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteUsers(delete: { content: { where: {} } }) {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            WITH *
            CALL (*) {
                OPTIONAL MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                WITH this0, collect(DISTINCT this1) AS var2
                CALL (var2) {
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            CALL (*) {
                OPTIONAL MATCH (this)-[this4:HAS_CONTENT]->(this5:Post)
                WHERE ($isAuthenticated = true AND EXISTS {
                    MATCH (this5)<-[:HAS_CONTENT]-(this6:User)
                    WHERE ($jwt.sub IS NOT NULL AND this6.id = $jwt.sub)
                })
                WITH this4, collect(DISTINCT this5) AS var7
                CALL (var7) {
                    UNWIND var7 AS var8
                    DETACH DELETE var8
                }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
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

    test("Connect Node (from create)", async () => {
        const query = /* GraphQL */ `
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

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:User)
                SET
                    this0.id = $param0,
                    this0.name = $param1,
                    this0.password = $param2
                WITH *
                CALL (this0) {
                    MATCH (this1:Comment)
                    CREATE (this0)-[this2:HAS_CONTENT]->(this1)
                }
                WITH *
                CALL (this0) {
                    MATCH (this3:Post)
                    WHERE ($isAuthenticated = true AND EXISTS {
                        MATCH (this3)<-[:HAS_CONTENT]-(this4:User)
                        WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub)
                    })
                    CREATE (this0)-[this5:HAS_CONTENT]->(this3)
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var6
            }
            RETURN collect(var6) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"param1\\": \\"Bob\\",
                \\"param2\\": \\"password\\",
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

    test("Connect Node + User Defined Where (from create)", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(
                    input: [
                        {
                            id: "123"
                            name: "Bob"
                            password: "password"
                            content: { connect: { where: { node: { id: { eq: "post-id" } } } } }
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
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
                CREATE (this0:User)
                SET
                    this0.id = $param0,
                    this0.name = $param1,
                    this0.password = $param2
                WITH *
                CALL (this0) {
                    MATCH (this1:Comment)
                    WHERE this1.id = $param3
                    CREATE (this0)-[this2:HAS_CONTENT]->(this1)
                }
                WITH *
                CALL (this0) {
                    MATCH (this3:Post)
                    WHERE (($isAuthenticated = true AND EXISTS {
                        MATCH (this3)<-[:HAS_CONTENT]-(this4:User)
                        WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub)
                    }) AND this3.id = $param6)
                    CREATE (this0)-[this5:HAS_CONTENT]->(this3)
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                RETURN this { .id } AS var6
            }
            RETURN collect(var6) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"param1\\": \\"Bob\\",
                \\"param2\\": \\"password\\",
                \\"param3\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param6\\": \\"post-id\\"
            }"
        `);
    });

    test("Connect Node (from update update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { content: { connect: { where: { node: {} } } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Comment)
                    CREATE (this)-[this1:HAS_CONTENT]->(this0)
                }
                CALL (this) {
                    MATCH (this2:Post)
                    WHERE ($isAuthenticated = true AND EXISTS {
                        MATCH (this2)<-[:HAS_CONTENT]-(this3:User)
                        WHERE ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)
                    })
                    CREATE (this)-[this4:HAS_CONTENT]->(this2)
                }
            }
            WITH this
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
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

    test("Connect Node + User Defined Where (from update update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { content: { connect: { where: { node: { id: { eq: "new-id" } } } } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:Comment)
                    WHERE this0.id = $param0
                    CREATE (this)-[this1:HAS_CONTENT]->(this0)
                }
                CALL (this) {
                    MATCH (this2:Post)
                    WHERE (($isAuthenticated = true AND EXISTS {
                        MATCH (this2)<-[:HAS_CONTENT]-(this3:User)
                        WHERE ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)
                    }) AND this2.id = $param3)
                    CREATE (this)-[this4:HAS_CONTENT]->(this2)
                }
            }
            WITH this
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"new-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param3\\": \\"new-id\\"
            }"
        `);
    });

    test("Disconnect Node (from update update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { content: { disconnect: { where: {} } } }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                    WITH *
                    DELETE this0
                }
                CALL (this) {
                    OPTIONAL MATCH (this)-[this2:HAS_CONTENT]->(this3:Post)
                    WHERE ($isAuthenticated = true AND EXISTS {
                        MATCH (this3)<-[:HAS_CONTENT]-(this4:User)
                        WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub)
                    })
                    WITH *
                    DELETE this2
                }
            }
            WITH this
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
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

    test("Disconnect Node + User Defined Where (from update update)", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { content: [{ disconnect: { where: { node: { id: { eq: "new-id" } } } } }] }) {
                    users {
                        id
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                    WHERE this1.id = $param0
                    WITH *
                    DELETE this0
                }
                CALL (this) {
                    OPTIONAL MATCH (this)-[this2:HAS_CONTENT]->(this3:Post)
                    WHERE (($isAuthenticated = true AND EXISTS {
                        MATCH (this3)<-[:HAS_CONTENT]-(this4:User)
                        WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub)
                    }) AND this3.id = $param3)
                    WITH *
                    DELETE this2
                }
            }
            WITH this
            WITH *
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"new-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param3\\": \\"new-id\\"
            }"
        `);
    });
});
