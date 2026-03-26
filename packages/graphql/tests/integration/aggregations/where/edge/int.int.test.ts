/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("aggregations-where-edge-int", () => {
    const testHelper = new TestHelper();
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");

        const typeDefs = `
            type ${User} @node {
                testString: String!
            }
        
            type ${Post} @node {
              testString: String!
              likes: [${User}!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }
        
            type Likes @relationshipProperties {
                someInt: Int
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    describe("AVERAGE", () => {
        const someInt1 = 1;
        const someInt2 = 2;
        const someInt3 = 3;

        test("should return posts where the average of a edge like Int's is EQUAL to", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const avg = (someInt1 + someInt2 + someInt3) / 3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt1} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt2} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt3} }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: { eq: "${testString}" }, likesConnection: { aggregate: { edge: { someInt: { average: { eq: ${avg} } } } } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of a edge like Int's is GT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const avg = (someInt1 + someInt2 + someInt3) / 3;
            const avgGT = avg - 1;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt1} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt2} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt3} }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: { eq: "${testString}" }, likesConnection: { aggregate: { edge: { someInt: { average: { gt: ${avgGT} } } } } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of a edge like Int's is GTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const avg = (someInt1 + someInt2 + someInt3) / 3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt1} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt2} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt3} }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: { eq: "${testString}" }, likesConnection: { aggregate: { edge: { someInt: { average: { gte: ${avg} } } } } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();
            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of a edge like Int's is LT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const avg = (someInt1 + someInt2 + someInt3) / 3;
            const avgLT = avg + 1;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt1} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt2} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt3} }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: { eq: "${testString}" }, likesConnection: { aggregate: { edge: { someInt: { average: { lt: ${avgLT} } } } } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of a edge like Int's is LTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const avg = someInt1 + someInt2 + someInt3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt1} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt2} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt3} }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: { eq: "${testString}" }, likesConnection: { aggregate: { edge: { someInt: { average: { lte: ${avg} } } } } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });
    });

    describe("sum", () => {
        test("should return posts where the sum of a edge like Int's is EQUAL to", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const someInt1 = 1;
            const someInt2 = 2;
            const someInt3 = 3;

            const sum = someInt1 + someInt2 + someInt3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt1} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt2} }]-(:${User} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES { someInt: ${someInt3} }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: { eq: "${testString}" }, likesConnection: { aggregate: { edge: { someInt: { sum: { eq: ${sum} } } } } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });
    });
});
