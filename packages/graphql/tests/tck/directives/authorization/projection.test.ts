/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher Auth Projection", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                id: ID
                name: String
            }

            extend type User {
                id: ID @authorization(validate: [{ when: BEFORE, where: { node: { id: { eq: "$jwt.sub" } } } }])
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

    test("Update Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { id_SET: "new-id" }) {
                    users {
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
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this.id = $jwt.sub)), '@neo4j/graphql/FORBIDDEN', [])
            WITH *
            SET this.id = $param2
            WITH this
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
                    \\"sub\\": \\"super_admin\\"
                },
                \\"param2\\": \\"new-id\\"
            }"
        `);
    });

    test("Create Node", async () => {
        const query = /* GraphQL */ `
            mutation {
                createUsers(input: [{ id: "id-1" }, { id: "id-2" }]) {
                    users {
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
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
              CREATE (create_this1:User)
              SET create_this1.id = create_var0.id
              RETURN create_this1
            }
            RETURN collect(create_this1 { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"id\\": \\"id-1\\"
                    },
                    {
                        \\"id\\": \\"id-2\\"
                    }
                ]
            }"
        `);
    });
});
