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
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param1 IS NOT NULL AND this.id = $param1)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param2 IS NOT NULL AND this.id = $param2)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            SET
                this.password = $param3
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param4 IS NOT NULL AND this.id = $param4)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param5 IS NOT NULL AND this.id = $param5)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param6 IS NOT NULL AND this.id = $param6)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($param7 IS NOT NULL AND this.id = $param7)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
