/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import { createBearerToken } from "../../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("Validate rules on update operations", () => {
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

    describe("AFTER rules", () => {
        test("should not throw forbidden when updating a node when rule is valid", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User} @node {
                    id: ID
                }

                extend type ${User} @authorization(validate: [{ when: AFTER, operations: [UPDATE], where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });
            const userId2 = generate({
                charset: "alphabetic",
            });

            const query = /* GraphQL */ `
                mutation {
                    ${User.operations.update}(where: { id_EQ: "${userId2}" }, update: { id_SET: "${userId}" }) {
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId2}"})
                `);

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw forbidden when updating a node with invalid rule", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User} @node {
                    id: ID
                }

                extend type ${User} @authorization(validate: [{ when: AFTER, operations: [UPDATE], where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = /* GraphQL */ `
                mutation {
                    ${User.operations.update}(where: { id_EQ: "${userId}" }, update: { id_SET: "not bound" }) {
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw forbidden when updating a nested node with invalid rule set on connected node", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Post} @node {
                    id: ID
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User} @node {
                    id: ID
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [UPDATE], where: { node: { creator_SINGLE: { id_EQ: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = /* GraphQL */ `
                mutation {
                    ${User.operations.update}(
                        where: { id_EQ: "${userId}" },
                        update: {
                            id_SET: "${userId}",
                            posts: {
                                update: {
                                    where: { node: { id_EQ: "${postId}" } },
                                    node: {
                                        creator: { update: { node: { id_SET: "not bound" } } }
                                    }
                                }
                            }
                        }
                    ) {
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})-[:HAS_POST]->(:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw forbidden when updating a node property with invalid rule", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User} @node {
                    id: ID
                }

                extend type ${User} {
                    id: ID @authorization(validate: [{ when: AFTER, operations: [UPDATE], where: { node: { id_EQ: "$jwt.sub" } } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = /* GraphQL */ `
                mutation {
                    ${User.operations.update}(
                        where: { id_EQ: "${userId}" },
                        update: { id_SET: "not bound" }
                    ) {
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

            await testHelper.executeCypher(`
                    CREATE (:${User} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw forbidden when creating connection with invalid rule through update", async () => {
            const typeDefs = `
                type ${Post} @node {
                    id: ID
                    creator: [${User}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${User} @node {
                    id: ID
                }

                extend type ${User}  {
                    id: ID @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id_EQ: "$jwt.sub" } } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });
            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
               mutation {
                   ${Post.operations.update}(
                       where: { id_EQ: "${postId}" }
                       update: {
                           creator: {
                               create: { node: { id: "not bound" } }
                           }
                       }
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

            await testHelper.executeCypher(`
                    CREATE (:${Post} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });

    describe("BEFORE rules", () => {
        test("should notthrow Forbidden when editing a node with valid allow", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User.name}  @node {
                    id: ID
                }

                extend type ${User.name}
                @authorization(validate: [ { operations: [UPDATE], when: BEFORE, where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = /* GraphQL */ `
                mutation {
                    ${User.operations.update}(where: { id_EQ: "${userId}" }, update: { id_SET: "new-id" }) {
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

            await testHelper.executeCypher(`
                    CREATE (: ${User.name} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect(gqlResult.errors).toBeUndefined();
        });

        test("should throw Forbidden when editing a node with invalid allow", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User.name}  @node {
                    id: ID
                }

                extend type ${User.name}
                @authorization(validate: [ { operations: [UPDATE], when: BEFORE, where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = /* GraphQL */ `
                mutation {
                    ${User.operations.update}(where: { id_EQ: "${userId}" }, update: { id_SET: "new-id" }) {
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

            await testHelper.executeCypher(`
                    CREATE (: ${User.name} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when editing a property with invalid allow", async () => {
            const typeDefs = /* GraphQL */ `
                type ${User.name} {
                    id: ID
                }

                extend type ${User.name} @node {
                    password: String @authorization(validate: [ { operations: [UPDATE], when: BEFORE, where: { node: { id_EQ: "$jwt.sub" } } }])
                }

            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = /* GraphQL */ `
                mutation {
                    ${User.operations.update}(where: { id_EQ: "${userId}"}, update: { password_SET: "new-password" }) {
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

            await testHelper.executeCypher(`
                    CREATE (:${User.name} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when editing a nested node with invalid allow", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Post.name} @node {
                    id: ID
                    content: String
                    creator: [${User.name}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User.name} @node {
                    id: ID
                }

                extend type ${User.name} @authorization(validate: [ { operations: [UPDATE], when: BEFORE, where: { node: { id_EQ: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Post.operations.update}(
                        where: { id_EQ: "${postId}" }
                        update: { creator: { update: { node: { id_SET: "new-id" } } } }
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

            await testHelper.executeCypher(`
                    CREATE (:${User.name} {id: "${userId}"})-[:HAS_POST]->(:${Post.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should throw Forbidden when editing a nested node property with invalid allow", async () => {
            const typeDefs = /* GraphQL */ `
                type ${Post.name} @node {
                    id: ID
                    content: String
                    creator: [${User.name}!]! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User.name} @node {
                    id: ID
                }

                extend type ${User.name} {
                    password: String @authorization(validate: [ { operations: [UPDATE], when: BEFORE, where: { node: { id_EQ: "$jwt.sub" } } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = /* GraphQL */ `
                mutation {
                    ${Post.operations.update}(
                        where: { id_EQ: "${postId}" }
                        update: { creator: { update: { node: { password_SET: "new-password" } } } }
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

            await testHelper.executeCypher(`
                    CREATE (:${User.name} {id: "${userId}"})-[:HAS_POST]->(:${Post.name} {id: "${postId}"})
                `);

            const token = createBearerToken(secret, { sub: "invalid" });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });
});
