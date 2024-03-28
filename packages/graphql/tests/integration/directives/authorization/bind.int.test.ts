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
import { createBearerToken } from "../../../utils/create-bearer-token";
import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("auth/bind", () => {
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

    describe("create", () => {
        test("should throw forbidden when creating a node with invalid bind", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                }

                extend type ${User} @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: [{id: "not bound"}]) {
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

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id: "$jwt.sub" } } }])
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

        test("should throw forbidden when creating field with invalid bind", async () => {
            const typeDefs = `
                type ${Post} {
                    id: ID
                    creator: ${User}! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${User} {
                    id: ID
                }

                extend type ${User}  {
                    id: ID @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id: "$jwt.sub" } } }])
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
                       where: { id: "${postId}" }
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

        test("should no throw forbidden when creating a node without passing the bind specified at the Field level", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                    name: String
                }

                extend type ${User} {
                    id: ID @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const userName = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: 
                        [
                            {
                                name: "${userName}",
                            }
                        ]
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

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
            expect(gqlResult.errors).toBeFalsy();
        });

        test("should throw forbidden when creating a node when rule is not satisfied", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID 
                    name: String
                }

                extend type ${User} {
                    id: ID @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const userName = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.create}(input: 
                        [
                            {
                                id: "${userName}",
                            }
                        ]
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

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });

        test("should no throw forbidden when creating a nested node without passing the bind specified at the Field level", async () => {
            const typeDefs = `
                type ${Post} {
                    id: ID
                    title: String
                    creator: ${User}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User} {
                    id: ID
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} {
                    id: ID @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { id: "$jwt.postId" } } }])
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

        test("should throw forbidden when creating field with invalid bind (bind across relationships)", async () => {
            const typeDefs = `
                type ${Post} {
                    id: ID
                    creator: ${User}! @relationship(type: "HAS_POST", direction: OUT)
                }

                type ${User} {
                    id: ID
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [CREATE], where: { node: { creator: { id: "$jwt.sub" } } } }])
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
    });

    describe("update", () => {
        test("should throw forbidden when updating a node with invalid bind", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                }

                extend type ${User} @authorization(validate: [{ when: AFTER, operations: [UPDATE], where: { node: { id: "$jwt.sub" } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.update}(where: { id: "${userId}" }, update: { id: "not bound" }) {
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

        test("should throw forbidden when updating a nested node with invalid bind", async () => {
            const typeDefs = `
                type ${Post} {
                    id: ID
                    creator: ${User}! @relationship(type: "HAS_POST", direction: IN)
                }

                type ${User} {
                    id: ID
                    posts: [${Post}!]! @relationship(type: "HAS_POST", direction: OUT)
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [UPDATE], where: { node: { creator: { id: "$jwt.sub" } } } }])
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const postId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.update}(
                        where: { id: "${userId}" },
                        update: {
                            posts: {
                                where: { node: { id: "${postId}" } },
                                update: {
                                    node: {
                                        creator: { update: { node: { id: "not bound" } } }
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

        test("should throw forbidden when updating a node property with invalid bind", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                }

                extend type ${User} {
                    id: ID @authorization(validate: [{ when: AFTER, operations: [UPDATE], where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            const userId = generate({
                charset: "alphabetic",
            });

            const query = `
                mutation {
                    ${User.operations.update}(
                        where: { id: "${userId}" },
                        update: { id: "not bound" }
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
    });

    describe("connect", () => {
        test("should throw forbidden when connecting a node property with invalid bind", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                }

                type ${Post} {
                    id: ID
                    creator: ${User}! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [CREATE_RELATIONSHIP], where: { node: { creator: { id: "$jwt.sub" } } } }])
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
                        where: { id: "${postId}" },
                        connect: {
                            creator: {
                                where: { node: { id: "not bound" } }
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

    describe("disconnect", () => {
        test("should throw forbidden when disconnecting a node property with invalid bind", async () => {
            const typeDefs = `
                type ${User} {
                    id: ID
                }

                type ${Post} {
                    id: ID
                    creator: ${User}! @relationship(type: "HAS_POST", direction: IN)
                }

                extend type ${Post} @authorization(validate: [{ when: AFTER, operations: [DELETE_RELATIONSHIP], where: { node: { creator: { id: "$jwt.sub" } } } }])
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
                        where: { id: "${postId}" },
                        disconnect: {
                            creator: {
                                where: { node: { id: "${userId}" } }
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
                    CREATE (:${Post} {id: "${postId}"})<-[:HAS_POST]-(:${User} {id: "${userId}"})
                `);

            const token = createBearerToken(secret, { sub: userId });

            const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

            expect((gqlResult.errors as any[])[0].message).toBe("Forbidden");
        });
    });
});
