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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../utils/tck-test-utils";

describe("#413", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type JobPlan {
                id: ID! @id
                tenantID: ID!
                name: String!
            }

            extend type JobPlan
                @auth(
                    rules: [
                        { operations: [CREATE, UPDATE], bind: { tenantID: "$context.jwt.tenant_id" } }
                        {
                            operations: [READ, UPDATE, CONNECT, DISCONNECT, DELETE]
                            allow: { tenantID: "$context.jwt.tenant_id" }
                        }
                    ]
                )
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Should add where before CALL", async () => {
        const query = gql`
            query {
                jobPlansCount(where: { tenantID: "some_id" })
            }
        `;

        const req = createJwtRequest("secret", { tenant_id: "some_id" });
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:JobPlan)
            WHERE this.tenantID = $this_tenantID
            CALL apoc.util.validate(NOT(this.tenantID IS NOT NULL AND this.tenantID = $this_auth_allow0_tenantID), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN count(this)"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_tenantID\\": \\"some_id\\",
                \\"this_auth_allow0_tenantID\\": \\"some_id\\"
            }"
        `);
    });
});
