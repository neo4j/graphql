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
import { gql } from "apollo-server";
import { generate } from "randomstring";
import { IncomingMessage } from "http";
import { Socket } from "net";
import jsonwebtoken from "jsonwebtoken";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("413", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should recreate issue and return correct count", async () => {
        const session = driver.session();

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

        const token = jsonwebtoken.sign(
            {
                tenant_id: tenantID,
            },
            secret
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs, config: { jwt: { secret } } });

        const query = `
            query {
                jobPlansCount(where: {tenantID: "${tenantID}"})
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

            const socket = new Socket({ readable: true });
            const req = new IncomingMessage(socket);
            req.headers.authorization = `Bearer ${token}`;

            const result = await graphql({
                schema: neoSchema.schema,
                source: query,
                contextValue: { driver, req, driverConfig: { bookmarks: session.lastBookmark() } },
            });

            expect(result.errors).toBeFalsy();

            expect(result.data as any).toEqual({
                jobPlansCount: 3,
            });
        } finally {
            await session.close();
        }
    });
});
