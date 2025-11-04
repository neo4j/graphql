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

import { generate } from "randomstring";
import { TestSubscriptionsEngine } from "../../../utils/TestSubscriptionsEngine";
import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("auth/bind", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let Post: UniqueType;
    let User: UniqueType;

    beforeEach(() => {
        Post = testHelper.createUniqueType("Post");
        User = testHelper.createUniqueType("User");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("create", () => {
        test("should throw forbidden when creating a nested node with invalid bind", async () => {
            const typeDefs = `
                type ${Post} {
                    id: ID
                    creator: ${User}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User} {
                    id: ID
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authorization(validate: [{ when: [AFTER], operations: [CREATE], where: { node: { id: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{
                        id: "${userId}",
                        posts: {
                            create: [{
                                node: {
                                    id: "post-id-1",
                                }
                            }]
                        }
                    }]) {
                        ${User.plural} {
                            id
                        }
                    }
                }
            `;

            const plugin = new TestSubscriptionsEngine();

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: secret,
                    },
                    subscriptions: plugin,
                },
            });

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");

            expect(plugin.eventList).toEqual([]);
        });
    });
});
