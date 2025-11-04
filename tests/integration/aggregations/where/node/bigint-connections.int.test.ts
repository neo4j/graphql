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

describe("aggregations-where-node-bigint - connections", () => {
    let testHelper: TestHelper;
    let bigInt: string;
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
        bigInt = "2147483647";
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");

        const typeDefs = `
            type ${User} {
                testString: String!
                someBigInt: BigInt
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

    test("should return posts where a like BigInt is EQUAL to", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someBigInt: toInteger(${bigInt})})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someBigInt_EQUAL: ${bigInt} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someBigInt
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
                        likes: [{ testString, someBigInt: bigInt }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like BigInt is GT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someBigInt = `${bigInt}1`;
        const someBigIntGt = bigInt.substring(0, bigInt.length - 1);

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someBigInt: ${someBigInt}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someBigInt_GT: ${someBigIntGt} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someBigInt
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
                        likes: [{ testString, someBigInt }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like BigInt is GTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someBigInt: toInteger(${bigInt})})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someBigInt_GTE: ${bigInt} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someBigInt
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
                        likes: [{ testString, someBigInt: bigInt }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like BigInt is LT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someBigIntLT = `${bigInt}1`;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someBigInt: toInteger(${bigInt})})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someBigInt_LT: ${someBigIntLT} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someBigInt
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
                        likes: [{ testString, someBigInt: bigInt }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like BigInt is LTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someBigInt: toInteger(${bigInt})})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someBigInt_LTE: ${bigInt} } } }) {
                       edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someBigInt
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
                        likes: [{ testString, someBigInt: bigInt }],
                    },
                },
            ],
        });
    });
});

describe("aggregations-where-node-bigint - connections - interface relationships of concrete types", () => {
    let testHelper: TestHelper;
    let bigInt: string;
    let User: UniqueType;
    let Post: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();
        bigInt = "2147483647";
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");
        Person = testHelper.createUniqueType("Person");
        const typeDefs = `
        interface Human {
            testString: String!
            someBigInt: BigInt
        }

        type ${Person} implements Human {
            testString: String!
            someBigInt: BigInt
        }


            type ${User} implements Human {
                testString: String!
                someBigInt: BigInt
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

    test("should return posts where a like BigInt is EQUAL to", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someBigInt: toInteger(${bigInt})})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someBigInt_EQUAL: ${bigInt} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someBigInt
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
                        likes: [{ testString, someBigInt: bigInt }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like BigInt is GT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someBigInt = `${bigInt}1`;
        const someBigIntGt = bigInt.substring(0, bigInt.length - 1);

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someBigInt: ${someBigInt}})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someBigInt_GT: ${someBigIntGt} } } }) {
                       edges {
                        node {
                             testString
                                likes {
                                    testString
                                    someBigInt
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
                        likes: [{ testString, someBigInt }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like BigInt is GTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someBigInt: toInteger(${bigInt})})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someBigInt_GTE: ${bigInt} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someBigInt
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
                        likes: [{ testString, someBigInt: bigInt }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like BigInt is LT than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const someBigIntLT = `${bigInt}1`;

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someBigInt: toInteger(${bigInt})})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someBigInt_LT: ${someBigIntLT} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someBigInt
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
                        likes: [{ testString, someBigInt: bigInt }],
                    },
                },
            ],
        });
    });

    test("should return posts where a like BigInt is LTE than", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", someBigInt: toInteger(${bigInt})})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.operations.connection}(where: { testString: "${testString}", likesAggregate: { node: { someBigInt_LTE: ${bigInt} } } }) {
                        edges {
                            node {
                                testString
                                likes {
                                    testString
                                    someBigInt
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
                        likes: [{ testString, someBigInt: bigInt }],
                    },
                },
            ],
        });
    });
});
