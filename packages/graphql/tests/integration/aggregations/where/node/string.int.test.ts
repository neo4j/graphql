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
import { TestHelper } from "../../../utils/tests-helper";

describe("aggregations-where-node-string", () => {
    let testHelper: TestHelper;

    beforeEach(() => {
        testHelper = new TestHelper();
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where a like String is EQUAL to", async () => {
        const typeDefs = `
            type User {
                testString: String!
            }

            type Post {
              testString: String!
              likes: [User!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.runCypher(
            `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}"})
                    CREATE (:Post {testString: "${testString}"})
                `
        );

        const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { testString_EQUAL: "${testString}" } } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.runGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any).posts).toEqual([
            {
                testString,
                likes: [{ testString }],
            },
        ]);
    });

    test("should return posts where a like String is GT than", async () => {
        const typeDefs = `
            type User {
                testString: String!
            }

            type Post {
              testString: String!
              likes: [User!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        const length = 5;
        const gtLength = length - 1;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.runCypher(
            `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}"})
                    CREATE (:Post {testString: "${testString}"})
                `
        );

        const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { testString_GT: ${gtLength} } } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.runGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any).posts).toEqual([
            {
                testString,
                likes: [{ testString }],
            },
        ]);
    });

    test("should return posts where a like String is GTE than", async () => {
        const typeDefs = `
            type User {
                testString: String!
            }

            type Post {
              testString: String!
              likes: [User!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.runCypher(
            `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}"})
                    CREATE (:Post {testString: "${testString}"})
                `
        );

        const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { testString_GTE: ${length} } } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.runGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any).posts).toEqual([
            {
                testString,
                likes: [{ testString }],
            },
        ]);
    });

    test("should return posts where a like String is LT than", async () => {
        const typeDefs = `
            type User {
                testString: String!
            }

            type Post {
              testString: String!
              likes: [User!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length: length - 1,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.runCypher(
            `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}"})
                    CREATE (:Post {testString: "${testString}"})
                `
        );

        const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { testString_LT: ${length} } } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.runGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any).posts).toEqual([
            {
                testString,
                likes: [{ testString }],
            },
        ]);
    });

    test("should return posts where a like String is LTE than", async () => {
        const typeDefs = `
            type User {
                testString: String!
            }

            type Post {
              testString: String!
              likes: [User!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.runCypher(
            `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}"})
                    CREATE (:Post {testString: "${testString}"})
                `
        );

        const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { testString_LTE: ${length} } } }) {
                        testString
                        likes {
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.runGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any).posts).toEqual([
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
                const typeDefs = `
                type User {
                    testString: String!
                }

                type Post {
                  testString: String!
                  likes: [User!]! @relationship(type: "LIKES", direction: IN)
                }
            `;

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

                await testHelper.initNeo4jGraphQL({ typeDefs });

                await testHelper.runCypher(
                    `
                        CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${shortestTestString}"})
                        CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString2}"})
                        CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${longestTestString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { testString_${shortestFilter}_EQUAL: ${shortestTestString.length} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

                const gqlResult = await testHelper.runGraphQL(query);

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                expect((gqlResult.data as any).posts).toEqual([
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
                const typeDefs = `
                type User {
                    testString: String!
                }

                type Post {
                  testString: String!
                  likes: [User!]! @relationship(type: "LIKES", direction: IN)
                }
            `;

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

                await testHelper.initNeo4jGraphQL({ typeDefs });

                await testHelper.runCypher(
                    `
                        CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${shortestTestString}"})
                        CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString2}"})
                        CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${longestTestString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { testString_${longestFilter}_EQUAL: ${longestTestString.length} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

                const gqlResult = await testHelper.runGraphQL(query);

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                expect((gqlResult.data as any).posts).toEqual([
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
                const typeDefs = `
                type User {
                    testString: String!
                }

                type Post {
                  testString: String!
                  likes: [User!]! @relationship(type: "LIKES", direction: IN)
                }
            `;

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

                await testHelper.initNeo4jGraphQL({ typeDefs });

                await testHelper.runCypher(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString3}"})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { testString_${averageFilter}_EQUAL: ${avg} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

                const gqlResult = await testHelper.runGraphQL(query);

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = (gqlResult.data as any).posts as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            }
        );

        test("should return posts where the average of like Strings is GT than", async () => {
            const typeDefs = `
                type User {
                    testString: String!
                }

                type Post {
                  testString: String!
                  likes: [User!]! @relationship(type: "LIKES", direction: IN)
                }
            `;

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

            await testHelper.initNeo4jGraphQL({ typeDefs });

            await testHelper.runCypher(
                `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString3}"})
                        CREATE (:Post {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_GT: ${avgGT} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.runGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any).posts as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Strings is GTE than", async () => {
            const typeDefs = `
                type User {
                    testString: String!
                }

                type Post {
                  testString: String!
                  likes: [User!]! @relationship(type: "LIKES", direction: IN)
                }
            `;

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

            await testHelper.initNeo4jGraphQL({ typeDefs });

            await testHelper.runCypher(
                `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString3}"})
                        CREATE (:Post {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_GTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.runGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any).posts as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Strings is LT than", async () => {
            const typeDefs = `
                type User {
                    testString: String!
                }

                type Post {
                  testString: String!
                  likes: [User!]! @relationship(type: "LIKES", direction: IN)
                }
            `;

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

            await testHelper.initNeo4jGraphQL({ typeDefs });

            await testHelper.runCypher(
                `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString3}"})
                        CREATE (:Post {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_LT: ${avgLT} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.runGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any).posts as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });

        test("should return posts where the average of like Strings is LTE than", async () => {
            const typeDefs = `
                type User {
                    testString: String!
                }

                type Post {
                  testString: String!
                  likes: [User!]! @relationship(type: "LIKES", direction: IN)
                }
            `;

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

            await testHelper.initNeo4jGraphQL({ typeDefs });

            await testHelper.runCypher(
                `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString1}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString2}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString3}"})
                        CREATE (:Post {testString: "${testString}"})
                    `
            );

            const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_LTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                            }
                        }
                    }
                `;

            const gqlResult = await testHelper.runGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            const [post] = (gqlResult.data as any).posts as any[];
            expect(post.testString).toEqual(testString);
            expect(post.likes).toHaveLength(3);
        });
    });

    test("EQUAL with alias", async () => {
        const Post = testHelper.createUniqueType("Post");
        const User = testHelper.createUniqueType("Post");

        const typeDefs = `
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

        const query = `
            {
                ${Post.plural}(where: { likesAggregate: { node: {name_EQUAL: "a"  } } }) {
                    content
                }
            }
        `;

        await testHelper.runCypher(
            `
            CREATE(p:${Post} {content: "test"})<-[:LIKES]-(:${User} {_name: "a"})
            CREATE(p2:${Post} {content: "test2"})<-[:LIKES]-(:${User} {_name: "b"})
            `
        );

        await testHelper.initNeo4jGraphQL({ typeDefs });
        const gqlResult = await testHelper.runGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Post.plural]: [{ content: "test" }],
        });
    });
});
