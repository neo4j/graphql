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
import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { gql } from "apollo-server";
import { generate } from "randomstring";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { createJwtRequest } from "../../utils/create-jwt-request";

describe("413", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    // NOTE: this test was updated to use aggregate instead of count
    test("should recreate issue and return correct count as an aggregation", async () => {
        const session = await neo4j.getSession();

        const typeDefs = gql`
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

        const tenantID = generate({
            charset: "alphabetic",
        });

        const secret = "secret";

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: secret } } });

        const query = `
            query {
                jobPlansAggregate(where: {tenantID: "${tenantID}"}) {
                  count
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:JobPlan {tenantID: $tenantID})
                    CREATE (:JobPlan {tenantID: $tenantID})
                    CREATE (:JobPlan {tenantID: $tenantID})
                `,
                { tenantID }
            );

            const req = createJwtRequest(secret, {
                tenant_id: tenantID,
            });

            const result = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark(), { req }),
            });

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                jobPlansAggregate: { count: 3 },
            });
        } finally {
            await session.close();
        }
    });
});
