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

describe("aggregations-where-node-string", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");

        const typeDefs = /* GraphQL */ `
            type ${User} {
                testString: String!
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

    test("should return posts where a like String is EQUAL to", async () => {
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
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_EQUAL: "${testString}" } } }) {
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
        ]);
    });

    test("should return posts where a like String is GT than", async () => {
        const length = 5;
        const gtLength = length - 1;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_GT: ${gtLength} } } }) {
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
        ]);
    });

    test("should return posts where a like String is GTE than", async () => {
        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });
        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_GTE: ${length} } } }) {
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
        ]);
    });

    test("should return posts where a like String is LT than", async () => {
        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length: length - 1,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_LT: ${length} } } }) {
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
        ]);
    });

    test("should return posts where a like String is LTE than", async () => {
        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_LTE: ${length} } } }) {
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
        ]);
    });

    describe("SHORTEST", () => {
        test.each(["SHORTEST", "SHORTEST_LENGTH"])(
            "should return posts where the %s like String is EQUAL to",
            async (shortestFilter) => {
                const testString = generate({
                    charset: "alphabetic",
                    readable: true,
                });

                const shortestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 10,
                });

                const testString2 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 11,
                });

                const longestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 12,
                });

                await testHelper.executeCypher(
                    `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${longestTestString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_${shortestFilter}_EQUAL: ${shortestTestString.length} } } }) {
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
                        likes: [{ testString: shortestTestString }],
                    },
                ]);
            }
        );
    });

    describe("LONGEST", () => {
        test.each(["LONGEST", "LONGEST_LENGTH"])(
            "should return posts where the %s like String is EQUAL to",
            async (longestFilter) => {
                const testString = generate({
                    charset: "alphabetic",
                    readable: true,
                });

                const shortestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 10,
                });

                const testString2 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 11,
                });

                const longestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 12,
                });

                await testHelper.executeCypher(
                    `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${longestTestString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_${longestFilter}_EQUAL: ${longestTestString.length} } } }) {
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
                        likes: [{ testString: longestTestString }],
                    },
                ]);
            }
        );
    });

    describe("AVERAGE", () => {
        test.each(["AVERAGE", "AVERAGE_LENGTH"])(
            "should return posts where the %s of like Strings is EQUAL to",
            async (averageFilter) => {
                const testString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 10,
                });

                const testString1 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 10,
                });

                const testString2 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 11,
                });

                const testString3 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 12,
                });

                const avg = (10 + 11 + 12) / 3;

                await testHelper.executeCypher(
                    `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString3}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_${averageFilter}_EQUAL: ${avg} } } }) {
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

                const [post] = (gqlResult.data as any)[Post.plural] as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            }
        );

        test("should return posts where the average of like Strings is GT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;
            const avgGT = avg - 1;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString3}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_GT: ${avgGT} } } }) {
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

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Strings is GTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString3}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_GTE: ${avg} } } }) {
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

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Strings is LT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;
            const avgLT = avg + 1;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString3}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_LT: ${avgLT} } } }) {
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

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Strings is LTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString3}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_LTE: ${avg} } } }) {
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

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });
    });
});

describe("aggregations-where-node-string interface relationships of concrete types", () => {
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

            type ${User} implements Human {
                testString: String!
            }

            type ${Person} implements Human {
                testString: String!
            }

            type ${Post} {
                testString: String!
                likes: [Human!]! @relationship(type: "LIKES", direction: IN)
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where a like String is EQUAL to", async () => {
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
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_EQUAL: "${testString}" } } }) {
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
        ]);
    });

    test("should return posts where a like String is GT than", async () => {
        const length = 5;
        const gtLength = length - 1;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_GT: ${gtLength} } } }) {
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
        ]);
    });

    test("should return posts where a like String is GTE than", async () => {
        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_GTE: ${length} } } }) {
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
        ]);
    });

    test("should return posts where a like String is LT than", async () => {
        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length: length - 1,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_LT: ${length} } } }) {
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
        ]);
    });

    test("should return posts where a like String is LTE than", async () => {
        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_LTE: ${length} } } }) {
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
        ]);
    });

    describe("SHORTEST", () => {
        test.each(["SHORTEST", "SHORTEST_LENGTH"])(
            "should return posts where the %s like String is EQUAL to",
            async (shortestFilter) => {
                const testString = generate({
                    charset: "alphabetic",
                    readable: true,
                });

                const shortestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 10,
                });

                const testString2 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 11,
                });

                const longestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 12,
                });

                await testHelper.executeCypher(
                    `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${longestTestString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_${shortestFilter}_EQUAL: ${shortestTestString.length} } } }) {
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
                        likes: [{ testString: shortestTestString }],
                    },
                ]);
            }
        );
    });

    describe("LONGEST", () => {
        test.each(["LONGEST", "LONGEST_LENGTH"])(
            "should return posts where the %s like String is EQUAL to",
            async (longestFilter) => {
                const testString = generate({
                    charset: "alphabetic",
                    readable: true,
                });

                const shortestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 10,
                });

                const testString2 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 11,
                });

                const longestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 12,
                });

                await testHelper.executeCypher(
                    `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${longestTestString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_${longestFilter}_EQUAL: ${longestTestString.length} } } }) {
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
                        likes: [{ testString: longestTestString }],
                    },
                ]);
            }
        );
    });

    describe("AVERAGE", () => {
        test.each(["AVERAGE", "AVERAGE_LENGTH"])(
            "should return posts where the %s of like Strings is EQUAL to",
            async (averageFilter) => {
                const testString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 10,
                });

                const testString1 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 10,
                });

                const testString2 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 11,
                });

                const testString3 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 12,
                });

                const avg = (10 + 11 + 12) / 3;

                await testHelper.executeCypher(
                    `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString3}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_${averageFilter}_EQUAL: ${avg} } } }) {
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

                const [post] = (gqlResult.data as any)[Post.plural] as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            }
        );

        test("should return posts where the average of like Strings is GT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;
            const avgGT = avg - 1;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString3}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_GT: ${avgGT} } } }) {
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

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Strings is GTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString3}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_GTE: ${avg} } } }) {
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

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Strings is LT than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;
            const avgLT = avg + 1;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString3}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_LT: ${avgLT} } } }) {
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

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Strings is LTE than", async () => {
            const testString = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString1 = generate({
                charset: "alphabetic",
                readable: true,
                length: 10,
            });

            const testString2 = generate({
                charset: "alphabetic",
                readable: true,
                length: 11,
            });

            const testString3 = generate({
                charset: "alphabetic",
                readable: true,
                length: 12,
            });

            const avg = (10 + 11 + 12) / 3;

            await testHelper.executeCypher(
                `
                        CREATE (p:${Post} {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:${User} {testString: "${testString3}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_LTE: ${avg} } } }) {
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

            const [post] = (gqlResult.data as any)[Post.plural] as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });
    });
});

describe("EQUAL with alias", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;
    let Person: UniqueType;

    beforeEach(() => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Person = testHelper.createUniqueType("Person");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("aggregations-where-node-string", async () => {
        const typeDefs = /* GraphQL */ `
            type ${User} {
                name: String! @alias(property: "_name")
            }
            type ${Post} {
                content: String
                likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
            interface Likes {
                someString: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            {
                ${Post.plural}(where: { likesAggregate: { node: {name_EQUAL: "a"  } } }) {
                    content
                }
            }
        `;

        await testHelper.executeCypher(
            `
            CREATE(p:${Post} {content: "test"})<-[:LIKES]-(:${User} {_name: "a"})
            CREATE(p2:${Post} {content: "test2"})<-[:LIKES]-(:${User} {_name: "b"})
            `
        );

        const gqlResult = await testHelper.executeGraphQL(query);
        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Post.plural]: [{ content: "test" }],
        });
    });

    test("aggregations-where-node-string interface relationships of concrete types", async () => {
        const typeDefs = /* GraphQL */ `
            interface Human {
                name: String!
                other: String
            }
            type ${User} implements Human {
                name: String! @alias(property: "_name")
                other: String @alias(property: "_other")
            }
            type ${Person} implements Human {
                name: String!
                other: String @alias(property: "_other_person")
            }
            type ${Post} {
                content: String
                likes: [Human!]! @relationship(type: "LIKES", direction: IN)
            }
            interface Likes {
                someString: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            {
                ${Post.plural}(where: { likesAggregate: { node: {name_EQUAL: "a", other_EQUAL: "a"  } } }) {
                    content
                }
            }
        `;

        await testHelper.executeCypher(
            `
            CREATE(p:${Post} {content: "test"})<-[:LIKES]-(:${User} {_name: "a", _other: "a"})
            CREATE(p2:${Post} {content: "test2"})<-[:LIKES]-(:${User} {_name: "b"})
            `
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Post.plural]: [{ content: "test" }],
        });
    });
});

describe("aggregations-where-node-string relationships of interface types", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;
    let Person: UniqueType;

    beforeEach(() => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Person = testHelper.createUniqueType("Person");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where a like String is EQUAL to - concrete relationship", async () => {
        const typeDefs = /* GraphQL */ `
            interface Thing {
                testString: String!
                likes: [${User}!]! @declareRelationship
            }

            type ${User} {
                testString: String!
            }

            type ${Post} implements Thing {
                testString: String!
                likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    things(where: { testString: "${testString}", likesAggregate: { node: { testString_EQUAL: "${testString}" } } }) {
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

        expect((gqlResult.data as any).things).toIncludeSameMembers([
            {
                testString,
                likes: [{ testString }],
            },
        ]);
    });

    test("should return posts where a like String is EQUAL to - concrete relationship - nested", async () => {
        const typeDefs = /* GraphQL */ `
            interface Thing {
                testString: String!
                likes: [${User}!]! @declareRelationship
            }

            type ${User} {
                testString: String!
                things: [Thing!]! @relationship(type: "LIKES", direction: OUT)
            }

            type ${Post} implements Thing {
                testString: String!
                likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });
        const otherUserString = generate({
            charset: "alphabetic",
            readable: true,
        });
        const otherString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                    CREATE (:${User} {testString: "${otherUserString}"})-[:LIKES]->(:${Post} {testString: "${otherString}"})
                `
        );

        const query = /* GraphQL */ `
                {
                    ${User.plural} {
                        testString
                        things(where: { testString: "${testString}", likesAggregate: { node: { testString_EQUAL: "${testString}" } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[User.plural]).toIncludeSameMembers([
            {
                testString,
                things: [
                    {
                        testString,
                        likes: [{ testString }],
                    },
                ],
            },
            { testString: otherUserString, things: [] },
        ]);
    });

    test("should return posts where a like String is EQUAL to - interface relationship", async () => {
        const typeDefs = /* GraphQL */ `
            interface Thing {
                testString: String!
                likes: [Human!]! @declareRelationship
            }

            interface Human {
                testString: String!
            }

            type ${User} implements Human {
                testString: String!
            }

            type ${Person} implements Human {
                testString: String!
            }

            type ${Post} implements Thing {
                testString: String!
                likes: [Human!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    things(where: { testString: "${testString}", likesAggregate: { node: { testString_EQUAL: "${testString}" } } }) {
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

        expect((gqlResult.data as any).things).toIncludeSameMembers([
            {
                testString,
                likes: [{ testString }],
            },
        ]);
    });

    test("EQUAL with alias - interface relationship", async () => {
        const typeDefs = /* GraphQL */ `
            interface Human {
                name: String!
                other: String
            }
            type ${User} implements Human {
                name: String! @alias(property: "_name")
                other: String @alias(property: "_other")
            }
            type ${Person} implements Human {
                name: String!
                other: String @alias(property: "_other_person")
            }
            interface Thing {
                content: String
                likes: [Human!]! @declareRelationship
            }
            type ${Post} implements Thing {
                content: String
                likes: [Human!]! @relationship(type: "LIKES", direction: IN)
            }
            interface Likes {
                someString: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
            {
                ${Post.plural}(where: { likesAggregate: { node: {name_EQUAL: "a", other_EQUAL: "a"  } } }) {
                    content
                }
            }
        `;

        await testHelper.executeCypher(
            `
            CREATE(p:${Post} {content: "test"})<-[:LIKES]-(:${User} {_name: "a", _other: "a"})
            CREATE(p2:${Post} {content: "test2"})<-[:LIKES]-(:${User} {_name: "b"})
            `
        );

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Post.plural]: [{ content: "test" }],
        });
    });

    describe("SHORTEST - interface relationship", () => {
        test.each(["SHORTEST", "SHORTEST_LENGTH"])(
            "should return posts where the %s like String is EQUAL to",
            async (shortestFilter) => {
                const typeDefs = /* GraphQL */ `
                    interface Thing {
                        testString: String!
                        likes: [Human!]! @declareRelationship
                    }

                    interface Human {
                        testString: String!
                    }

                    type ${User} implements Human {
                        testString: String! @alias(property: "user_testString")
                    }

                    type ${Person} implements Human {
                        testString: String! @alias(property: "person_testString")
                    }

                    type ${Post} implements Thing {
                        testString: String!
                        likes: [Human!]! @relationship(type: "LIKES", direction: IN)
                    }
                `;

                await testHelper.initNeo4jGraphQL({ typeDefs });

                const testString = generate({
                    charset: "alphabetic",
                    readable: true,
                });

                const shortestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 10,
                });

                const testString2 = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 11,
                });

                const longestTestString = generate({
                    charset: "alphabetic",
                    readable: true,
                    length: 12,
                });

                await testHelper.executeCypher(
                    `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {user_testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {user_testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {user_testString: "${longestTestString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { testString_${shortestFilter}_EQUAL: ${shortestTestString.length} } } }) {
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
                        likes: [{ testString: shortestTestString }],
                    },
                ]);
            }
        );
    });
});
