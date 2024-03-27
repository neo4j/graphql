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

import type { UniqueType } from "../../../../../utils/graphql-types";
import { TestHelper } from "../../../../../utils/tests-helper";

describe("Delete using top level aggregate where", () => {
    const testHelper = new TestHelper();

    let userType: UniqueType;
    let postType: UniqueType;

    const testString1 = "This is a test string";
    const testString2 = "anotherTestString";
    const testString3 = "SomeUserString!";
    const testString4 = "Foo";
    const testString5 = "Baa";
    const content1 = "SomeContent!";
    const content2 = "testContent";
    const content3 = "testContent3";
    const content4 = "Baz";
    const content5 = "Some more content";

    beforeEach(async () => {
        userType = testHelper.createUniqueType("User");
        postType = testHelper.createUniqueType("Post");

        const typeDefs = `
            type ${userType.name} {
                testString: String!
            }

            type ${postType.name} {
              content: String!
              likes: [${userType.name}!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        await testHelper.executeCypher(`
            CREATE (post1:${postType.name} { content: "${content1}" })<-[:LIKES]-(user1:${userType.name} { testString: "${testString1}" })
            CREATE (post2:${postType.name} { content: "${content2}" })<-[:LIKES]-(user2:${userType.name} { testString: "${testString2}" })
            CREATE (post3:${postType.name} { content: "${content3}" })<-[:LIKES]-(user3:${userType.name} { testString: "${testString3}" })
            CREATE (post4:${postType.name} { content: "${content4}" })<-[:LIKES]-(user4:${userType.name} { testString: "${testString4}" })
            CREATE (post5:${postType.name} { content: "${content5}" })<-[:LIKES]-(user5:${userType.name} { testString: "${testString5}" })
            MERGE (post1)<-[:LIKES]-(user2)
            MERGE (post1)<-[:LIKES]-(user3)
            MERGE (post2)<-[:LIKES]-(user4)
            MERGE (post2)<-[:LIKES]-(user5)
            MERGE (post3)<-[:LIKES]-(user1)
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Implicit AND", async () => {
        const query = `
            mutation {
                ${postType.operations.delete}(where: { 
                    likesAggregate: {
                        count: 3
                        node: {
                            testString_SHORTEST_EQUAL: 3
                        }
                    }
                }) {
                    nodesDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [postType.operations.delete]: {
                nodesDeleted: 1,
            },
        });
    });

    test("Top-level OR", async () => {
        const query = `
            mutation {
                ${postType.operations.delete}(where: { 
                    likesAggregate: {
                        OR: [
                            { count: 3 }
                            {
                                node: {
                                    testString_SHORTEST_EQUAL: 3
                                }
                            }
                        ]
                    }
                }) {
                    nodesDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [postType.operations.delete]: {
                nodesDeleted: 4,
            },
        });
    });

    test("Top-level AND", async () => {
        const query = `
            mutation {
                ${postType.operations.delete}(where: { 
                    likesAggregate: {
                        AND: [
                            { count: 3 }
                            {
                                node: {
                                    testString_SHORTEST_EQUAL: 3
                                }
                            }
                        ]
                    }
                }) {
                    nodesDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [postType.operations.delete]: {
                nodesDeleted: 1,
            },
        });
    });

    test("AND within an AND", async () => {
        const query = `
            mutation {
                ${postType.operations.delete}(where: { 
                    likesAggregate: {
                        AND: [
                            { count_LTE: 2 }
                            {
                                AND: [
                                    {
                                        node: {
                                            testString_SHORTEST_LT: 4
                                        }
                                    }
                                    {
                                        node: {
                                            testString_EQUAL: "${testString5}"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }) {
                    nodesDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [postType.operations.delete]: {
                nodesDeleted: 1,
            },
        });
    });

    test("AND within an AND with NOT", async () => {
        const query = `
            mutation {
                ${postType.operations.delete}(where: { 
                    likesAggregate: {
                        AND: [
                            { NOT: { count_GT: 2 } }
                            {
                                AND: [
                                    {
                                        node: {
                                            NOT: { testString_SHORTEST_GTE: 4 }
                                        }
                                    }
                                    {
                                        node: {
                                            testString_EQUAL: "${testString5}"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }) {
                    nodesDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [postType.operations.delete]: {
                nodesDeleted: 1,
            },
        });
    });

    test("OR within an OR", async () => {
        const query = `
            mutation {
                ${postType.operations.delete}(where: { 
                    likesAggregate: {
                        OR: [
                            { count_LTE: 2 }
                            {
                                OR: [
                                    {
                                        node: {
                                            testString_SHORTEST_LT: 4
                                        }
                                    }
                                    {
                                        node: {
                                            testString_EQUAL: "${testString5}"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }) {
                    nodesDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [postType.operations.delete]: {
                nodesDeleted: 4,
            },
        });
    });

    test("OR within an AND", async () => {
        const query = `
            mutation {
                ${postType.operations.delete}(where: { 
                    likesAggregate: {
                        AND: [
                            { count_LTE: 2 }
                            {
                                OR: [
                                    {
                                        node: {
                                            testString_SHORTEST_LT: 4
                                        }
                                    }
                                    {
                                        node: {
                                            testString_EQUAL: "${testString5}"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }) {
                    nodesDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [postType.operations.delete]: {
                nodesDeleted: 2,
            },
        });
    });

    test("AND within an OR", async () => {
        const query = `
            mutation {
                ${postType.operations.delete}(where: { 
                    likesAggregate: {
                        OR: [
                            { count_GTE: 2 }
                            {
                                AND: [
                                    {
                                        node: {
                                            testString_SHORTEST_LT: 4
                                        }
                                    }
                                    {
                                        node: {
                                            testString_EQUAL: "${testString5}"
                                        }
                                    }
                                ]
                            }
                        ]
                    }
                }) {
                    nodesDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [postType.operations.delete]: {
                nodesDeleted: 4,
            },
        });
    });
});
