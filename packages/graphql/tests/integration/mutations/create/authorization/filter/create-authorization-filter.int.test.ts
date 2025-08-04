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

import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("create with authorization filter", () => {
    const testHelper = new TestHelper();
    let User: UniqueType;
    let Post: UniqueType;
    let Link: UniqueType;
    const secret = "secret";

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Link = testHelper.createUniqueType("Link");

        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                id: ID
                name: String
                content: [${Post}!]! @relationship(type: "HAS_CONTENT", direction: OUT)
            }

            type ${Post}
                @node
                @authorization(
                    filter: [{ operations: [CREATE_RELATIONSHIP], where: { node: { creatorId: { eq: "$jwt.sub" } } } }]
                ) {
                creatorId: ID
                content: String
                creator: [${User}!]! @relationship(type: "HAS_CONTENT", direction: IN)
                links: [${Link}!]! @relationship(type: "HAS_LINK", direction: OUT)
            }

            type ${Link} 
                @node 
                @authorization( filter: [{ operations: [CREATE_RELATIONSHIP], where: { node: { public: { eq: true } } } }]) {
                url: String
                public: Boolean
            }

            extend type ${User}
                @authorization(filter: [{ operations: [CREATE_RELATIONSHIP], where: { node: { id: { eq: "$jwt.sub" } } } }])
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

    test("create and connect with authorization filter", async () => {
        const id = "123";
        const query = /* GraphQL */ `
            mutation ($id: ID!) {
                ${User.operations.create}(input: [{ id: $id, name: "Bob", content: {connect: {
                    where: {
                        node: {
                            content: {eq: "dont panic"}
                        }
                    }
                }} }]) {
                    ${User.plural} {
                        id
                        content {
                            creatorId,
                            content
                        }
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { sub: id });

        await testHelper.executeCypher(`
            CREATE(:${Post} {creatorId: "${id}", content: "dont panic"})
            CREATE(:${Post} {creatorId: "another-id", content: "dont panic"})
            `);
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [User.operations.create]: {
                [User.plural]: [
                    {
                        id,
                        content: [
                            {
                                creatorId: id,
                                content: "dont panic",
                            },
                        ],
                    },
                ],
            },
        });

        await testHelper.expectRelationship(User, Post, "HAS_CONTENT").toEqual([
            {
                from: {
                    id,
                    name: "Bob",
                },
                to: {
                    creatorId: id,
                    content: "dont panic",
                },
                relationship: {},
            },
        ]);
    });

    test("create -> connect -> connect with authorization filter", async () => {
        const id = "123";
        const query = /* GraphQL */ `
            mutation ($id: ID!) {
                ${User.operations.create}(input: [{ id: $id, name: "Bob", content: {connect: {
                    where: {
                        node: {
                            content: {eq: "dont panic"}
                        }
                    },
                    connect: {
                        links: {}
                    }
                }} }]) {
                    ${User.plural} {
                        id
                        content {
                            creatorId,
                            content
                        }
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { sub: id });

        await testHelper.executeCypher(`
            CREATE(:${Post} {creatorId: "${id}", content: "dont panic"})
            CREATE(:${Post} {creatorId: "another-id", content: "dont panic"})
            
            CREATE(:${Link} {url: "url-1", public: true})
            CREATE(:${Link} {url: "url-2", public: false})
            `);
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [User.operations.create]: {
                [User.plural]: [
                    {
                        id,
                        content: [
                            {
                                creatorId: id,
                                content: "dont panic",
                            },
                        ],
                    },
                ],
            },
        });

        await testHelper.expectRelationship(User, Post, "HAS_CONTENT").toEqual([
            {
                from: {
                    id,
                    name: "Bob",
                },
                to: {
                    creatorId: id,
                    content: "dont panic",
                },
                relationship: {},
            },
        ]);

        await testHelper.expectRelationship(Post, Link, "HAS_LINK").toEqual([
            {
                to: {
                    url: "url-1",
                    public: true,
                },
                from: {
                    creatorId: id,
                    content: "dont panic",
                },
                relationship: {},
            },
        ]);
    });
});
