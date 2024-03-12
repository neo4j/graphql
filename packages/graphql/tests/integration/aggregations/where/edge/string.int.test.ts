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

describe("aggregations-where-edge-string", () => {
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
              likes: [${User}!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            type Likes @relationshipProperties {
                testString: String
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodesUsingSession(session, [User, Post]);
        await driver.close();
    });

    test("should return posts where a edge like String is EQUAL to", async () => {
        const session = await neo4j.getSession();

        const typeDefs = /* GraphQL */ `
            type ${User} {
                testString: String!
            }

            type ${Post} {
              testString: String!
              likes: [${User}!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
              someStringAlias: String @alias(property: "_someStringAlias")
            }

            type Likes @relationshipProperties {
                testString: String
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs });

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${testString}" }]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_EQUAL: "${testString}" } } }) {
                        testString
                        likes {
                            testString
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

            expect((gqlResult.data as any)[Post.plural]).toEqual([
                {
                    testString,
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is GT than", async () => {
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
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_GT: ${gtLength} } } }) {
                        testString
                        likes {
                            testString
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

            expect((gqlResult.data as any)[Post.plural]).toEqual([
                {
                    testString,
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is GTE than", async () => {
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
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_GTE: ${length} } } }) {
                        testString
                        likes {
                            testString
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

            expect((gqlResult.data as any)[Post.plural]).toEqual([
                {
                    testString,
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is LT than", async () => {
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
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_LT: ${length} } } }) {
                        testString
                        likes {
                            testString
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

            expect((gqlResult.data as any)[Post.plural]).toEqual([
                {
                    testString,
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is LTE than", async () => {
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
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_LTE: ${length} } } }) {
                        testString
                        likes {
                            testString
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

            expect((gqlResult.data as any)[Post.plural]).toEqual([
                {
                    testString,
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    describe("SHORTEST", () => {
        test.each(["SHORTEST", "SHORTEST_LENGTH"])(
            "should return posts where the %s edge like String is EQUAL to",
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
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${shortestTestString}" }]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${longestTestString}" }]-(:${User} {testString: "${longestTestString}"})
                    `
                    );

                    const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_${shortestFilter}_EQUAL: ${shortestTestString.length} } } }) {
                            testString
                            likes {
                                testString
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

                    expect((gqlResult.data as any)[Post.plural]).toEqual([
                        {
                            testString,
                            likes: [{ testString: shortestTestString }],
                        },
                    ]);
                } finally {
                    await session.close();
                }
            }
        );
    });

    describe("LONGEST", () => {
        test.each(["LONGEST", "LONGEST_LENGTH"])(
            "should return posts where the %s edge like String is EQUAL to",
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
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${shortestTestString}" }]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${longestTestString}" }]-(:${User} {testString: "${longestTestString}"})
                    `
                    );

                    const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_${longestFilter}_EQUAL: ${longestTestString.length} } } }) {
                            testString
                            likes {
                                testString
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

                    expect((gqlResult.data as any)[Post.plural]).toEqual([
                        {
                            testString,
                            likes: [{ testString: longestTestString }],
                        },
                    ]);
                } finally {
                    await session.close();
                }
            }
        );
    });

    describe("AVERAGE", () => {
        test.each(["AVERAGE", "AVERAGE_LENGTH"])(
            "should return posts where the %s of edge like Strings is EQUAL to",
            async (averageFilter) => {
                const session = await neo4j.getSession();

                const testString = generate({
                    charset: "alphabetic",
                    readable: true,
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
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                    );

                    const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_${averageFilter}_EQUAL: ${avg} } } }) {
                            testString
                            likes {
                                testString
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

                    const [post] = (gqlResult.data as any)[Post.plural] as any[];
                    expect(post.testString).toEqual(testString);
                    expect(post.likes).toHaveLength(3);
                } finally {
                    await session.close();
                }
            }
        );

        test("should return posts where the average of edge like Strings is GT than", async () => {
            const session = await neo4j.getSession();

            const testString = generate({
                charset: "alphabetic",
                readable: true,
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
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_AVERAGE_GT: ${avgGT} } } }) {
                            testString
                            likes {
                                testString
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

                const [post] = (gqlResult.data as any)[Post.plural] as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of edge like Strings is GTE than", async () => {
            const session = await neo4j.getSession();

            const testString = generate({
                charset: "alphabetic",
                readable: true,
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
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_AVERAGE_GTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
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

                const [post] = (gqlResult.data as any)[Post.plural] as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of edge like Strings is LT than", async () => {
            const session = await neo4j.getSession();

            const testString = generate({
                charset: "alphabetic",
                readable: true,
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
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LT: ${avgLT} } } }) {
                            testString
                            likes {
                                testString
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

                const [post] = (gqlResult.data as any)[Post.plural] as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of edge like Strings is LTE than", async () => {
            const session = await neo4j.getSession();

            const testString = generate({
                charset: "alphabetic",
                readable: true,
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
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
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

                const [post] = (gqlResult.data as any)[Post.plural] as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });
    });

    test("EQUAL with alias", async () => {
        const Post = new UniqueType("Post");
        const User = new UniqueType("Post");

        const session = await neo4j.getSession();

        const typeDefs = /*GraphQL*/ `
            type ${User} {
                name: String!
            }
            type ${Post} {
                content: String
                likes: [${User}!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }
            type Likes @relationshipProperties {
                someStringAlias: String @alias(property: "_someStringAlias")
            }
        `;

        const query = `
            {
                ${Post.plural}(where: { likesAggregate: { edge: { someStringAlias_EQUAL: "10" } } }) {
                    content
                }
            }
        `;

        await session.run(
            `
            CREATE(p:${Post} {content: "test"})<-[:LIKES {_someStringAlias:"10"}]-(:${User} {name: "a"})
            CREATE(p2:${Post} {content: "test2"})<-[:LIKES {_someStringAlias:"11"}]-(:${User} {name: "a"})
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
            [Post.plural]: [{ content: "test" }],
        });
    });
});

describe("aggregations-where-edge-string interface relationships of concrete types", () => {
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
                likes: [Human!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
                someStringAlias: String @alias(property: "_someStringAlias")
            }

            type Likes @relationshipProperties {
                testString: String
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        const session = await neo4j.getSession();
        await cleanNodesUsingSession(session, [User, Post]);
        await driver.close();
    });

    test("should return posts where a edge like String is EQUAL to", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${testString}" }]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_EQUAL: "${testString}" } } }) {
                        testString
                        likes {
                            testString
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

            expect((gqlResult.data as any)[Post.plural]).toEqual([
                {
                    testString,
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is GT than", async () => {
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
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_GT: ${gtLength} } } }) {
                        testString
                        likes {
                            testString
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

            expect((gqlResult.data as any)[Post.plural]).toEqual([
                {
                    testString,
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is GTE than", async () => {
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
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_GTE: ${length} } } }) {
                        testString
                        likes {
                            testString
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

            expect((gqlResult.data as any)[Post.plural]).toEqual([
                {
                    testString,
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is LT than", async () => {
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
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_LT: ${length} } } }) {
                        testString
                        likes {
                            testString
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

            expect((gqlResult.data as any)[Post.plural]).toEqual([
                {
                    testString,
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is LTE than", async () => {
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
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:${User} {testString: "${testString}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_LTE: ${length} } } }) {
                        testString
                        likes {
                            testString
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

            expect((gqlResult.data as any)[Post.plural]).toEqual([
                {
                    testString,
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    describe("SHORTEST", () => {
        test.each(["SHORTEST", "SHORTEST_LENGTH"])(
            "should return posts where the %s edge like String is EQUAL to",
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
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${shortestTestString}" }]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${longestTestString}" }]-(:${User} {testString: "${longestTestString}"})
                    `
                    );

                    const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_${shortestFilter}_EQUAL: ${shortestTestString.length} } } }) {
                            testString
                            likes {
                                testString
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

                    expect((gqlResult.data as any)[Post.plural]).toEqual([
                        {
                            testString,
                            likes: [{ testString: shortestTestString }],
                        },
                    ]);
                } finally {
                    await session.close();
                }
            }
        );
    });

    describe("LONGEST", () => {
        test.each(["LONGEST", "LONGEST_LENGTH"])(
            "should return posts where the %s edge like String is EQUAL to",
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
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${shortestTestString}" }]-(:${User} {testString: "${shortestTestString}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString2}"})
                        CREATE (:${Post} {testString: "${testString}"})<-[:LIKES { testString: "${longestTestString}" }]-(:${User} {testString: "${longestTestString}"})
                    `
                    );

                    const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_${longestFilter}_EQUAL: ${longestTestString.length} } } }) {
                            testString
                            likes {
                                testString
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

                    expect((gqlResult.data as any)[Post.plural]).toEqual([
                        {
                            testString,
                            likes: [{ testString: longestTestString }],
                        },
                    ]);
                } finally {
                    await session.close();
                }
            }
        );
    });

    describe("AVERAGE", () => {
        test.each(["AVERAGE", "AVERAGE_LENGTH"])(
            "should return posts where the %s of edge like Strings is EQUAL to",
            async (averageFilter) => {
                const session = await neo4j.getSession();

                const testString = generate({
                    charset: "alphabetic",
                    readable: true,
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
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                    );

                    const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_${averageFilter}_EQUAL: ${avg} } } }) {
                            testString
                            likes {
                                testString
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

                    const [post] = (gqlResult.data as any)[Post.plural] as any[];
                    expect(post.testString).toEqual(testString);
                    expect(post.likes).toHaveLength(3);
                } finally {
                    await session.close();
                }
            }
        );

        test("should return posts where the average of edge like Strings is GT than", async () => {
            const session = await neo4j.getSession();

            const testString = generate({
                charset: "alphabetic",
                readable: true,
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
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_AVERAGE_GT: ${avgGT} } } }) {
                            testString
                            likes {
                                testString
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

                const [post] = (gqlResult.data as any)[Post.plural] as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of edge like Strings is GTE than", async () => {
            const session = await neo4j.getSession();

            const testString = generate({
                charset: "alphabetic",
                readable: true,
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
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_AVERAGE_GTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
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

                const [post] = (gqlResult.data as any)[Post.plural] as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of edge like Strings is LT than", async () => {
            const session = await neo4j.getSession();

            const testString = generate({
                charset: "alphabetic",
                readable: true,
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
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LT: ${avgLT} } } }) {
                            testString
                            likes {
                                testString
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

                const [post] = (gqlResult.data as any)[Post.plural] as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of edge like Strings is LTE than", async () => {
            const session = await neo4j.getSession();

            const testString = generate({
                charset: "alphabetic",
                readable: true,
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
                        CREATE(p)<-[:LIKES { testString: "${testString1}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString2}" }]-(:${User} {testString: "${testString}"})
                        CREATE(p)<-[:LIKES { testString: "${testString3}" }]-(:${User} {testString: "${testString}"})
                        CREATE (:${Post} {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        ${Post.plural}(where: { testString: "${testString}", likesAggregate: { edge: { testString_AVERAGE_LTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
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

                const [post] = (gqlResult.data as any)[Post.plural] as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
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
                testString: String!
            }

            type ${User} implements Human {
                testString: String!
            }

            type ${Person} implements Human {
                testString: String!
            }

            type ${Post} {
                content: String
                likes: [Human!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            type Likes @relationshipProperties {
                someStringAlias: String @alias(property: "_someStringAlias")
            }
        `;

        const query = `
            {
                ${Post.plural}(where: { likesAggregate: { edge: { someStringAlias_EQUAL: "10" } } }) {
                    content
                }
            }
        `;

        await session.run(
            `
            CREATE(p:${Post} {content: "test"})<-[:LIKES {_someStringAlias:"10"}]-(:${User} {name: "a"})
            CREATE(p2:${Post} {content: "test2"})<-[:LIKES {_someStringAlias:"11"}]-(:${User} {name: "a"})
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
            [Post.plural]: [{ content: "test" }],
        });
    });
});
