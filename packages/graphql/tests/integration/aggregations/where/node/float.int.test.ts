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

describe("aggregations-where-node-float", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return posts where a like Float is EQUAL to", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                testString: String!
                someFloat: Float!
            }
          
            type Post {
              testString: String!
              likes: [User] @relationship(type: "LIKES", direction: IN)
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { someFloat_EQUAL: ${someFloat} } } }) {
                        testString
                        likes {
                            testString
                            someFloat
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
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
                    likes: [{ testString, someFloat }],
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
                someFloat: Float!
            }
          
            type Post {
              testString: String!
              likes: [User] @relationship(type: "LIKES", direction: IN)
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;
        const someFloatGt = someFloat - 0.1;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { someFloat_GT: ${someFloatGt} } } }) {
                        testString
                        likes {
                            testString
                            someFloat
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
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
                    likes: [{ testString, someFloat }],
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
                someFloat: Float!
            }
          
            type Post {
              testString: String!
              likes: [User] @relationship(type: "LIKES", direction: IN)
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { someFloat_GTE: ${someFloat} } } }) {
                        testString
                        likes {
                            testString
                            someFloat
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
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
                    likes: [{ testString, someFloat }],
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
                someFloat: Float!
            }
          
            type Post {
              testString: String!
              likes: [User] @relationship(type: "LIKES", direction: IN)
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;
        const someFloatLT = someFloat + 0.1;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { someFloat_LT: ${someFloatLT} } } }) {
                        testString
                        likes {
                            testString
                            someFloat
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
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
                    likes: [{ testString, someFloat }],
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
                someFloat: Float!
            }
          
            type Post {
              testString: String!
              likes: [User] @relationship(type: "LIKES", direction: IN)
            }
        `;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { node: { someFloat_LTE: ${someFloat} } } }) {
                        testString
                        likes {
                            testString
                            someFloat
                        }
                    }
                }
            `;

            const gqlResult = await graphql({
                schema: neoSchema.schema,
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
                    likes: [{ testString, someFloat }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    describe("AVERAGE", () => {
        test("should return posts where the average of like Floats is EQUAL to", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    testString: String!
                    someFloat: Float!
                }
              
                type Post {
                  testString: String!
                  likes: [User] @relationship(type: "LIKES", direction: IN)
                }
            `;

            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const someFloat1 = Math.random() * Math.random() + 10.123;
            const someFloat2 = Math.random() * Math.random() + 11.123;
            const someFloat3 = Math.random() * Math.random() + 12.123;

            const avg = (someFloat1 + someFloat2 + someFloat3) / 3;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat1}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat2}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat3}})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { someFloat_AVERAGE_EQUAL: ${avg} } } }) {
                            testString
                            likes {
                                testString
                                someFloat
                            }
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
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

        test("should return posts where the average of like Floats is GT than", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    testString: String!
                    someFloat: Float!
                }
              
                type Post {
                  testString: String!
                  likes: [User] @relationship(type: "LIKES", direction: IN)
                }
            `;

            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const someFloat1 = Math.random() * Math.random() + 10.123;
            const someFloat2 = Math.random() * Math.random() + 11.123;
            const someFloat3 = Math.random() * Math.random() + 12.123;

            const avg = (someFloat1 + someFloat2 + someFloat3) / 3;
            const avgGT = avg - 1;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat1}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat2}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat3}})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { someFloat_AVERAGE_GT: ${avgGT} } } }) {
                            testString
                            likes {
                                testString
                                someFloat
                            }
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
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

        test("should return posts where the average of like Floats is GTE than", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    testString: String!
                    someFloat: Float!
                }
              
                type Post {
                  testString: String!
                  likes: [User] @relationship(type: "LIKES", direction: IN)
                }
            `;

            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const someFloat1 = Math.random() * Math.random() + 10.123;
            const someFloat2 = Math.random() * Math.random() + 11.123;
            const someFloat3 = Math.random() * Math.random() + 12.123;

            const avg = (someFloat1 + someFloat2 + someFloat3) / 3;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat1}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat2}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat3}})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { someFloat_AVERAGE_GTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                                someFloat
                            }
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
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

        test("should return posts where the average of like Floats is LT than", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    testString: String!
                    someFloat: Float!
                }
              
                type Post {
                  testString: String!
                  likes: [User] @relationship(type: "LIKES", direction: IN)
                }
            `;

            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const someFloat1 = Math.random() * Math.random() + 10.123;
            const someFloat2 = Math.random() * Math.random() + 11.123;
            const someFloat3 = Math.random() * Math.random() + 12.123;

            const avg = (someFloat1 + someFloat2 + someFloat3) / 3;
            const avgLT = avg + 1;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat1}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat2}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat3}})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { someFloat_AVERAGE_LT: ${avgLT} } } }) {
                            testString
                            likes {
                                testString
                                someFloat
                            }
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
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

        test("should return posts where the average of like Floats is LTE than", async () => {
            const session = driver.session();

            const typeDefs = `
                type User {
                    testString: String!
                    someFloat: Float!
                }
              
                type Post {
                  testString: String!
                  likes: [User] @relationship(type: "LIKES", direction: IN)
                }
            `;

            const testString = generate({
                charset: "alphabetic",
                readable: true,
            });

            const someFloat1 = Math.random() * Math.random() + 10.123;
            const someFloat2 = Math.random() * Math.random() + 11.123;
            const someFloat3 = Math.random() * Math.random() + 12.123;

            const avg = (someFloat1 + someFloat2 + someFloat3) / 3;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            try {
                await session.run(
                    `
                        CREATE (p:Post {testString: "${testString}"})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat1}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat2}})
                        CREATE (p)<-[:LIKES]-(:User {testString: "${testString}", someFloat: ${someFloat3}})
                        CREATE (:Post {testString: "${testString}"})
                    `
                );

                const query = `
                    {
                        posts(where: { testString: "${testString}", likesAggregate: { node: { someFloat_AVERAGE_LTE: ${avg} } } }) {
                            testString
                            likes {
                                testString
                                someFloat
                            }
                        }
                    }
                `;

                const gqlResult = await graphql({
                    schema: neoSchema.schema,
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
