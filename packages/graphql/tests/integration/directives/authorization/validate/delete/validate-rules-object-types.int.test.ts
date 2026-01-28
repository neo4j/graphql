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
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";
describe("Validate rules on delete operations", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let userType: UniqueType;
    let postType: UniqueType;

    beforeEach(() => {
        userType = testHelper.createUniqueType("User");
        postType = testHelper.createUniqueType("Post");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("BEFORE rules", () => {
        test("should not throw Forbidden when deleting a node when allow is valid", async () => {
            const typeDefs = `
                type ${userType.name} @node {
                    id: ID
                }

                extend type ${userType.name} @authorization(validate: [ { operations: [DELETE], when: BEFORE, where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.delete}(
                        where: { id_EQ: "${userId}" }
                    ) {
                       nodesDeleted
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: `${userId}` });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw Forbidden when deleting a node with invalid allow", async () => {
            const typeDefs = `
                type ${userType.name} @node {
                    id: ID
                }

                extend type ${userType.name} @authorization(validate: [ { operations: [DELETE], when: BEFORE, where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.delete}(
                        where: { id_EQ: "${userId}" }
                    ) {
                       nodesDeleted
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when deleting a nested node with invalid allow", async () => {
            const typeDefs = `
                type ${userType.name} @node {
                    id: ID
                    posts: [${postType.name}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${postType.name} @node {
                    id: ID
                    name: String
                    creator: [${userType.name}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type ${postType.name} @authorization(validate: [ { operations: [DELETE], when: BEFORE, where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${userType.operations.delete}(
                        where: { id_EQ: "${userId}" },
                        delete: {
                            posts: {
                                where: {
                                    node: {
                                        id_EQ: "${postId}"
                                    }
                                }
                            }
                        }
                    ) {
                       nodesDeleted
                    }
                }
            `;

            await testHelper.initNeo4jGraphQL({
                typeDefs,
                features: {
                    authorization: {
                        key: "secret",
                    },
                },
            });

            await testHelper.executeCypher(`
                    CREATE (:${userType.name} {id: "${userId}"})-[:HAS_POST]->(:${postType.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });
});
