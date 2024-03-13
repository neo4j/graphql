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

import { faker } from "@faker-js/faker";
import { generate } from "randomstring";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("aggregations-where-node-int", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        const typeDefs = `
            type ${User} {
                testString: String!
                someInt: Int!
            }
    
            type ${Post} {
              testString: String!
              likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where a like Int is EQUAL to", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someInt = Number(faker.number.int({ max: 100000 }));

        await testHelper.runCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { someInt_EQUAL: ${someInt} } } }) {
                        testString
                        likes {
                            testString
                            someInt
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.runGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString, someInt }],
            },
        ]);
    });

    test("should return posts where a like Float is GT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someInt = Number(faker.number.int({ max: 100000 }));
        const someIntGt = someInt - 1;

        await testHelper.runCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { someInt_GT: ${someIntGt} } } }) {
                        testString
                        likes {
                            testString
                            someInt
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.runGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString, someInt }],
            },
        ]);
    });

    test("should return posts where a like Float is GTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someInt = Number(faker.number.int({ max: 100000 }));

        await testHelper.runCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { someInt_GTE: ${someInt} } } }) {
                        testString
                        likes {
                            testString
                            someInt
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.runGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString, someInt }],
            },
        ]);
    });

    test("should return posts where a like Float is LT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someInt = Number(faker.number.int({ max: 100000 }));
        const someIntLT = someInt + 1;

        await testHelper.runCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { someInt_LT: ${someIntLT} } } }) {
                        testString
                        likes {
                            testString
                            someInt
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.runGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString, someInt }],
            },
        ]);
    });

    test("should return posts where a like Float is LTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someInt = Number(faker.number.int({ max: 100000 }));

        await testHelper.runCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { someInt_LTE: ${someInt} } } }) {
                        testString
                        likes {
                            testString
                            someInt
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.runGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ testString, someInt }],
            },
        ]);
    });

    describe("AVERAGE", () => {
        const someInt1 = 1;
        const someInt2 = 2;
        const someInt3 = 3;

        test("should return posts where the average of like Int's is EQUAL to", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const avg = (someInt1 + someInt2 + someInt3) / 3;

            await testHelper.runCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { someInt_AVERAGE_EQUAL: ${avg} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.runGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Int's is GT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const avg = (someInt1 + someInt2 + someInt3) / 3;
            const avgGT = avg - 1;

            await testHelper.runCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { someInt_AVERAGE_GT: ${avgGT} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.runGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Int's is GTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const avg = (someInt1 + someInt2 + someInt3) / 3;

            await testHelper.runCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { someInt_AVERAGE_GTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.runGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Int's is LT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const avg = (someInt1 + someInt2 + someInt3) / 3;
            const avgLT = avg + 1;

            await testHelper.runCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { someInt_AVERAGE_LT: ${avgLT} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.runGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Int's is LTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const avg = (someInt1 + someInt2 + someInt3) / 3;

            await testHelper.runCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { someInt_AVERAGE_LTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.runGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });
    });

    describe("sum", () => {
        test("should return posts where the sum of like Int's is EQUAL to", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const someInt1 = 1;
            const someInt2 = 2;
            const someInt3 = 3;

            const sum = someInt1 + someInt2 + someInt3;

            await testHelper.runCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { someInt_SUM_EQUAL: ${sum} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.runGraphQL(query);

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });
    });
});
