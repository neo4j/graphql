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

import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { generate } from "randomstring";
import { Neo4jGraphQL } from "../../../../../src/classes";
import { cleanNodesUsingSession } from "../../../../utils/clean-nodes";
import { UniqueType } from "../../../../utils/graphql-types";
import Neo4jHelper from "../../../neo4j";

describe("aggregations-where-node-string - connections", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let User: UniqueType;
    let Post: UniqueType;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        User = new UniqueType("User");
        Post = new UniqueType("Post");

        const typeDefs = /* GraphQL */ `
            type ${User} {
                testString: String!
            }

            type ${Post} {
                testString: String!
                likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodesUsingSession(session, [User, Post]);
        await driver.close();
    });

    test("should return posts where a like String is EQUAL to", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = /* GraphQL */ `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_EQUAL: "${testString}" } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
                edges: [
                    {
                        node: {
                            testString,
                            likes: [{ testString }],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like String is GT than", async () => {
        const session = await neo4j.getSession();

        const length = 5;
        const gtLength = length - 1;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_GT: ${gtLength} } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
                edges: [
                    {
                        node: {
                            testString,
                            likes: [{ testString }],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like String is GTE than", async () => {
        const session = await neo4j.getSession();

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });
        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_GTE: ${length} } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
                edges: [
                    {
                        node: {
                            testString,
                            likes: [{ testString }],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like String is LT than", async () => {
        const session = await neo4j.getSession();

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length: length - 1,
        });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_LT: ${length} } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
                edges: [
                    {
                        node: {
                            testString,
                            likes: [{ testString }],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like String is LTE than", async () => {
        const session = await neo4j.getSession();

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_LTE: ${length} } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
                edges: [
                    {
                        node: {
                            testString,
                            likes: [{ testString }],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    describe("SHORTEST", () => {
        test.each(["SHORTEST", "SHORTEST_LENGTH"])(
            "should return posts where the %s like String is EQUAL to",
            async (shortestFilter) => {
                const session = await neo4j.getSession();

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

                try {
                    await session.run(
                        `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${longestTestString}"})
                    `
                    );

                    const query = `
                    {
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_${shortestFilter}_EQUAL: ${shortestTestString.length} } } }) {
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

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source: query,
                        contextValue: neo4j.getContextValues(),
                    });

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
                } finally {
                    await session.close();
                }
            }
        );
    });

    describe("LONGEST", () => {
        test.each(["LONGEST", "LONGEST_LENGTH"])(
            "should return posts where the %s like String is EQUAL to",
            async (longestFilter) => {
                const session = await neo4j.getSession();

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

                try {
                    await session.run(
                        `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${longestTestString}"})
                    `
                    );

                    const query = `
                    {
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_${longestFilter}_EQUAL: ${longestTestString.length} } } }) {
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

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source: query,
                        contextValue: neo4j.getContextValues(),
                    });

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
                } finally {
                    await session.close();
                }
            }
        );
    });

    describe("AVERAGE", () => {
        test.each(["AVERAGE", "AVERAGE_LENGTH"])(
            "should return posts where the %s of like Strings is EQUAL to",
            async (averageFilter) => {
                const session = await neo4j.getSession();

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

                try {
                    await session.run(
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
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_${averageFilter}_EQUAL: ${avg} } } }) {
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

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source: query,
                        contextValue: neo4j.getContextValues(),
                    });

                    if (gqlResult.errors) {
                        console.log(JSON.stringify(gqlResult.errors, null, 2));
                    }

                    expect(gqlResult.errors).toBeUndefined();

                    const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
                    expect(post.node.testString).toEqual(testString);
                    expect(post.node.likes).toHaveLength(3);
                } finally {
                    await session.close();
                }
            }
        );

        test("should return posts where the average of like Strings is GT than", async () => {
            const session = await neo4j.getSession();

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

            try {
                await session.run(
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
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_GT: ${avgGT} } } }) {
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

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues(),
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
                expect(post.node.testString).toEqual(testString);
                expect(post.node.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of like Strings is GTE than", async () => {
            const session = await neo4j.getSession();

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

            try {
                await session.run(
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
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_GTE: ${avg} } } }) {
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

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues(),
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
                expect(post.node.testString).toEqual(testString);
                expect(post.node.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of like Strings is LT than", async () => {
            const session = await neo4j.getSession();

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

            try {
                await session.run(
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
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_LT: ${avgLT} } } }) {
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

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues(),
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
                expect(post.node.testString).toEqual(testString);
                expect(post.node.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of like Strings is LTE than", async () => {
            const session = await neo4j.getSession();

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

            try {
                await session.run(
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
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_LTE: ${avg} } } }) {
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

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues(),
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
                expect(post.node.testString).toEqual(testString);
                expect(post.node.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });
    });

    test("EQUAL with alias", async () => {
        const Post = new UniqueType("Post");
        const User = new UniqueType("User");

        const session = await neo4j.getSession();

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

        const query = `
            {
                ${Post.operations.connection}(where: { likesAggregate: { node: {name_EQUAL: "a"  } } }) {
                   edges {
                        node {
                            content
                        }
                   } 
                }
            }
        `;

        await session.run(
            `
            CREATE(p:${Post} {content: "test"})<-[:LIKES]-(:${User} {_name: "a"})
            CREATE(p2:${Post} {content: "test2"})<-[:LIKES]-(:${User} {_name: "b"})
            `
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Post.operations.connection]: { edges: [{ node: { content: "test" } }] },
        });
    });
});

describe("aggregations-where-node-string - connections - interface relationships of concrete types", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let User: UniqueType;
    let Post: UniqueType;
    let Person: UniqueType;
    let neoSchema: Neo4jGraphQL;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        User = new UniqueType("User");
        Post = new UniqueType("Post");
        Person = new UniqueType("Person");

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
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodesUsingSession(session, [User, Post, Person]);
        await driver.close();
    });

    test("should return posts where a like String is EQUAL to", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_EQUAL: "${testString}" } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
                edges: [
                    {
                        node: {
                            testString,
                            likes: [{ testString }],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like String is GT than", async () => {
        const session = await neo4j.getSession();

        const length = 5;
        const gtLength = length - 1;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_GT: ${gtLength} } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
                edges: [
                    {
                        node: {
                            testString,
                            likes: [{ testString }],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like String is GTE than", async () => {
        const session = await neo4j.getSession();

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_GTE: ${length} } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
                edges: [
                    {
                        node: {
                            testString,
                            likes: [{ testString }],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like String is LT than", async () => {
        const session = await neo4j.getSession();

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length: length - 1,
        });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_LT: ${length} } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
                edges: [
                    {
                        node: {
                            testString,
                            likes: [{ testString }],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like String is LTE than", async () => {
        const session = await neo4j.getSession();

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_LTE: ${length} } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[Post.operations.connection]).toEqual({
                edges: [
                    {
                        node: {
                            testString,
                            likes: [{ testString }],
                        },
                    },
                ],
            });
        } finally {
            await session.close();
        }
    });

    describe("SHORTEST", () => {
        test.each(["SHORTEST", "SHORTEST_LENGTH"])(
            "should return posts where the %s like String is EQUAL to",
            async (shortestFilter) => {
                const session = await neo4j.getSession();

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

                try {
                    await session.run(
                        `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${longestTestString}"})
                    `
                    );

                    const query = `
                    {
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_${shortestFilter}_EQUAL: ${shortestTestString.length} } } }) {
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

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source: query,
                        contextValue: neo4j.getContextValues(),
                    });

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
                } finally {
                    await session.close();
                }
            }
        );
    });

    describe("LONGEST", () => {
        test.each(["LONGEST", "LONGEST_LENGTH"])(
            "should return posts where the %s like String is EQUAL to",
            async (longestFilter) => {
                const session = await neo4j.getSession();

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

                try {
                    await session.run(
                        `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${longestTestString}"})
                    `
                    );

                    const query = `
                    {
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_${longestFilter}_EQUAL: ${longestTestString.length} } } }) {
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

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source: query,
                        contextValue: neo4j.getContextValues(),
                    });

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
                } finally {
                    await session.close();
                }
            }
        );
    });

    describe("AVERAGE", () => {
        test.each(["AVERAGE", "AVERAGE_LENGTH"])(
            "should return posts where the %s of like Strings is EQUAL to",
            async (averageFilter) => {
                const session = await neo4j.getSession();

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

                try {
                    await session.run(
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
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_${averageFilter}_EQUAL: ${avg} } } }) {
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

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source: query,
                        contextValue: neo4j.getContextValues(),
                    });

                    if (gqlResult.errors) {
                        console.log(JSON.stringify(gqlResult.errors, null, 2));
                    }

                    expect(gqlResult.errors).toBeUndefined();

                    const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
                    expect(post.node.testString).toEqual(testString);
                    expect(post.node.likes).toHaveLength(3);
                } finally {
                    await session.close();
                }
            }
        );

        test("should return posts where the average of like Strings is GT than", async () => {
            const session = await neo4j.getSession();

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

            try {
                await session.run(
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
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_GT: ${avgGT} } } }) {
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

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues(),
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
                expect(post.node.testString).toEqual(testString);
                expect(post.node.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of like Strings is GTE than", async () => {
            const session = await neo4j.getSession();

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

            try {
                await session.run(
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
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_GTE: ${avg} } } }) {
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

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues(),
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
                expect(post.node.testString).toEqual(testString);
                expect(post.node.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of like Strings is LT than", async () => {
            const session = await neo4j.getSession();

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

            try {
                await session.run(
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
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_LT: ${avgLT} } } }) {
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

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues(),
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
                expect(post.node.testString).toEqual(testString);
                expect(post.node.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of like Strings is LTE than", async () => {
            const session = await neo4j.getSession();
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

            try {
                await session.run(
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
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_AVERAGE_LTE: ${avg} } } }) {
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

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: neo4j.getContextValues(),
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = ((gqlResult.data as any)[Post.operations.connection] as any[])["edges"];
                expect(post.node.testString).toEqual(testString);
                expect(post.node.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });
    });

    test("EQUAL with alias", async () => {
        const Post = new UniqueType("Post");
        const User = new UniqueType("User");
        const Person = new UniqueType("Person");

        const session = await neo4j.getSession();

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

        const query = `
            {
                ${Post.operations.connection}(where: { likesAggregate: { node: {name_EQUAL: "a", other_EQUAL: "a"  } } }) {
                    edges {
                        node {
                            content
                        }
                    }
                }
            }
        `;

        await session.run(
            `
            CREATE(p:${Post} {content: "test"})<-[:LIKES]-(:${User} {_name: "a", _other: "a"})
            CREATE(p2:${Post} {content: "test2"})<-[:LIKES]-(:${User} {_name: "b"})
            `
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Post.operations.connection]: { edges: [{ node: { content: "test" } }] },
        });
    });
});

describe("aggregations-where-node-string - connections - relationships of interface types", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return posts where a like String is EQUAL to - concrete relationship", async () => {
        const session = await neo4j.getSession();
        const Post = new UniqueType("Post");
        const User = new UniqueType("User");

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

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    thingsConnection(where: { testString: "${testString}", likesAggregate: { node: { testString_EQUAL: "${testString}" } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).thingsConnection.edges).toEqual([
                {
                    node: {
                        testString,
                        likes: [{ testString }],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like String is EQUAL to - concrete relationship - nested", async () => {
        const session = await neo4j.getSession();
        const Post = new UniqueType("Post");
        const User = new UniqueType("User");

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

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                    CREATE (:${User} {testString: "${otherUserString}"})-[:LIKES]->(:${Post} {testString: "${otherString}"})
                `
            );

            const query = /* GraphQL */ `
                {
                    ${User.operations.connection} {
                        edges {
                            node {
                                testString
                                thingsConnection(where: { node: { testString: "${testString}", likesAggregate: { node: { testString_EQUAL: "${testString}" } } } }) {
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
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any)[User.operations.connection].edges).toEqual([
                {
                    node: {
                        testString,
                        thingsConnection: {
                            edges: [
                                {
                                    node: {
                                        testString,
                                        likes: [{ testString }],
                                    },
                                },
                            ],
                        },
                    },
                },
                { node: { testString: otherUserString, thingsConnection: { edges: [] } } },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like String is EQUAL to - interface relationship", async () => {
        const session = await neo4j.getSession();
        const Post = new UniqueType("Post");
        const User = new UniqueType("User");
        const Person = new UniqueType("Person");

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

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    thingsConnection(where: { testString: "${testString}", likesAggregate: { node: { testString_EQUAL: "${testString}" } } }) {
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

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: neo4j.getContextValues(),
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).thingsConnection.edges).toEqual([
                {
                    node: {
                        testString,
                        likes: [{ testString }],
                    },
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("EQUAL with alias - interface relationship", async () => {
        const Post = new UniqueType("Post");
        const User = new UniqueType("User");
        const Person = new UniqueType("Person");

        const session = await neo4j.getSession();

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

        const query = `
            {
                ${Post.operations.connection}(where: { likesAggregate: { node: {name_EQUAL: "a", other_EQUAL: "a"  } } }) {
                    edges {
                        node {
                            content
                        }
                    }
                }
            }
        `;

        await session.run(
            `
            CREATE(p:${Post} {content: "test"})<-[:LIKES]-(:${User} {_name: "a", _other: "a"})
            CREATE(p2:${Post} {content: "test2"})<-[:LIKES]-(:${User} {_name: "b"})
            `
        );

        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data).toEqual({
            [Post.operations.connection]: { edges: [{ node: { content: "test" } }] },
        });
    });

    describe("SHORTEST - interface relationship", () => {
        test.each(["SHORTEST", "SHORTEST_LENGTH"])(
            "should return posts where the %s like String is EQUAL to",
            async (shortestFilter) => {
                const session = await neo4j.getSession();
                const Post = new UniqueType("Post");
                const User = new UniqueType("User");
                const Person = new UniqueType("Person");

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

                const neoSchema = new Neo4jGraphQL({ typeDefs });

                try {
                    await session.run(
                        `
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {user_testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {user_testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {user_testString: "${longestTestString}"})
                    `
                    );

                    const query = `
                    {
                        ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { testString_${shortestFilter}_EQUAL: ${shortestTestString.length} } } }) {
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

                    const gqlResult = await graphql({
                        schema: await neoSchema.getSchema(),
                        source: query,
                        contextValue: neo4j.getContextValues(),
                    });

                    if (gqlResult.errors) {
                        console.log(JSON.stringify(gqlResult.errors, null, 2));
                    }

                    expect(gqlResult.errors).toBeUndefined();

                    expect((gqlResult.data as any)[Post.operations.connection].edges).toEqual([
                        {
                            node: {
                                testString,
                                likes: [{ testString: shortestTestString }],
                            },
                        },
                    ]);
                } finally {
                    await session.close();
                }
            }
        );
    });
});
