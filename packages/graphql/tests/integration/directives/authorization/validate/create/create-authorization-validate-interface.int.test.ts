/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLError } from "graphql";
import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("create interface with authorization validate", () => {
    const testHelper = new TestHelper();
    let User: UniqueType;
    let Post: UniqueType;
    let Comment: UniqueType;
    const secret = "secret";

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Comment = testHelper.createUniqueType("Comment");

        const typeDefs = /* GraphQL */ `
            interface Content {
                title: String!
            }

            type ${Post} implements Content @node {
                title: String!
                creatorId: ID!
                creator: [${User}!]! @relationship(type: "HAS_CONTENT", direction: IN, properties: "CreatedAt")
            }

            type ${Comment} implements Content @node {
                title: String!
                episodes: Int
                creator: [${User}!]! @relationship(type: "HAS_CONTENT", direction: IN, properties: "CreatedAt")
            }

            type ${User} @node {
                id: ID!
                name: String!
                content: [Content!]! @relationship(type: "HAS_CONTENT", direction: OUT, properties: "CreatedAt")
            }

            type CreatedAt @relationshipProperties {
                timestamp: Int
            }

            extend type ${Post}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE, CREATE_RELATIONSHIP]
                            where: { node: { creatorId: { eq: "$jwt.sub" } } }
                        }
                    ]
                )
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

    test("create with authorization validation pass", async () => {
        const id = "123";
        const query = /* GraphQL */ `
            mutation ($id: ID!) {
                ${User.operations.create}(
                    input: [
                        {
                            id: $id
                            name: "Marvin"
                            content: { create: [{ node: { ${Post}: { title: "Doors are evil", creatorId: $id } } }] }
                        }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
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
                info: {
                    relationshipsCreated: 1,
                    nodesCreated: 2,
                },
            },
        });

        await testHelper.expectRelationship(User, Post, "HAS_CONTENT").toEqual([
            {
                from: {
                    id: "123",
                    name: "Marvin",
                },
                to: {
                    creatorId: "123",
                    title: "Doors are evil",
                },
                relationship: {},
            },
        ]);
    });

    test("create with authorization validation fails", async () => {
        const id = "123";
        const query = /* GraphQL */ `
            mutation ($id: ID!) {
                ${User.operations.create}(
                    input: [
                        {
                            id: $id
                            name: "Marvin"
                            content: { create: [{ node: { ${Post}: { title: "Doors are evil", creatorId: "another-id" } } }] }
                        }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, { sub: id });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors?.[0]?.message).toBe("Forbidden");
        expect(gqlResult.errors?.[0]).toBeInstanceOf(GraphQLError);
    });

    test("create connect with authorization validation pass", async () => {
        const id = "123";
        const query = /* GraphQL */ `
            mutation ($id: ID!) {
                ${User.operations.create}(
                    input: [
                        {
                            id: $id
                            name: "Marvin"
                            content: { connect: { where: { node: { title: { eq: "Doors are evil" } } }} }
                        }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        await testHelper.executeCypher(`CREATE(p:${Post} {title: "Doors are evil", creatorId: "${id}"})`);

        const token = testHelper.createBearerToken(secret, { sub: id });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });
        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [User.operations.create]: {
                info: {
                    relationshipsCreated: 1,
                    nodesCreated: 1,
                },
            },
        });

        await testHelper.expectRelationship(User, Post, "HAS_CONTENT").toEqual([
            {
                from: {
                    id: "123",
                    name: "Marvin",
                },
                to: {
                    creatorId: "123",
                    title: "Doors are evil",
                },
                relationship: {},
            },
        ]);
    });

    test("create connect with authorization validation fails", async () => {
        const id = "123";
        const query = /* GraphQL */ `
            mutation ($id: ID!) {
                ${User.operations.create}(
                    input: [
                        {
                            id: $id
                            name: "Marvin"
                            content: { connect: { where: { node: { title: { eq: "Doors are evil" } } }} }
                        }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        await testHelper.executeCypher(`CREATE(p:${Post} {title: "Doors are evil", creatorId: "another-id"})`);

        const token = testHelper.createBearerToken(secret, { sub: id });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors?.[0]?.message).toBe("Forbidden");
        expect(gqlResult.errors?.[0]).toBeInstanceOf(GraphQLError);
    });

    test("create connect with authorization validation ignores rules on the other implementation of the interface", async () => {
        const id = "123";
        const query = /* GraphQL */ `
            mutation ($id: ID!) {
                ${User.operations.create}(
                    input: [
                        {
                            id: $id
                            name: "Marvin"
                            content: { connect: { where: { node: { title: { eq: "Doors are evil" } } }} }
                        }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        await testHelper.executeCypher(`CREATE(p:${Comment} {title: "Doors are evil", creatorId: "another-id"})`);

        const token = testHelper.createBearerToken(secret, { sub: id });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });
        expect(gqlResult.errors).toBeFalsy();

        expect(gqlResult.data).toEqual({
            [User.operations.create]: {
                info: {
                    relationshipsCreated: 1,
                    nodesCreated: 1,
                },
            },
        });

        await testHelper.expectRelationship(User, Comment, "HAS_CONTENT").toEqual([
            {
                from: {
                    id: "123",
                    name: "Marvin",
                },
                to: {
                    creatorId: "another-id",
                    title: "Doors are evil",
                },
                relationship: {},
            },
        ]);
    });
});
