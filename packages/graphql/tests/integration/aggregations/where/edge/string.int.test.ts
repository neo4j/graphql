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

describe("aggregations-where-edge-string", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return posts where a edge edge like String is EQUAL to", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                testString: String!
            }
          
            type Post {
              testString: String!
              likes: [User] @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            interface Likes {
                testString: String
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
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES { testString: "${testString}" }]-(:User {testString: "${testString}"})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { edge: { testString_EQUAL: "${testString}" } } }) {
                        testString
                        likes {
                            testString
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
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is GT than", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                testString: String!
            }
          
            type Post {
              testString: String!
              likes: [User] @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            interface Likes {
                testString: String
            }
        `;

        const length = 5;
        const gtLength = length - 1;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:User {testString: "${testString}"})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { edge: { testString_GT: ${gtLength} } } }) {
                        testString
                        likes {
                            testString
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
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is GTE than", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                testString: String!
            }
          
            type Post {
              testString: String!
              likes: [User] @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            interface Likes {
                testString: String
            }
        `;

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:User {testString: "${testString}"})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { edge: { testString_GTE: ${length} } } }) {
                        testString
                        likes {
                            testString
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
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is LT than", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                testString: String!
            }
          
            type Post {
              testString: String!
              likes: [User] @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            interface Likes {
                testString: String
            }
        `;

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length: length - 1,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:User {testString: "${testString}"})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { edge: { testString_LT: ${length} } } }) {
                        testString
                        likes {
                            testString
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
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a edge like String is LTE than", async () => {
        const session = driver.session();

        const typeDefs = `
            type User {
                testString: String!
            }
          
            type Post {
              testString: String!
              likes: [User] @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            interface Likes {
                testString: String
            }
        `;

        const length = 5;

        const testString = generate({
            charset: "alphabetic",
            readable: true,
            length,
        });

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        try {
            await session.run(
                `
                    CREATE (:Post {testString: "${testString}"})<-[:LIKES {testString: "${testString}"}]-(:User {testString: "${testString}"})
                    CREATE (:Post {testString: "${testString}"})
                `
            );

            const query = `
                {
                    posts(where: { testString: "${testString}", likesAggregate: { edge: { testString_LTE: ${length} } } }) {
                        testString
                        likes {
                            testString
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
                    likes: [{ testString }],
                },
            ]);
        } finally {
            await session.close();
        }
    });
});
