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

import type { DocumentNode } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../../../../src";
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../../../utils/tck-test-utils";

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
            "MATCH (this0:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { id: this0.id, __resolveType: \\"User\\" } }) AS var1
            }
            RETURN { edges: var1, totalCount: totalCount } AS this"
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
            "MATCH (this0:User)
            WHERE (this0.name = $param0 AND ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                RETURN collect({ node: { id: this0.id, __resolveType: \\"User\\" } }) AS var1
            }
            RETURN { edges: var1, totalCount: totalCount } AS this"
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
            "MATCH (this0:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:HAS_POST]->(this2:Post)
                    OPTIONAL MATCH (this2)<-[:HAS_POST]-(this3:User)
                    WITH *, count(this3) AS creatorCount
                    WITH *
                    WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)))
                    WITH this2 { .content } AS this2
                    RETURN collect(this2) AS var4
                }
                RETURN collect({ node: { id: this0.id, posts: var4, __resolveType: \\"User\\" } }) AS var5
            }
            RETURN { edges: var5, totalCount: totalCount } AS this"
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
            "MATCH (this0:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:HAS_POST]->(this2:Post)
                    OPTIONAL MATCH (this2)<-[:HAS_POST]-(this3:User)
                    WITH *, count(this3) AS creatorCount
                    WITH *
                    WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)))
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        RETURN collect({ node: { content: this2.content, __resolveType: \\"Post\\" } }) AS var4
                    }
                    RETURN { edges: var4, totalCount: totalCount } AS var5
                }
                RETURN collect({ node: { id: this0.id, postsConnection: var5, __resolveType: \\"User\\" } }) AS var6
            }
            RETURN { edges: var6, totalCount: totalCount } AS this"
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
            "MATCH (this0:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:HAS_POST]->(this2:Post)
                    OPTIONAL MATCH (this2)<-[:HAS_POST]-(this3:User)
                    WITH *, count(this3) AS creatorCount
                    WITH *
                    WHERE (this2.id = $param2 AND ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub))))
                    WITH collect({ node: this2, relationship: this1 }) AS edges
                    WITH edges, size(edges) AS totalCount
                    CALL {
                        WITH edges
                        UNWIND edges AS edge
                        WITH edge.node AS this2, edge.relationship AS this1
                        RETURN collect({ node: { content: this2.content, __resolveType: \\"Post\\" } }) AS var4
                    }
                    RETURN { edges: var4, totalCount: totalCount } AS var5
                }
                RETURN collect({ node: { id: this0.id, postsConnection: var5, __resolveType: \\"User\\" } }) AS var6
            }
            RETURN { edges: var6, totalCount: totalCount } AS this"
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
            "MATCH (this0:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    MATCH (this0)-[this1:HAS_POST]->(this2:Post)
                    OPTIONAL MATCH (this2)<-[:HAS_POST]-(this3:User)
                    WITH *, count(this3) AS creatorCount
                    WITH *
                    WHERE (this2.content = $param2 AND ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub))))
                    WITH this2 { .content } AS this2
                    RETURN collect(this2) AS var4
                }
                RETURN collect({ node: { id: this0.id, posts: var4, __resolveType: \\"User\\" } }) AS var5
            }
            RETURN { edges: var5, totalCount: totalCount } AS this"
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
            "MATCH (this0:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH *
                        MATCH (this0)-[this1:HAS_POST]->(this2:Post)
                        OPTIONAL MATCH (this2)<-[:HAS_POST]-(this3:User)
                        WITH *, count(this3) AS creatorCount
                        WITH *
                        WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)))
                        WITH this2 { .id, __resolveType: \\"Post\\", __id: id(this2) } AS this2
                        RETURN this2 AS var4
                    }
                    WITH var4
                    RETURN collect(var4) AS var4
                }
                RETURN collect({ node: { id: this0.id, content: var4, __resolveType: \\"User\\" } }) AS var5
            }
            RETURN { edges: var5, totalCount: totalCount } AS this"
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
            "MATCH (this0:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        MATCH (this0)-[this1:HAS_POST]->(this2:Post)
                        OPTIONAL MATCH (this2)<-[:HAS_POST]-(this3:User)
                        WITH *, count(this3) AS creatorCount
                        WITH *
                        WHERE ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)))
                        WITH { node: { __resolveType: \\"Post\\", __id: id(this2), id: this2.id } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var4
                }
                RETURN collect({ node: { id: this0.id, contentConnection: var4, __resolveType: \\"User\\" } }) AS var5
            }
            RETURN { edges: var5, totalCount: totalCount } AS this"
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
            "MATCH (this0:User)
            WHERE ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub))
            WITH collect({ node: this0 }) AS edges
            WITH edges, size(edges) AS totalCount
            CALL {
                WITH edges
                UNWIND edges AS edge
                WITH edge.node AS this0
                CALL {
                    WITH this0
                    CALL {
                        WITH this0
                        MATCH (this0)-[this1:HAS_POST]->(this2:Post)
                        OPTIONAL MATCH (this2)<-[:HAS_POST]-(this3:User)
                        WITH *, count(this3) AS creatorCount
                        WITH *
                        WHERE (this2.id = $param2 AND ($isAuthenticated = true AND (creatorCount <> 0 AND ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub))))
                        WITH { node: { __resolveType: \\"Post\\", __id: id(this2), id: this2.id } } AS edge
                        RETURN edge
                    }
                    WITH collect(edge) AS edges
                    WITH edges, size(edges) AS totalCount
                    RETURN { edges: edges, totalCount: totalCount } AS var4
                }
                RETURN collect({ node: { id: this0.id, contentConnection: var4, __resolveType: \\"User\\" } }) AS var5
            }
            RETURN { edges: var5, totalCount: totalCount } AS this"
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
