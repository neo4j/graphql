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

describe("Validate rules on create operations", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Rule for CREATE on Post node based on its own fields failed, should throw forbidden", async () => {
        const typeDefs = `
                type ${Post} @node {
                    id: ID 
                }

                extend type ${Post}  @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

        const postId = generate({
            charset: "alphabetic",
        });

        const query = `
                mutation {
                    ${Post.operations.create}(input: [{id: "not bound"}]) {
                        ${Post.plural} {
                            id
                        }
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

        const token = createBearerToken(secret, { sub: postId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("Rule for CREATE on Post node based on its own fields failed as part of created relationship, should throw forbidden", async () => {
        const typeDefs = `
                type ${Post} @node {
                    id: ID
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User} @node {
                    id: ID
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id_EQ: "$jwt.sub" } } }])
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
                                    id: "not-valid",
                                    creator: {
                                        create: { node: {id: "${userId}_2"} }
                                    }
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

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("Rule for CREATE on Post node based on connected User node fields failed, should throw", async () => {
        const typeDefs = `
                type ${Post} @node {
                    id: ID
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${User} @node {
                    id: ID
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
            `;

        const userId = generate({
            charset: "alphabetic",
        });

        const postId = generate({
            charset: "alphabetic",
        });

        const query = `
               mutation {
                   ${Post.operations.create}(input: [
                    {
                       id: "${postId}",
                       creator: {
                            create: { node: { id: "not-the-valid-user-id" } }
                        }
                    }
                ]) {
                        ${Post.plural} {
                            id
                            creator {
                                id
                            }
                        }
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
                    CREATE (:${Post} {id: "${postId}"})
                `);

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("Rule for CREATE on Post node based on connected User node fields failed on connecting to related note, should throw", async () => {
        const typeDefs = `
                type ${Post} @node {
                    id: ID
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${User} @node {
                    id: ID
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
            `;

        const userId = generate({
            charset: "alphabetic",
        });

        const postId = generate({
            charset: "alphabetic",
        });

        const query = `
               mutation {
                   ${Post.operations.create}(input: [
                    {
                       id: "${postId}",
                       creator: {
                            connect: { where: { node: { id: { eq: "not-the-valid-user-id" } } } }
                        }
                    }
                ]) {
                        ${Post.plural} {
                            id
                            creator {
                                id
                            }
                        }
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
                    CREATE (:${User} {id: "not-the-valid-user-id"})
                `);

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("Rule for CREATE on Post node based on its own fields failed in creating nested relationship, should throw", async () => {
        const typeDefs = `
                type ${Post} @node {
                    id: ID
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${User} @node {
                    id: ID
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

        const userId = generate({
            charset: "alphabetic",
        });

        const postId = generate({
            charset: "alphabetic",
        });

        const query = `
               mutation {
                   ${Post.operations.create}(input: [
                    {
                       id: "${postId}",
                       creator: {
                            create: { 
                                node: { id: "${userId}", posts: { create: { node: { id: "not-bound" } } } }
                            }
                        }
                    }
                ]) {
                        ${Post.plural} {
                            id
                            creator {
                                id
                            }
                        }
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
                    CREATE (:${Post} {id: "${postId}"})
                `);

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("Rule for CREATE on Post node based on its own fields failed in connecting nested relationship, should throw", async () => {
        const typeDefs = `
                type ${Post} @node {
                    id: ID
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${User} @node {
                    id: ID
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

        const userId = generate({
            charset: "alphabetic",
        });

        const postId = generate({
            charset: "alphabetic",
        });

        const query = `
               mutation {
                   ${Post.operations.create}(input: [
                    {
                       id: "${postId}",
                       creator: {
                            create: { 
                                node: { id: "${userId}", posts: { create: { node: { id: "not-bound" } } } }
                            }
                        }
                    }
                ]) {
                        ${Post.plural} {
                            id
                            creator {
                                id
                            }
                        }
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
                    CREATE (:${Post} {id: "not-bound"})
                `);

        const token = createBearerToken(secret, { sub: userId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("Rule for CREATE on field of Post node based on its own fields does not fail because field in rule is not provided, should NOT throw", async () => {
        const typeDefs = `
                type ${Post} @node {
                    id: ID
                    name: String
                }

                extend type ${Post} {
                    id: ID @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id_EQ: "$jwt.sub" } } }])
                }
            `;

        const postId = generate({
            charset: "alphabetic",
        });

        const postName = generate({
            charset: "alphabetic",
        });

        const query = `
                mutation {
                    ${Post.operations.create}(input: 
                        [
                            {
                                name: "${postName}",
                            }
                        ]
                        ) {
                        ${Post.plural} {
                            id
                        }
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

        const token = createBearerToken(secret, { sub: postId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(gqlResult.errors).toBeFalsy();
    });

    test("Rule for CREATE on field of Post node based on its own fields failed, should throw forbidden", async () => {
        const typeDefs = `
                type ${Post} @node {
                    id: ID
                    name: String
                }

                extend type ${Post} {
                    id: ID @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id_EQ: "$jwt.sub" } } }])
                }
            `;

        const postId = generate({
            charset: "alphabetic",
        });

        const postName = generate({
            charset: "alphabetic",
        });

        const query = `
                mutation {
                    ${Post.operations.create}(input: 
                        [
                            {
                                id: "${postName}",
                            }
                        ]
                        ) {
                        ${Post.plural} {
                            id
                        }
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

        const token = createBearerToken(secret, { sub: postId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });

    test("Rule for CREATE on field of Post node based on its own fields does not fail on creating related node because field in rule is not provided, should NOT throw", async () => {
        const typeDefs = `
                type ${Post} @node {
                    id: ID
                    title: String
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User} @node {
                    id: ID
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} {
                    id: ID @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id_EQ: "$jwt.postId" } } }])
                }
            `;

        const userId = generate({
            charset: "alphabetic",
        });

        const postId = generate({
            charset: "alphabetic",
        });

        const title = generate({
            charset: "alphabetic",
        });
        const query = `
                mutation {
                    ${User.operations.create}(input: [{
                        id: "${userId}",
                        posts: {
                            create: 
                            [
                                {
                                    node: {
                                        title: "${title}"
                                    }
                                }
                            ]
                        }
                    }]) {
                        ${User.plural} {
                            id
                        }
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

        const token = createBearerToken(secret, { postId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(gqlResult.errors).toBeFalsy();
    });

    test("Rule for CREATE on field of Post node based on its own fields failed on creating related node, should throw", async () => {
        const typeDefs = `
                type ${Post} @node {
                    id: ID
                    title: String
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User} @node {
                    id: ID
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} {
                    id: ID @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id_EQ: "$jwt.postId" } } }])
                }
            `;

        const userId = generate({
            charset: "alphabetic",
        });

        const postId = generate({
            charset: "alphabetic",
        });

        const title = generate({
            charset: "alphabetic",
        });
        const query = `
                mutation {
                    ${User.operations.create}(input: [{
                        id: "${userId}",
                        posts: {
                            create: 
                            [
                                {
                                    node: {
                                        id: "not-bound",
                                        title: "${title}"
                                    }
                                }
                            ]
                        }
                    }]) {
                        ${User.plural} {
                            id
                        }
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

        const token = createBearerToken(secret, { postId });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
    });
});
