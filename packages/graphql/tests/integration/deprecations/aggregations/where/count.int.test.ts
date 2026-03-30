/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("aggregations-where-count", () => {
    const testHelper = new TestHelper();
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");

        const typeDefs = /* GraphQL */ `
            type ${User} @node {
                testString: String!
            }

            type ${Post} @node {
              testString: String!
              likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where the count of likes equal one", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = /* GraphQL */ `
                {
                    ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { count_EQ: 1 } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString }],
            },
        ]);
    });

    test("should return posts where the count of likes equal one, with implicit count", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = /* GraphQL */ `
                {
                    ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { count: { eq: 1 } } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString }],
            },
        ]);
    });

    test("should return posts where the count of likes LT one", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { count_LT: 1 } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [],
            },
        ]);
    });

    test("should return posts where the count of likes LTE one", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { count_LTE: 1 } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toIncludeSameMembers([
            {
                testString,
                likes: [{ testString }],
            },
            {
                testString,
                likes: [],
            },
        ]);
    });

    test("should return posts where the count of likes GT one, regardless of number of likes over 1", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (p:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { count_GT: 1 } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: expect.toIncludeSameMembers([{ testString }, { testString }]),
            },
        ]);
    });

    test("should return posts where the count of likes GT one", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { count_GTE: 1 } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString }],
            },
        ]);
    });
});

describe("aggregations-where-count  interface relationships of concrete types", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
        interface Human {
            testString: String!
        }

        type ${User} implements Human @node {
            testString: String!
        }

        type ${Person} implements Human @node {
            testString: String!
        }

            type ${Post} @node {
              testString: String!
              likes: [Human!]! @relationship(type: "LIKES", direction: IN)
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where the count of likes equal one", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { count_EQ: 1 } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString }],
            },
        ]);
    });

    test("should return posts where the count of likes LT one", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { count_LT: 1 } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [],
            },
        ]);
    });

    test("should return posts where the count of likes LTE one", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { count_LTE: 1 } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toIncludeSameMembers([
            {
                testString,
                likes: [{ testString }],
            },
            {
                testString,
                likes: [],
            },
        ]);
    });

    test("should return posts where the count of likes GT one, regardless of number of likes over 1", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (p:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { count_GT: 1 } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: expect.toIncludeSameMembers([{ testString }, { testString }]),
            },
        ]);
    });

    test("should return posts where the count of likes GT one", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString_EQ: "${testString}", likesAggregate: { count_GTE: 1 } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString }],
            },
        ]);
    });
});
