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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import Neo4jHelper from "../../neo4j";
import { Neo4jGraphQL } from "../../../../src/classes";
import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";
import { createBearerToken } from "../../../utils/create-bearer-token";

describe("auth/bind", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    const secret = "secret";

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    describe("create", () => {
        test("should throw forbidden when creating a nested node with invalid bind", async () => {
            const session = await neo4j.getSession({ defaultAccessMode: "WRITE" });

            const typeDefs = `
                type Post {
                    id: ID
                    creator: User! @relationship(type: "HAS_POST", direction: IN)
                }

                type User {
                    id: ID
                    posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type Post @authorization(validate: [{ when: [AFTER], operations: [CREATE], where: { node: { id: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    createUsers(input: [{
                        id: "${userId}",
                        posts: {
                            create: [{
                                node: {
                                    id: "post-id-1",
                                }
                            }]
                        }
                    }]) {
                        users {
                            id
                        }
                    }
                }
            `;

            const plugin = new TestSubscriptionsEngine();

            const neoSchema = new Neo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                    subscriptions: plugin,
                },
            });

            try {
                const token = createBearerToken(secret, { sub: userId });

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues({ token }),
                });

                expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");

                expect(plugin.eventList).toEqual([]);
            } finally {
                await session.close();
            }
        });
    });
});
