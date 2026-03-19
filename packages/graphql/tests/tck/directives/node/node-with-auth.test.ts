/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Node Directive", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
            }

            type Post @node(labels: ["Comment"]) {
                id: ID
                content: String
                creator: [User!]! @relationship(type: "HAS_POST", direction: IN)
            }

            extend type Post
                @authorization(validate: [{ operations: [DELETE], where: { jwt: { roles: { includes: "admin" } } } }])

            type User @node(labels: ["Person"]) {
                id: ID
                name: String
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
            }

            extend type User
                @authorization(
                    validate: [
                        {
                            operations: [READ, UPDATE, DELETE, DELETE_RELATIONSHIP, CREATE_RELATIONSHIP]
                            when: [BEFORE]
                            where: { node: { id: { eq: "$jwt.sub" } } }
                        }
                    ]
                )
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });
    });

    test("Read User", async () => {
        const query = /* GraphQL */ `
            {
                users {
                    id
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), '@neo4j/graphql/FORBIDDEN', [])
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

    test("Admin Deletes Post", async () => {
        const query = /* GraphQL */ `
            mutation {
                deletePosts(where: { creator: { some: { id: { eq: "123" } } } }) {
                    nodesDeleted
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "id-01", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Comment)
            WHERE EXISTS {
              MATCH (this)<-[:HAS_POST]-(this0:Person)
              WHERE this0.id = $param0
            }
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param3 IN $jwt.roles)), '@neo4j/graphql/FORBIDDEN', [])
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"123\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"sub\\": \\"id-01\\"
                },
                \\"param3\\": \\"admin\\"
            }"
        `);
    });
});
