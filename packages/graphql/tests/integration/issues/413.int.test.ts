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

import { graphql } from "graphql";
import { gql } from "graphql-tag";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../src/classes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("413", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let JobPlan: UniqueType;
    let typeDefs: string;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        JobPlan = new UniqueType("JobPlan");
    });

    afterAll(async () => {
        await driver.close();
    });

    // NOTE: this test was updated to use aggregate instead of count
    test("should recreate issue and return correct count as an aggregation", async () => {
        const session = await neo4j.getSession();

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

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

        const query = `
            query {
                ${JobPlan.operations.aggregate}(where: {tenantID: "${tenantID}"}) {
                  count
                }
            }
        `;

        try {
            await session.run(
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

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues({ token }),
            });

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                [JobPlan.operations.aggregate]: { count: 3 },
            });
        } finally {
            await session.close();
        }
    });
});
