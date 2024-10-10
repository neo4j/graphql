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

describe("aggregations-where-node-string - connections", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
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

    test("should return posts where the %s like String is EQUAL to", async () => {
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_SHORTEST_LENGTH_EQUAL: ${shortestTestString.length} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

        expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
            edges: [
                {
                    node: {
                        testString,
                        likes: [{ testString: shortestTestString }],
                    },
                },
            ],
        });
    });

    test("should return posts where the LONGEST like String is EQUAL to", async () => {
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_LONGEST_LENGTH_EQUAL: ${longestTestString.length} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

        expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
            edges: [
                {
                    node: {
                        testString,
                        likes: [{ testString: longestTestString }],
                    },
                },
            ],
        });
    });

    describe("AVERAGE", () => {
        test("should return posts where the %s of like Strings is EQUAL to", async () => {
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_AVERAGE_LENGTH_EQUAL: ${avg} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

            const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
            expect(post.node.testString).toEqual(testString);
            expect(post.node.likes).toHaveLength(3);
        });

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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_AVERAGE_LENGTH_GT: ${avgGT} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

            const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
            expect(post.node.testString).toEqual(testString);
            expect(post.node.likes).toHaveLength(3);
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_AVERAGE_LENGTH_GTE: ${avg} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

            const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
            expect(post.node.testString).toEqual(testString);
            expect(post.node.likes).toHaveLength(3);
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_AVERAGE_LENGTH_LT: ${avgLT} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

            const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
            expect(post.node.testString).toEqual(testString);
            expect(post.node.likes).toHaveLength(3);
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_AVERAGE_LENGTH_LTE: ${avg} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

            const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
            expect(post.node.testString).toEqual(testString);
            expect(post.node.likes).toHaveLength(3);
        });
    });
});

describe("aggregations-where-node-string - connections - interface relationships of concrete types", () => {
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

    test("should return posts where the %s like String is EQUAL to", async () => {
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_SHORTEST_LENGTH_EQUAL: ${shortestTestString.length} } } }) {
                           edges {
                            node {
                                 testString
                                    likes {
                                        testString
                                    }
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

        expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
            edges: [
                {
                    node: {
                        testString,
                        likes: [{ testString: shortestTestString }],
                    },
                },
            ],
        });
    });

    test("should return posts where the LONGEST like String is EQUAL to", async () => {
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_LONGEST_LENGTH_EQUAL: ${longestTestString.length} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

        expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
            edges: [
                {
                    node: {
                        testString,
                        likes: [{ testString: longestTestString }],
                    },
                },
            ],
        });
    });

    describe("AVERAGE", () => {
        test("should return posts where the AVERAGE of like Strings is EQUAL to", async () => {
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_AVERAGE_LENGTH_EQUAL: ${avg} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

            const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
            expect(post.node.testString).toEqual(testString);
            expect(post.node.likes).toHaveLength(3);
        });

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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_AVERAGE_LENGTH_GT: ${avgGT} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

            const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
            expect(post.node.testString).toEqual(testString);
            expect(post.node.likes).toHaveLength(3);
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_AVERAGE_LENGTH_GTE: ${avg} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

            const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
            expect(post.node.testString).toEqual(testString);
            expect(post.node.likes).toHaveLength(3);
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_AVERAGE_LENGTH_LT: ${avgLT} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

            const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
            expect(post.node.testString).toEqual(testString);
            expect(post.node.likes).toHaveLength(3);
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_AVERAGE_LENGTH_LTE: ${avg} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

            const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
            expect(post.node.testString).toEqual(testString);
            expect(post.node.likes).toHaveLength(3);
        });
    });
});

describe("aggregations-where-node-string - connections - relationships of interface types", () => {
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

    test("should return posts where the SHORTEST like String is EQUAL to", async () => {
        const typeDefs = /* GraphQL */ `
                    interface Thing {
                        testString: String!
                        likes: [Human!]! @declareRelationship
                    }

                    interface Human {
                        testString: String!
                    }

                    type ${User} implements Human @node {
                        testString: String! @alias(property: "user_testString")
                    }

                    type ${Person} implements Human @node {
                        testString: String! @alias(property: "person_testString")
                    }

                    type ${Post} implements Thing @node {
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
                        ${Post.operations.connection}(where: { testString_EQ: "${testString}", likesAggregate: { node: { testString_SHORTEST_LENGTH_EQUAL: ${shortestTestString.length} } } }) {
                            edges {
                                node {
                                    testString
                                    likes {
                                        testString
                                    }
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

        expect((gqlResult.data as any)[Post.operations.connection].edges).toIncludeSameMembers([
            {
                node: {
                    testString,
                    likes: [{ testString: shortestTestString }],
                },
            },
        ]);
    });
});
