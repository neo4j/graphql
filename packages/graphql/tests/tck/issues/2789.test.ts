/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2789", () => {
    let neoSchema: Neo4jGraphQL;
    const typeDefs = /* GraphQL */ `
        type User @authorization(validate: [{ where: { node: { id: { eq: "Foo" } } } }]) @node {
            id: ID
            password: String! @authorization(validate: [{ where: { node: { id: { eq: "Bar" } } } }])
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });
    });

    test("has no conflicting parameters when combining node and field auth", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateUsers(update: { password_SET: "123" }) {
                    users {
                        password
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:User)
            WITH *
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param1 IS NOT NULL AND this.id = $param1)), '@neo4j/graphql/FORBIDDEN', [])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param2 IS NOT NULL AND this.id = $param2)), '@neo4j/graphql/FORBIDDEN', [])
            WITH *
            SET this.password = $param3
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param4 IS NOT NULL AND this.id = $param4)), '@neo4j/graphql/FORBIDDEN', [])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param5 IS NOT NULL AND this.id = $param5)), '@neo4j/graphql/FORBIDDEN', [])
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param6 IS NOT NULL AND this.id = $param6)), '@neo4j/graphql/FORBIDDEN', [])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param7 IS NOT NULL AND this.id = $param7)), '@neo4j/graphql/FORBIDDEN', [])
            RETURN this { .password } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": false,
                \\"param1\\": \\"Foo\\",
                \\"param2\\": \\"Bar\\",
                \\"param3\\": \\"123\\",
                \\"param4\\": \\"Foo\\",
                \\"param5\\": \\"Bar\\",
                \\"param6\\": \\"Foo\\",
                \\"param7\\": \\"Bar\\"
            }"
        `);
    });
});
