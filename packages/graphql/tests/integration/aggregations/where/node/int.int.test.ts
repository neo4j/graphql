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

import { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import neo4j from "../../../neo4j";
import { Neo4jGraphQL } from "../../../../../src/classes";

describe("aggregations-where-node-int", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return posts where a like Int is EQUAL to", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                testString: String!
                someInt: Int!
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

        const someInt = Math.floor(Math.random() * Math.random());

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt}})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { someInt_EQUAL: ${someInt} } } }) {
                        testString
                        likes {
                            testString
                            someInt
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).posts).toEqual([
                {
                    testString,
                    likes: [{ testString, someInt }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like Float is GT than", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                testString: String!
                someInt: Int!
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

        const someInt = Math.floor(Math.random() * Math.random());
        const someIntGt = someInt - 1;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt}})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { someInt_GT: ${someIntGt} } } }) {
                        testString
                        likes {
                            testString
                            someInt
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).posts).toEqual([
                {
                    testString,
                    likes: [{ testString, someInt }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like Float is GTE than", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                testString: String!
                someInt: Int!
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

        const someInt = Math.floor(Math.random() * Math.random());

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt}})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { someInt_GTE: ${someInt} } } }) {
                        testString
                        likes {
                            testString
                            someInt
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).posts).toEqual([
                {
                    testString,
                    likes: [{ testString, someInt }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like Float is LT than", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                testString: String!
                someInt: Int!
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

        const someInt = Math.floor(Math.random() * Math.random());
        const someIntLT = someInt + 1;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt}})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { someInt_LT: ${someIntLT} } } }) {
                        testString
                        likes {
                            testString
                            someInt
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).posts).toEqual([
                {
                    testString,
                    likes: [{ testString, someInt }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like Float is LTE than", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                testString: String!
                someInt: Int!
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

        const someInt = Math.floor(Math.random() * Math.random());

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt}})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { someInt_LTE: ${someInt} } } }) {
                        testString
                        likes {
                            testString
                            someInt
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: await neoSchema.getSchema(),
                source: query,
                contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
            });

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();

            expect((gqlResult.data as any).posts).toEqual([
                {
                    testString,
                    likes: [{ testString, someInt }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    describe("AVERAGE", () => {
        test("should return posts where the average of like Int's is EQUAL to", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    testString: String!
                    someInt: Int!
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

            const someInt1 = Math.floor(Math.random() * Math.random());
            const someInt2 = Math.floor(Math.random() * Math.random());
            const someInt3 = Math.floor(Math.random() * Math.random());

            const avg = (someInt1 + someInt2 + someInt3) / 3;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { someInt_AVERAGE_EQUAL: ${avg} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = (gqlResult.data as any).posts as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of like Int's is GT than", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    testString: String!
                    someInt: Int!
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

            const someInt1 = Math.floor(Math.random() * Math.random());
            const someInt2 = Math.floor(Math.random() * Math.random());
            const someInt3 = Math.floor(Math.random() * Math.random());

            const avg = (someInt1 + someInt2 + someInt3) / 3;
            const avgGT = avg - 1;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { someInt_AVERAGE_GT: ${avgGT} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = (gqlResult.data as any).posts as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of like Int's is GTE than", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    testString: String!
                    someInt: Int!
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

            const someInt1 = Math.floor(Math.random() * Math.random());
            const someInt2 = Math.floor(Math.random() * Math.random());
            const someInt3 = Math.floor(Math.random() * Math.random());

            const avg = (someInt1 + someInt2 + someInt3) / 3;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { someInt_AVERAGE_GTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = (gqlResult.data as any).posts as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of like Int's is LT than", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    testString: String!
                    someInt: Int!
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

            const someInt1 = Math.floor(Math.random() * Math.random());
            const someInt2 = Math.floor(Math.random() * Math.random());
            const someInt3 = Math.floor(Math.random() * Math.random());

            const avg = (someInt1 + someInt2 + someInt3) / 3;
            const avgLT = avg + 1;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { someInt_AVERAGE_LT: ${avgLT} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = (gqlResult.data as any).posts as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });

        test("should return posts where the average of like Int's is LTE than", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    testString: String!
                    someInt: Int!
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

            const someInt1 = Math.floor(Math.random() * Math.random());
            const someInt2 = Math.floor(Math.random() * Math.random());
            const someInt3 = Math.floor(Math.random() * Math.random());

            const avg = (someInt1 + someInt2 + someInt3) / 3;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { someInt_AVERAGE_LTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = (gqlResult.data as any).posts as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });
    });

    describe("sum", () => {
        test("should return posts where the sum of like Int's is EQUAL to", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    testString: String!
                    someInt: Int!
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

            const someInt1 = Math.floor(Math.random() * Math.random());
            const someInt2 = Math.floor(Math.random() * Math.random());
            const someInt3 = Math.floor(Math.random() * Math.random());

            const sum = someInt1 + someInt2 + someInt3;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt1}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt2}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someInt: ${someInt3}})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { someInt_SUM_EQUAL: ${sum} } } }) {
                            testString
                            likes {
                                testString
                                someInt
                            }
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: await neoSchema.getSchema(),
                    source: query,
                    contextValue: { driver, driverConfig: { bookmarks: [session.lastBookmark()] } },
                });

                if (gqlResult.errors) {
                    console.log(JSON.stringify(gqlResult.errors, null, 2));
                }

                expect(gqlResult.errors).toBeUndefined();

                const [post] = (gqlResult.data as any).posts as any[];
                expect(post.testString).toEqual(testString);
                expect(post.likes).toHaveLength(3);
            } finally {
                await session.close();
            }
        });
    });
});
