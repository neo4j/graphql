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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { generateUniqueType } from "../../../utils/graphql-types";
import { createJwtRequest } from "../../../utils/create-jwt-request";
import { gql } from "apollo-server";

describe("Aggregate -> count", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should count nodes", async () => {
        const session = driver.session();

        const randomType = generateUniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:${randomType.name} {id: randomUUID()})
                    CREATE (:${randomType.name} {id: randomUUID()})
                `
            );

            const query = `
                {
                    ${randomType.operations.aggregate}{
                      count
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[randomType.operations.aggregate].count).toBe(2);
        } finally {
            await session.close();
        }
    });

    test("should count nodes with where and or predicate", async () => {
        const session = driver.session();
        const randomType = generateUniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const id1 = generate({
            charset: "alphabetic",
        });

        const id2 = generate({
            charset: "alphabetic",
        });

        try {
            await session.run(
                `
                CREATE (:${randomType.name} {id: $id1})
                CREATE (:${randomType.name} {id: $id2})
            `,
                { id1, id2 }
            );

            const query = `
                {
                  ${randomType.operations.aggregate}(where: { OR: [{id: "${id1}"}, {id: "${id2}"}] }){
                    count
                  }
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[randomType.operations.aggregate].count).toEqual(2);
        } finally {
            await session.close();
        }
    });

    test("should return count aggregation with allow @auth", async () => {
        const session = driver.session();
        const jobPlanType = generateUniqueType("JobPlan");

        const typeDefs = gql`
            type ${jobPlanType.name} {
                id: ID! @id
                tenantID: ID!
                name: String!
            }

            extend type ${jobPlanType.name}
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

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        const query = `
            query {
                ${jobPlanType.operations.aggregate}(where: {tenantID: "${tenantID}"}) {
                  count
                }
            }
        `;

        try {
            await session.run(
                `
                    CREATE (:${jobPlanType.name} {tenantID: $tenantID})
                    CREATE (:${jobPlanType.name} {tenantID: $tenantID})
                    CREATE (:${jobPlanType.name} {tenantID: $tenantID})
                `,
                { tenantID }
            );

            const req = createJwtRequest(secret, {
                tenant_id: tenantID,
            });

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(result.errors).toBeFalsy();

            expect((result.data as any)[jobPlanType.operations.aggregate]).toEqual({
                count: 3,
            });
        } finally {
            await session.close();
        }
    });
});
