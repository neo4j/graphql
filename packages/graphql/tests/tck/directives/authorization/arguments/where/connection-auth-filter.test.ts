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
import { formatCypher, translateQuery, formatParams } from "../../../../utils/tck-test-utils";
import { createBearerToken } from "../../../../../utils/create-bearer-token";

describe("Connection auth filter", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type JWTPayload @jwt {
                roles: [String!]!
            }

            union Search = Post

            type User {
                id: ID
                name: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                content: [Search!]! @relationship(type: "HAS_POST", direction: OUT) # something to test unions
            }

            type Post {
                id: ID
                content: String
                creator: User! @relationship(type: "HAS_POST", direction: IN)
            }

            extend type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])

            extend type User {
                password: String! @authorization(filter: [{ operations: [READ], where: { node: { id: "$jwt.sub" } } }])
            }

            extend type Post {
                secretKey: String!
                    @authorization(filter: [{ operations: [READ], where: { node: { creator: { id: "$jwt.sub" } } } }])
            }
            extend type Post @authorization(filter: [{ where: { node: { creator: { id: "$jwt.sub" } } } }])
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
        const query = gql`
            {
                usersConnection {
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            WITH { node: this { .id } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
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
        const query = gql`
            {
                usersConnection(where: { name: "bob" }) {
                    edges {
                        node {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE (this.name = $param0 AND ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)))
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            WITH { node: this { .id } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
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

    test("Read Relationship", async () => {
        const query = gql`
            {
                usersConnection {
                    edges {
                        node {
                            id
                            posts {
                                content
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                WITH *, count(this2) AS creatorCount
                WITH *
                WITH *
                WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)))
                WITH this1 { .content } AS this1
                RETURN collect(this1) AS var3
            }
            WITH { node: this { .id, posts: var3 } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
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

    test("Read Connection", async () => {
        const query = gql`
            {
                usersConnection {
                    edges {
                        node {
                            id
                            postsConnection {
                                edges {
                                    node {
                                        content
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                WITH *, count(this2) AS creatorCount
                WITH *
                WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)))
                WITH { node: { content: this1.content } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            WITH { node: this { .id, postsConnection: var3 } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
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

    test("Read Connection + User Defined Where", async () => {
        const query = gql`
            {
                usersConnection {
                    edges {
                        node {
                            id
                            postsConnection(where: { node: { id: "some-id" } }) {
                                edges {
                                    node {
                                        content
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                WITH *, count(this2) AS creatorCount
                WITH *
                WHERE (this1.id = $param2 AND ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub))))
                WITH { node: { content: this1.content } } AS edge
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            WITH { node: this { .id, postsConnection: var3 } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
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
                \\"param2\\": \\"some-id\\"
            }"
        `);
    });

    test("Read Union Relationship + User Defined Where", async () => {
        const query = gql`
            {
                usersConnection {
                    edges {
                        node {
                            id
                            posts(where: { content: "cool" }) {
                                content
                            }
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            CALL {
                WITH this
                MATCH (this)-[this0:HAS_POST]->(this1:Post)
                OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                WITH *, count(this2) AS creatorCount
                WITH *
                WITH *
                WHERE (this1.content = $param2 AND ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub))))
                WITH this1 { .content } AS this1
                RETURN collect(this1) AS var3
            }
            WITH { node: this { .id, posts: var3 } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
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
                \\"param2\\": \\"cool\\"
            }"
        `);
    });

    test("Read Union", async () => {
        const query = gql`
            {
                usersConnection {
                    edges {
                        node {
                            id
                            content {
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
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WITH *, count(this2) AS creatorCount
                    WITH *
                    WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)))
                    WITH this1 { .id, __resolveType: \\"Post\\", __id: id(this1) } AS this1
                    RETURN this1 AS var3
                }
                WITH var3
                RETURN collect(var3) AS var3
            }
            WITH { node: this { .id, content: var3 } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
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

    test("Read Union Using Connection", async () => {
        const query = gql`
            {
                usersConnection {
                    edges {
                        node {
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
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WITH *, count(this2) AS creatorCount
                    WITH *
                    WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub)))
                    WITH { node: { __resolveType: \\"Post\\", __id: id(this1), id: this1.id } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            WITH { node: this { .id, contentConnection: var3 } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
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

    test("Read Union Using Connection + User Defined Where", async () => {
        const query = gql`
            {
                usersConnection {
                    edges {
                        node {
                            id
                            contentConnection(where: { Post: { node: { id: "some-id" } } }) {
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
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub))
            WITH collect(this) AS edges
            WITH edges, size(edges) AS totalCount
            UNWIND edges AS this
            WITH this, totalCount
            CALL {
                WITH this
                CALL {
                    WITH this
                    MATCH (this)-[this0:HAS_POST]->(this1:Post)
                    OPTIONAL MATCH (this1)<-[:HAS_POST]-(this2:User)
                    WITH *, count(this2) AS creatorCount
                    WITH *
                    WHERE (this1.id = $param2 AND ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this2.id = $jwt.sub))))
                    WITH { node: { __resolveType: \\"Post\\", __id: id(this1), id: this1.id } } AS edge
                    RETURN edge
                }
                WITH collect(edge) AS edges
                WITH edges, size(edges) AS totalCount
                RETURN { edges: edges, totalCount: totalCount } AS var3
            }
            WITH { node: this { .id, contentConnection: var3 } } AS edge, totalCount, this
            WITH collect(edge) AS edges, totalCount
            RETURN { edges: edges, totalCount: totalCount } AS this"
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
                \\"param2\\": \\"some-id\\"
            }"
        `);
    });
});
