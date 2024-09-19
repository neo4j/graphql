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

describe("aggregations-where-node-float - connections", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        const typeDefs = `
            type ${User} @node {
                testString: String!
                someFloat: Float!
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

    test("should return posts where a like Float is EQUAL to", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someFloat_EQUAL: ${someFloat} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someFloat
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
                        likes: [{ testString, someFloat }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like Float is GT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;
        const someFloatGt = someFloat - 0.1;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someFloat_GT: ${someFloatGt} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someFloat
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
                        likes: [{ testString, someFloat }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like Float is GTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someFloat_GTE: ${someFloat} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someFloat
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
                        likes: [{ testString, someFloat }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like Float is LT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;
        const someFloatLT = someFloat + 0.1;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someFloat_LT: ${someFloatLT} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someFloat
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
                        likes: [{ testString, someFloat }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like Float is LTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someFloat_LTE: ${someFloat} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someFloat
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
                        likes: [{ testString, someFloat }],
                    },
                },
            ],
        });
    });
});

describe("aggregations-where-node-float - connections - interface relationships of concrete types", () => {
    let testHelper: TestHelper;
    let User: UniqueType;
    let Post: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Person = testHelper.createUniqueType("Person");
        const typeDefs = `
        interface Human {
            testString: String!
            someFloat: Float!
        }

        type ${Person} implements Human @node {
            testString: String!
            someFloat: Float!
        }

            type ${User} implements Human @node {
                testString: String!
                someFloat: Float!
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

    test("should return posts where a like Float is EQUAL to", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someFloat_EQUAL: ${someFloat} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someFloat
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
                        likes: [{ testString, someFloat }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like Float is GT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;
        const someFloatGt = someFloat - 0.1;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someFloat_GT: ${someFloatGt} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someFloat
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
                        likes: [{ testString, someFloat }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like Float is GTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someFloat_GTE: ${someFloat} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someFloat
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
                        likes: [{ testString, someFloat }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like Float is LT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;
        const someFloatLT = someFloat + 0.1;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someFloat_LT: ${someFloatLT} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someFloat
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
                        likes: [{ testString, someFloat }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like Float is LTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someFloat = Math.random() * Math.random() + 10;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someFloat: ${someFloat}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someFloat_LTE: ${someFloat} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someFloat
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
                        likes: [{ testString, someFloat }],
                    },
                },
            ],
        });
    });
});
