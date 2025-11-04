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

import { gql } from "graphql-tag";
import { generate } from "randomstring";
import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/413", () => {
    const testHelper = new TestHelper();
    let JobPlan: UniqueType;

    beforeAll(() => {
        JobPlan = testHelper.createUniqueType("JobPlan");
    });

    afterAll(async () => {
        await testHelper.close();
    });

    // NOTE: this test was updated to use aggregate instead of count
    test("should recreate issue and return correct count as an aggregation", async () => {
        const typeDefs = gql`
            type JWTPayload @jwt {
                tenant_id: String!
            }

            type ${JobPlan} {
                id: ID! @id @unique
                tenantID: ID!
                name: String!
            }

            extend type ${JobPlan}
                @authorization(
                    validate: [
                        { when: [AFTER], operations: [CREATE, UPDATE], where: { node: { tenantID: "$jwt.tenant_id" } } }
                        {
                            when: [BEFORE]
                            operations: [READ, UPDATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP, DELETE]
                            where: { node: { tenantID: "$jwt.tenant_id" } }
                        }
                    ]
                )
        `;

        const tenantID = generate({
            charset: "alphabetic",
        });

        const secret = "secret";

        await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

        const query = `
            query {
                ${JobPlan.operations.aggregate}(where: {tenantID: "${tenantID}"}) {
                  count
                }
            }
        `;

        await testHelper.executeCypher(
            `
                    CREATE (:${JobPlan} {tenantID: $tenantID})
                    CREATE (:${JobPlan} {tenantID: $tenantID})
                    CREATE (:${JobPlan} {tenantID: $tenantID})
                `,
            { tenantID }
        );

        const token = createBearerToken(secret, {
            tenant_id: tenantID,
        });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeFalsy();

        expect(result.data as any).toEqual({
            [JobPlan.operations.aggregate]: { count: 3 },
        });
    });
});
