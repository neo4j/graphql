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

describe("@auth allow on specific interface implementation", () => {
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

            type Comment implements Content @node {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
                post: [Post!]! @relationship(type: "HAS_COMMENT", direction: IN)
            }

            type Post implements Content
                @node
                @authorization(
                    validate: [
                        {
                            when: BEFORE
                            operations: [READ, UPDATE, DELETE, DELETE_RELATIONSHIP, CREATE_RELATIONSHIP]
                            where: { node: { creator: { some: { id: { eq: "$jwt.sub" } } } } }
                        }
                    ]
                ) {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
                comments: [Comment!]! @relationship(type: "HAS_COMMENT", direction: OUT)
            }

            type User @node {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
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

    test("read allow protected interface relationship", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                    content {
                        id
                        content
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
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                    WITH this1 { .id, .content, __resolveType: \\"Comment\\", __id: id(this1) } AS var2
                    RETURN var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:HAS_CONTENT]->(this4:Post)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this4)<-[:HAS_CONTENT]-(this5:User)
                        WHERE ($jwt.sub IS NOT NULL AND this5.id = $jwt.sub)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this4 { .id, .content, __resolveType: \\"Post\\", __id: id(this4) } AS var2
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

    test("Read Two Relationships", async () => {
        const query = /* GraphQL */ `
            {
                users(where: { id: { eq: "1" } }) {
                    id
                    content(where: { id: { eq: "1" } }) {
                        ... on Post {
                            comments(where: { id: { eq: "1" } }) {
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
            "CYPHER 5
            MATCH (this:User)
            WHERE this.id = $param0
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                    WHERE this1.id = $param1
                    WITH this1 { __resolveType: \\"Comment\\", __id: id(this1) } AS var2
                    RETURN var2
                    UNION
                    WITH *
                    MATCH (this)-[this3:HAS_CONTENT]->(this4:Post)
                    WHERE this4.id = $param2
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this4)<-[:HAS_CONTENT]-(this5:User)
                        WHERE ($jwt.sub IS NOT NULL AND this5.id = $jwt.sub)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CALL (this4) {
                        MATCH (this4)-[this6:HAS_COMMENT]->(this7:Comment)
                        WHERE this7.id = $param5
                        WITH DISTINCT this7
                        WITH this7 { .content } AS this7
                        RETURN collect(this7) AS var8
                    }
                    WITH this4 { comments: var8, __resolveType: \\"Post\\", __id: id(this4) } AS var2
                    RETURN var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { .id, content: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"1\\",
                \\"param2\\": \\"1\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param5\\": \\"1\\"
            }"
        `);
    });

    test("Nested Update Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(
                    where: { id: { eq: "user-id" } }
                    update: { content: { update: { node: { id_SET: "new-id" } } } }
                ) {
                    users {
                        id
                        content {
                            id
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
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
                MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                WITH *
                SET
                    this1.id = $param1
            }
            WITH *
            CALL (*) {
                MATCH (this)-[this2:HAS_CONTENT]->(this3:Post)
                WITH *
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this3)<-[:HAS_CONTENT]-(this4:User)
                    WHERE ($jwt.sub IS NOT NULL AND this4.id = $jwt.sub)
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                SET
                    this3.id = $param4
            }
            WITH this
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)-[this5:HAS_CONTENT]->(this6:Comment)
                    WITH this6 { .id, __resolveType: \\"Comment\\", __id: id(this6) } AS var7
                    RETURN var7
                    UNION
                    WITH *
                    MATCH (this)-[this8:HAS_CONTENT]->(this9:Post)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this9)<-[:HAS_CONTENT]-(this10:User)
                        WHERE ($jwt.sub IS NOT NULL AND this10.id = $jwt.sub)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this9 { .id, __resolveType: \\"Post\\", __id: id(this9) } AS var7
                    RETURN var7
                }
                WITH var7
                RETURN collect(var7) AS var7
            }
            RETURN this { .id, content: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"param1\\": \\"new-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                },
                \\"param4\\": \\"new-id\\"
            }"
        `);
    });

    test("Nested Delete Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                deleteUsers(
                    where: { id: { eq: "user-id" } }
                    delete: { content: { where: { node: { id: { eq: "post-id" } } } } }
                ) {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "user-id", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WHERE this.id = $param0
            WITH *
            CALL (*) {
                OPTIONAL MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
                WHERE this1.id = $param1
                WITH this0, collect(DISTINCT this1) AS var2
                CALL (var2) {
                    UNWIND var2 AS var3
                    DETACH DELETE var3
                }
            }
            CALL (*) {
                OPTIONAL MATCH (this)-[this4:HAS_CONTENT]->(this5:Post)
                WHERE this5.id = $param2
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this5)<-[:HAS_CONTENT]-(this6:User)
                    WHERE ($jwt.sub IS NOT NULL AND this6.id = $jwt.sub)
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                \\"param0\\": \\"user-id\\",
                \\"param1\\": \\"post-id\\",
                \\"param2\\": \\"post-id\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"user-id\\"
                }
            }"
        `);
    });
});
