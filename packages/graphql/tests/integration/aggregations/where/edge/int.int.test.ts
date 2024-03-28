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
            type ${User} {
                testString: String!
            }
        
            type ${Post} {
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

    test("should return posts where a edge like Int is EQUAL to", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someInt = Number(234);

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { someInt: ${someInt} }]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { someInt_EQUAL: ${someInt} } } }) {
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

    test("should return posts where a edge like Float is GT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someInt = Number(5454);
        const someIntGt = someInt - 1;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { someInt: ${someInt} }]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { someInt_GT: ${someIntGt} } } }) {
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

    test("should return posts where a edge like Float is GTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someInt = Number(100000);

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { someInt: ${someInt} }]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { someInt_GTE: ${someInt} } } }) {
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

    test("should return posts where a edge like Float is LT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someInt = Number(2);
        const someIntLT = someInt + 1;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { someInt: ${someInt} }]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { someInt_LT: ${someIntLT} } } }) {
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

    test("should return posts where a edge like Float is LTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someInt = Number(572);

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { someInt: ${someInt} }]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { someInt_LTE: ${someInt} } } }) {
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
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { someInt_AVERAGE_EQUAL: ${avg} } } }) {
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
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { someInt_AVERAGE_GT: ${avgGT} } } }) {
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
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { someInt_AVERAGE_GTE: ${avg} } } }) {
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
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { someInt_AVERAGE_LT: ${avgLT} } } }) {
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
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { someInt_AVERAGE_LTE: ${avg} } } }) {
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
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { someInt_SUM_EQUAL: ${sum} } } }) {
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
