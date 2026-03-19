/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLError } from "graphql";
import { generate } from "randomstring";
import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4617", () => {
    const testHelper = new TestHelper();
    const secret = "secret";
    let User: UniqueType;
    let Post: UniqueType;
    let Actor: UniqueType;
    let id: string;
    let actorName: string;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Actor = testHelper.createUniqueType("Actor");

        id = generate({
            charset: "alphabetic",
        });
        actorName = generate({
            charset: "alphabetic",
        });

        await testHelper.executeCypher(
            `   CREATE (:${Post.name} {title: "Post 1"})
                    CREATE (:${User.name} {id: $id, email: randomUUID()})
                    CREATE (:${Actor.name} {id: $id, email: randomUUID(), name: $actorName })
                `,
            { id, actorName }
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not throw forbidden when user does have a correct allow on projection field", async () => {
        const typeDefs = `
            type ${Post.name} @node {
                title: String
                likedBy: [${User.name}!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type ${User.name} @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
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

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: id });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeUndefined();
    });

    test("should throw forbidden when user does not have correct allow on projection field", async () => {
        const typeDefs = `
            type ${Post.name} @node {
                title: String
                likedBy: [${User.name}!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type ${User.name} @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
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

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
    });

    test("should not throw forbidden when user does have a correct allow on projection field (single target)", async () => {
        const typeDefs = `
            type ${Post.name} @node {
                title: String
                likedBy: ${User.name} @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type ${User.name} @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
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

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: id });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeUndefined();
    });

    test("should throw forbidden when user does not have correct allow on projection field (single target)", async () => {
        const typeDefs = `
            type ${Post.name} @node {
                title: String
                likedBy: ${User.name} @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            type ${User.name} @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
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

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
    });

    test("should not throw forbidden when user does have a correct allow on projection field (interface target)", async () => {
        const typeDefs = `
            type ${Post.name} @node {
                title: String
                likedBy: [Person!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            interface Person {
                id: ID
                email: String!
            }

            type ${User.name} implements Person @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
            }

            type ${Actor.name} implements Person @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
                name: String!
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

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: id });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeUndefined();
    });

    test("should throw forbidden when user does not have correct allow on projection field (interface target)", async () => {
        const typeDefs = `
            type ${Post.name} @node {
                title: String
                likedBy: [Person!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            interface Person {
                id: ID
                email: String!
            }

            type ${User.name} implements Person @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
            }

            type ${Actor.name} implements Person @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
                name: String!
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

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        id
                        email
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
    });

    test("should not throw forbidden when user does have a correct allow on projection field (union target)", async () => {
        const typeDefs = `
            type ${Post.name} @node {
                title: String
                likedBy: [Person!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            union Person = ${User.name} | ${Actor.name}

            type ${User.name} @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
            }

            type ${Actor.name} @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
                name: String
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

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        ... on ${User.name} {
                            id
                            email
                        }
                        ... on ${Actor.name} {
                            id
                            email
                            name
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: id });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeUndefined();
    });

    test("should throw forbidden when user does not have correct allow on projection field (union target)", async () => {
        const typeDefs = `
            type ${Post.name} @node {
                title: String
                likedBy: [Person!]! @cypher(
                    statement: """
                        MATCH (user:${User.name} { id: "${id}" })
                        RETURN user
                    """, columnName: "user"
                  )
            }

            union Person = ${User.name} | ${Actor.name}

            type ${User.name} @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
            }

            type ${Actor.name} @node {
                id: ID
                email: String! @authorization(validate: [{ when: [BEFORE], operations: [READ], where: { node: { id_EQ: "$jwt.sub" } } }])
                name: String
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

        const query = `
            {
                ${Post.plural} {
                    likedBy {
                        ... on ${User.name} {
                            id
                            email
                        }
                        ... on ${Actor.name} {
                            id
                            email
                            name
                        }
                    }
                }
            }
        `;

        const token = createBearerToken(secret, { sub: "invalid" });

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token, {
            variableValues: { id },
        });

        expect(gqlResult.errors).toBeDefined();
        expect((gqlResult.errors as GraphQLError[]).some((el) => el.message.includes("Forbidden"))).toBeTruthy();
    });
});
