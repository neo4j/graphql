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
import { UniqueType } from "../../../../utils/graphql-types";
import Neo4jHelper from "../../../neo4j";

describe("aggregations-where-node-datetime", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let User: UniqueType;
    let Post: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        User = new UniqueType("User");
        Post = new UniqueType("Post");
        const typeDefs = `
            type ${User} {
                testString: String!
                someDateTime: DateTime!
            }
    
            type ${Post} {
              testString: String!
              likes: [${User}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return posts where a like DateTime is EQUAL to", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someDateTime = new Date();

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someDateTime: dateTime("${someDateTime.toISOString()}")})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${
                        Post.plural
                    }(where: { testString: "${testString}", likesAggregate: { node: { someDateTime_EQUAL: "${someDateTime.toISOString()}" } } }) {
                        testString
                        likes {
                            testString
                            someDateTime
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
                    likes: [{ testString, someDateTime: someDateTime.toISOString() }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like DateTime is GT than", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someDateTime = new Date();
        const someDateTimeGT = new Date();
        someDateTimeGT.setDate(someDateTimeGT.getDate() - 1);

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someDateTime: datetime("${someDateTime.toISOString()}")})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${
                        Post.plural
                    }(where: { testString: "${testString}", likesAggregate: { node: { someDateTime_GT: "${someDateTimeGT.toISOString()}" } } }) {
                        testString
                        likes {
                            testString
                            someDateTime
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
                    likes: [{ testString, someDateTime: someDateTime.toISOString() }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like DateTime is GTE than", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someDateTime = new Date();

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someDateTime: datetime("${someDateTime.toISOString()}")})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${
                        Post.plural
                    }(where: { testString: "${testString}", likesAggregate: { node: { someDateTime_GTE: "${someDateTime.toISOString()}" } } }) {
                        testString
                        likes {
                            testString
                            someDateTime
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
                    likes: [{ testString, someDateTime: someDateTime.toISOString() }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like DateTime is LT than", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someDateTime = new Date();
        const someDateTimeLT = new Date();
        someDateTimeLT.setDate(someDateTimeLT.getDate() + 1);

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someDateTime: datetime("${someDateTime.toISOString()}")})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${
                        Post.plural
                    }(where: { testString: "${testString}", likesAggregate: { node: { someDateTime_LT: "${someDateTimeLT.toISOString()}" } } }) {
                        testString
                        likes {
                            testString
                            someDateTime
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
                    likes: [{ testString, someDateTime: someDateTime.toISOString() }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like DateTime is LTE than", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someDateTime = new Date();

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someDateTime: datetime("${someDateTime.toISOString()}")})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${
                        Post.plural
                    }(where: { testString: "${testString}", likesAggregate: { node: { someDateTime_LTE: "${someDateTime.toISOString()}" } } }) {
                        testString
                        likes {
                            testString
                            someDateTime
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
                    likes: [{ testString, someDateTime: someDateTime.toISOString() }],
                },
            ]);
        } finally {
            await session.close();
        }
    });
});
describe("aggregations-where-node-datetime interface relationships of concrete types", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let User: UniqueType;
    let Post: UniqueType;
    let Person: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();
        User = new UniqueType("User");
        Post = new UniqueType("Post");
        Person = new UniqueType("Person");
        const typeDefs = `
        interface Human {
            testString: String!
            someDateTime: DateTime!
        }

        type ${Person} implements Human {
            testString: String!
            someDateTime: DateTime!
        }

            type ${User} implements Human {
                testString: String!
                someDateTime: DateTime!
            }
    
            type ${Post} {
              testString: String!
              likes: [Human!]! @relationship(type: "LIKES", direction: IN)
            }
        `;
        neoSchema = new Neo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should return posts where a like DateTime is EQUAL to", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someDateTime = new Date();

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someDateTime: dateTime("${someDateTime.toISOString()}")})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${
                        Post.plural
                    }(where: { testString: "${testString}", likesAggregate: { node: { someDateTime_EQUAL: "${someDateTime.toISOString()}" } } }) {
                        testString
                        likes {
                            testString
                            someDateTime
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
                    likes: [{ testString, someDateTime: someDateTime.toISOString() }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like DateTime is GT than", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someDateTime = new Date();
        const someDateTimeGT = new Date();
        someDateTimeGT.setDate(someDateTimeGT.getDate() - 1);

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someDateTime: datetime("${someDateTime.toISOString()}")})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${
                        Post.plural
                    }(where: { testString: "${testString}", likesAggregate: { node: { someDateTime_GT: "${someDateTimeGT.toISOString()}" } } }) {
                        testString
                        likes {
                            testString
                            someDateTime
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
                    likes: [{ testString, someDateTime: someDateTime.toISOString() }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like DateTime is GTE than", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someDateTime = new Date();

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someDateTime: datetime("${someDateTime.toISOString()}")})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${
                        Post.plural
                    }(where: { testString: "${testString}", likesAggregate: { node: { someDateTime_GTE: "${someDateTime.toISOString()}" } } }) {
                        testString
                        likes {
                            testString
                            someDateTime
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
                    likes: [{ testString, someDateTime: someDateTime.toISOString() }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like DateTime is LT than", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someDateTime = new Date();
        const someDateTimeLT = new Date();
        someDateTimeLT.setDate(someDateTimeLT.getDate() + 1);

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someDateTime: datetime("${someDateTime.toISOString()}")})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${
                        Post.plural
                    }(where: { testString: "${testString}", likesAggregate: { node: { someDateTime_LT: "${someDateTimeLT.toISOString()}" } } }) {
                        testString
                        likes {
                            testString
                            someDateTime
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
                    likes: [{ testString, someDateTime: someDateTime.toISOString() }],
                },
            ]);
        } finally {
            await session.close();
        }
    });

    test("should return posts where a like DateTime is LTE than", async () => {
        const session = await neo4j.getSession();

        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someDateTime = new Date();

        try {
            await session.run(
                `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someDateTime: datetime("${someDateTime.toISOString()}")})
                    CREATE (:${Post} {testString: "${testString}"})
                `
            );

            const query = `
                {
                    ${
                        Post.plural
                    }(where: { testString: "${testString}", likesAggregate: { node: { someDateTime_LTE: "${someDateTime.toISOString()}" } } }) {
                        testString
                        likes {
                            testString
                            someDateTime
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
                    likes: [{ testString, someDateTime: someDateTime.toISOString() }],
                },
            ]);
        } finally {
            await session.close();
        }
    });
});
