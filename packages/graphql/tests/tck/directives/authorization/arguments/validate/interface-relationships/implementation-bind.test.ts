/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../../../../src";
import { createBearerToken } from "../../../../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../../../../utils/tck-test-utils";

describe("Cypher Auth Allow", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Content {
                id: ID
                creator: [User!]! @declareRelationship
            }

            type Comment implements Content @node {
                id: ID
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type Post implements Content
                @node
                @authorization(
                    validate: [
                        {
                            when: AFTER
                            operations: [CREATE, UPDATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                            where: { node: { creator: { some: { id: { eq: "$jwt.sub" } } } } }
                        }
                    ]
                ) {
                id: ID
                creator: [User!]! @relationship(type: "HAS_CONTENT", direction: IN)
            }

            type User @node {
                id: ID
                name: String
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            extend type User
                @authorization(
                    validate: [
                        {
                            when: AFTER
                            operations: [CREATE, UPDATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP]
                            where: { node: { id: { eq: "$jwt.sub" } } }
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

    test("Create Nested Node with bind", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(
                    input: [
                        {
                            id: "user-id"
                            name: "bob"
                            content: {
                                create: [
                                    {
                                        node: {
                                            Post: {
                                                id: "post-id-1"
                                                creator: { create: { node: { id: "some-user-id" } } }
                                            }
                                        }
                                    }
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
            CALL {
              CREATE (this0:User)
              SET
                this0.id = $param0,
                this0.name = $param1
              WITH *
              CREATE (this1:Post)
              MERGE (this0)-[this2:HAS_CONTENT]->(this1)
              SET this1.id = $param2
              WITH *
              CREATE (this3:User)
              MERGE (this1)<-[this4:HAS_CONTENT]-(this3)
              SET this3.id = $param3
              WITH *
              CALL (*) {
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)), '@neo4j/graphql/FORBIDDEN', [])
              }
              CALL (*) {
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                  MATCH (this1)<-[:HAS_CONTENT]-(this5:User)
                  WHERE ($jwt.sub IS NOT NULL AND this5.id = $jwt.sub)
                }), '@neo4j/graphql/FORBIDDEN', [])
              }
              CALL (*) {
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)), '@neo4j/graphql/FORBIDDEN', [])
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
                \\"param0\\": \\"user-id\\",
                \\"param1\\": \\"bob\\",
                \\"param2\\": \\"post-id-1\\",
                \\"param3\\": \\"some-user-id\\",
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

    test("Create Nested Node without bind", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(
                    input: [
                        {
                            id: "user-id"
                            name: "bob"
                            content: {
                                create: [
                                    {
                                        node: {
                                            Comment: {
                                                id: "post-id-1"
                                                creator: { create: { node: { id: "some-user-id" } } }
                                            }
                                        }
                                    }
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
            CALL {
              CREATE (this0:User)
              SET
                this0.id = $param0,
                this0.name = $param1
              WITH *
              CREATE (this1:Comment)
              MERGE (this0)-[this2:HAS_CONTENT]->(this1)
              SET this1.id = $param2
              WITH *
              CREATE (this3:User)
              MERGE (this1)<-[this4:HAS_CONTENT]-(this3)
              SET this3.id = $param3
              WITH *
              CALL (*) {
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this0.id = $jwt.sub)), '@neo4j/graphql/FORBIDDEN', [])
              }
              CALL (*) {
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)), '@neo4j/graphql/FORBIDDEN', [])
              }
              RETURN this0 AS this
            }
            WITH this
            CALL (this) {
              RETURN this { .id } AS var5
            }
            RETURN collect(var5) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"user-id\\",
                \\"param1\\": \\"bob\\",
                \\"param2\\": \\"post-id-1\\",
                \\"param3\\": \\"some-user-id\\",
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
                        content: {
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
              MATCH (this)-[this0:HAS_CONTENT]->(this1:Comment)
              WITH *
              WHERE this1.id = $param1
              WITH *
              CALL (*) {
                MATCH (this1)<-[this2:HAS_CONTENT]-(this3:User)
                WITH *
                SET this3.id = $param2
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this3.id = $jwt.sub)), '@neo4j/graphql/FORBIDDEN', [])
              }
            }
            WITH *
            CALL (*) {
              MATCH (this)-[this4:HAS_CONTENT]->(this5:Post)
              WITH *
              WHERE this5.id = $param5
              WITH *
              CALL (*) {
                MATCH (this5)<-[this6:HAS_CONTENT]-(this7:User)
                WITH *
                SET this7.id = $param6
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this7.id = $jwt.sub)), '@neo4j/graphql/FORBIDDEN', [])
              }
              WITH *
              CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this5)<-[:HAS_CONTENT]-(this8:User)
                WHERE ($jwt.sub IS NOT NULL AND this8.id = $jwt.sub)
              }), '@neo4j/graphql/FORBIDDEN', [])
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
                },
                \\"param5\\": \\"post-id\\",
                \\"param6\\": \\"not bound\\"
            }"
        `);
    });
});
