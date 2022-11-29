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

import { Neo4jGraphQLAuthJWTPlugin } from "@neo4j/graphql-plugin-auth";
import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("Cypher Auth Projection", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                id: ID
                name: String
            }

            extend type User {
                id: ID @auth(rules: [{ allow: { id: "$jwt.sub" } }])
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true },
            plugins: {
                auth: new Neo4jGraphQLAuthJWTPlugin({
                    secret,
                }),
            },
        });
    });

    test("Update Node", async () => {
        const query = gql`
            mutation {
                updateUsers(update: { id: "new-id" }) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`User\`)
            WITH *
            WITH this
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            SET this.id = $this_update_id
            WITH *
            CALL apoc.util.validate(NOT ((this.id IS NOT NULL AND this.id = $thisauth_param0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN collect(DISTINCT this { .id }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_update_id\\": \\"new-id\\",
                \\"thisauth_param0\\": \\"super_admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });

    test("Create Node", async () => {
        const query = gql`
            mutation {
                createUsers(input: [{ id: "id-1" }, { id: "id-2" }]) {
                    users {
                        id
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", { sub: "super_admin", roles: ["admin"] });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "UNWIND $create_param0 AS create_var1
            CALL {
                WITH create_var1
                CREATE (create_this0:\`User\`)
                SET
                    create_this0.id = create_var1.id
                RETURN create_this0
            }
            RETURN collect(create_this0 { .id }) AS data"
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
                ],
                \\"projectionauth_param0\\": \\"super_admin\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
