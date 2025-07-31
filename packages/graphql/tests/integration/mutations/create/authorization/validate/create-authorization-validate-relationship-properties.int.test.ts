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

import { GraphQLError } from "graphql";
import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("create with authorization validate on relationship properties", () => {
    const testHelper = new TestHelper();
    let User: UniqueType;
    let Post: UniqueType;
    const secret = "secret";

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");

        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                name: String
                content: [${Post}!]! @relationship(type: "HAS_CONTENT", direction: OUT, properties: "HasContent")
            }

            type ${Post}
                @node
                @authorization(
                    validate: [{ operations: [CREATE, CREATE_RELATIONSHIP], where: { node: { creatorConnection: { all: { edge: { creatorId: { eq: "$jwt.sub" } } } } } }, when: [AFTER]}]
                ) {
                content: String
                creator: [${User}!]! @relationship(type: "HAS_CONTENT", direction: IN, properties: "HasContent")
            }

            type HasContent @relationshipProperties {
                creatorId: ID
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("nested create with authorization validation pass on relationship properties", async () => {
        const id = "123";
        const query = /* GraphQL */ `
            mutation ($id: ID!) {
                ${User.operations.create}(input: [{  name: "Bob", content: {create: {
                    node: {
                        content: "my post"
                    },
                    edge: {
                        creatorId: $id
                    }
                }} }]) {
                    ${User.plural} {
                        name
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { sub: id });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });
        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [User.operations.create]: {
                [User.plural]: [
                    {
                        name: "Bob",
                    },
                ],
            },
        });

        await testHelper.expectRelationship(User, Post, "HAS_CONTENT").toEqual([
            {
                from: {
                    name: "Bob",
                },
                to: {
                    content: "my post",
                },
                relationship: {
                    creatorId: "123",
                },
            },
        ]);
    });

    test("nested create with authorization validation fails on relationship properties", async () => {
        const id = "123";
        const query = /* GraphQL */ `
            mutation {
                ${User.operations.create}(input: [{ name: "Bob", content: {create: {
                    node: {
                        content: "my post"
                    },
                    edge: {
                        creatorId: "another-id"
                    }
                }} }]) {
                    ${User.plural} {
                        name
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { sub: id });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors?.[0]?.message).toBe("Forbidden");
        expect(gqlResult.errors?.[0]).toBeInstanceOf(GraphQLError);

        await testHelper.expectNode(User).toNotExist();
        await testHelper.expectNode(Post).toNotExist();
    });

    test("create and connect with authorization validation pass", async () => {
        const id = "123";
        const query = /* GraphQL */ `
            mutation ($id: ID!) {
                ${User.operations.create}(input: [{ name: "Bob", content: {connect: {
                    where: {
                        node: {
                            content: { eq: "Existing content" }
                        }
                    },
                    edge: {
                        creatorId: $id
                    }
                }} }]) {
                    ${User.plural} {
                        name
                        content {
                            content
                        }
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { sub: id });

        await testHelper.executeCypher(`CREATE(:${Post} {content: "Existing content"})`);
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [User.operations.create]: {
                [User.plural]: [
                    {
                        name: "Bob",
                        content: [
                            {
                                content: "Existing content",
                            },
                        ],
                    },
                ],
            },
        });

        await testHelper.expectRelationship(User, Post, "HAS_CONTENT").count(1);
    });

    test("create and connect with authorization validation fails", async () => {
        const id = "123";
        const query = /* GraphQL */ `
            mutation ($id: ID!) {
                ${User.operations.create}(input: [{  name: "Bob", content: {connect: {
                    where: {
                        node: {
                            content: {eq: "Existing content"}
                        }
                    },
                    edge: {
                        creatorId: $id
                    }
                }} }]) {
                    ${User.plural} {
                        name
                        content {
                            content
                        }
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { sub: id });

        await testHelper.executeCypher(`CREATE(:${Post} { content: "Existing content"})`);
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id: "another-id" },
        });

        expect(gqlResult.errors?.[0]?.message).toBe("Forbidden");
        expect(gqlResult.errors?.[0]).toBeInstanceOf(GraphQLError);

        await testHelper.expectNode(User).toNotExist();
    });
});
