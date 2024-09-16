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
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2789", () => {
    let neoSchema: Neo4jGraphQL;
    const typeDefs = /* GraphQL */ `
        type User @authorization(validate: [{ where: { node: { id: "Foo" } } }]) {
            id: ID
            password: String! @authorization(validate: [{ where: { node: { id: "Bar" } } }])
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
                updateUsers(update: { password: "123" }) {
                    users {
                        password
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:User)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($param1 IS NOT NULL AND this.id = $param1)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($authorization__before_param1 IS NOT NULL AND this.id = $authorization__before_param1)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.password = $this_update_password
            WITH this
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($authorization__after_param1 IS NOT NULL AND this.id = $authorization__after_param1)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($authorization__after_param1 IS NOT NULL AND this.id = $authorization__after_param1)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($update_param1 IS NOT NULL AND this.id = $update_param1)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($update_param2 IS NOT NULL AND this.id = $update_param2)), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            RETURN collect(DISTINCT this { .password }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": false,
                \\"update_param1\\": \\"Foo\\",
                \\"update_param2\\": \\"Bar\\",
                \\"param1\\": \\"Foo\\",
                \\"this_update_password\\": \\"123\\",
                \\"authorization__before_param1\\": \\"Bar\\",
                \\"authorization__after_param1\\": \\"Foo\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
