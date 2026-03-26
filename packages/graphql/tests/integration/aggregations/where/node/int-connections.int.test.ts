/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("aggregations-where-node-int - connections", () => {
    const someInt1 = 1;
    const someInt2 = 2;
    const someInt3 = 3;
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                name: String
                someInt: Int!
            }
    
            type ${Post} @node {
              title: String!
              likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;
        await testHelper.executeCypher(
            `
                    CREATE (p:${Post} {title: "A popular Post"})
                    CREATE (p)<-[:LIKES]-(u1:${User} { someInt: ${someInt1} })
                    CREATE (p)<-[:LIKES]-(:${User} { someInt: ${someInt2} })
                    CREATE (p)<-[:LIKES]-(:${User} { someInt: ${someInt3} })
                    CREATE (p)<-[:LIKES]-(u1)
                    CREATE (:${Post} {title: "An unpopular Post"})
                `
        );
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("AVERAGE", () => {
        test("should return posts where the average of like Int's is EQUAL to", async () => {
            const avg = (someInt1 + someInt2 + someInt3) / 3;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { average: { eq: ${avg} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });

        test("should return posts where the average of like Int's is GT than", async () => {
            const avg = (someInt1 + someInt2 + someInt3) / 3;
            const avgGT = avg - 1;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { average: { gt: ${avgGT} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });

        test("should return posts where the average of like Int's is GTE than", async () => {
            const avg = (someInt1 + someInt2 + someInt3) / 3;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { average: { gte: ${avg} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });

        test("should return posts where the average of like Int's is LT than", async () => {
            const avg = (someInt1 + someInt2 + someInt3) / 3;
            const avgLT = avg + 1;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { average: { lt: ${avgLT} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });

        test("should return posts where the average of like Int's is LTE than", async () => {
            const avg = (someInt1 + someInt2 + someInt3) / 3;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { average: { lte: ${avg} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });
    });

    describe("sum", () => {
        test("should return posts where the sum of like Int's is EQUAL to", async () => {
            const sum = someInt1 + someInt2 + someInt3;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { sum: { eq: ${sum} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });
    });
});

describe("aggregations-where-node-int - connections - interface relationships of concrete types", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;
    let Person: UniqueType;
    const someInt1 = 1;
    const someInt2 = 2;
    const someInt3 = 3;

    beforeEach(async () => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            interface Human {
                name: String!
                someInt: Int!
            }

            type ${Person} implements Human @node {
                name: String!
                someInt: Int!
            }

            type ${User} implements Human @node {
                name: String!
                someInt: Int!
            }
    
            type ${Post} @node {
              title: String!
              likes: [Human!]! @relationship(type: "LIKES", direction: IN)
            }
        `;
        await testHelper.executeCypher(
            `
                    CREATE (p:${Post} {title: "A popular Post"})
                    CREATE (p)<-[:LIKES]-(u1:${User} { someInt: ${someInt1} })
                    CREATE (p)<-[:LIKES]-(:${User} { someInt: ${someInt2} })
                    CREATE (p)<-[:LIKES]-(:${User} { someInt: ${someInt3} })
                    CREATE (p)<-[:LIKES]-(u1)
                    CREATE (:${Post} {title: "An unpopular Post"})
                `
        );
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("AVERAGE", () => {
        test("should return posts where the average of like Int's is EQUAL to", async () => {
            const avg = (someInt1 + someInt2 + someInt3) / 3;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { average: { eq: ${avg} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });

        test("should return posts where the average of like Int's is GT than", async () => {
            const avg = (someInt1 + someInt2 + someInt3) / 3;
            const avgGT = avg - 1;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { average: { gt: ${avgGT} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });

        test("should return posts where the average of like Int's is GTE than", async () => {
            const avg = (someInt1 + someInt2 + someInt3) / 3;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { average: { gte: ${avg} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });

        test("should return posts where the average of like Int's is LT than", async () => {
            const avg = (someInt1 + someInt2 + someInt3) / 3;
            const avgLT = avg + 1;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { average: { lt: ${avgLT} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });

        test("should return posts where the average of like Int's is LTE than", async () => {
            const avg = (someInt1 + someInt2 + someInt3) / 3;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { average: { lte: ${avg} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });
    });

    describe("sum", () => {
        test("should return posts where the sum of like Int's is EQUAL to", async () => {
            const someInt1 = 1;
            const someInt2 = 2;
            const someInt3 = 3;

            const sum = someInt1 + someInt2 + someInt3;

            const query = /* GraphQL */ `
                    {
                        ${Post.operations.connection}(where: { 
                            likesConnection: {
                                aggregate: {
                                    node: { 
                                        someInt: { sum: { eq: ${sum} } } 
                                    }
                                }
                            }
                        }) {
                            edges {
                                node {
                                    title
                                    likes {
                                        someInt
                                    }
                                }
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            expect(gqlResult.data).toEqual({
                [Post.operations.connection]: {
                    edges: [
                        {
                            node: {
                                title: "A popular Post",
                                likes: expect.toIncludeSameMembers([
                                    { someInt: someInt1 },
                                    { someInt: someInt2 },
                                    { someInt: someInt3 },
                                ]),
                            },
                        },
                    ],
                },
            });
        });
    });
});
