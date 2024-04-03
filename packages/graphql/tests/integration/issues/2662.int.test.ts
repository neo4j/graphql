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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2662", () => {
    const testHelper = new TestHelper();

    let userType: UniqueType;
    let postType: UniqueType;
    let likesInterface: UniqueType;

    const content1 = "Some post content";
    const content2 = "Other content";
    const someString1 = "Some like string";
    const someString2 = "Short str";
    const someString3 = "A third string example that is very long";
    const name1 = "A username";
    const name2 = "This is a long username;";
    const name3 = "Another name";

    const post1Average = (someString1.length + someString2.length) / 2;

    beforeEach(async () => {
        userType = testHelper.createUniqueType("User");
        postType = testHelper.createUniqueType("Post");
        likesInterface = testHelper.createUniqueType("Likes");

        const typeDefs = `
            type ${userType} {
                name: String!
            }
            type ${postType} {
                content: String!
                likes: [${userType}!]! @relationship(type: "LIKES", direction: IN, properties: "${likesInterface}")
            }
            type ${likesInterface} @relationshipProperties {
                someString: String
            }    
        `;

        await testHelper.executeCypher(`
            CREATE (p:${postType} { content: "${content1}" })<-[:LIKES { someString: "${someString1}" }]-(:${userType} { name: "${name1}" })
            CREATE (p)<-[:LIKES { someString: "${someString2}" }]-(:${userType} { name: "${name2}" })
            CREATE (:${postType} { content: "${content2}" })<-[:LIKES { someString: "${someString3}" }]-(:${userType} { name: "${name3}" })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return posts where an edge like String EQUAL", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_EQUAL: "${someString3}" } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content2,
                    likes: [
                        {
                            name: name3,
                        },
                    ],
                },
            ],
        });
    });

    test("should return posts where an edge like String is GT", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_GT: ${someString1.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content2,
                    likes: [
                        {
                            name: name3,
                        },
                    ],
                },
            ],
        });
    });
    test("should return posts where an edge like String is GTE", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_GTE: ${someString1.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: expect.toIncludeSameMembers([
                {
                    content: content2,
                    likes: [
                        {
                            name: name3,
                        },
                    ],
                },
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ]),
        });
    });

    test("should return posts where an edge like String is LT", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_LT: ${someString1.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String is LTE", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_LTE: ${someString3.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: expect.toIncludeSameMembers([
                {
                    content: content2,
                    likes: [
                        {
                            name: name3,
                        },
                    ],
                },
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ]),
        });
    });

    test("should return posts where an edge like String AVERAGE_EQUAL", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_AVERAGE_EQUAL: ${post1Average} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String AVERAGE_LT", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_AVERAGE_LT: ${someString3.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String AVERAGE_LTE", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_AVERAGE_LTE: ${post1Average} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String AVERAGE_GT", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_AVERAGE_GT: ${post1Average} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content2,
                    likes: [
                        {
                            name: name3,
                        },
                    ],
                },
            ],
        });
    });

    test("should return posts where an edge like String AVERAGE_GTE", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_AVERAGE_GTE: ${post1Average} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: expect.toIncludeSameMembers([
                {
                    content: content2,
                    likes: [
                        {
                            name: name3,
                        },
                    ],
                },
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ]),
        });
    });

    test("should return posts where an edge like String LONGEST_EQUAL", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_LONGEST_EQUAL: ${someString1.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String LONGEST_LT", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_LONGEST_LT: ${someString3.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String LONGEST_LTE", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_LONGEST_LTE: ${someString3.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: expect.toIncludeSameMembers([
                {
                    content: content2,
                    likes: [
                        {
                            name: name3,
                        },
                    ],
                },
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ]),
        });
    });

    test("should return posts where an edge like String LONGEST_GT", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_LONGEST_GT: ${someString1.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content2,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name3,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String LONGEST_GTE", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_LONGEST_GTE: ${someString3.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content2,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name3,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String SHORTEST_EQUAL", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_SHORTEST_EQUAL: ${someString2.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String SHORTEST_LT", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_SHORTEST_LT: ${someString1.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String SHORTEST_LTE", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_SHORTEST_LTE: ${someString2.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String SHORTEST_GT", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_SHORTEST_GT: ${someString2.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    content: content2,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name3,
                        },
                    ]),
                },
            ],
        });
    });

    test("should return posts where an edge like String SHORTEST_GTE", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someString_SHORTEST_GTE: ${someString2.length} } } }) {
                    content
                    likes {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: expect.toIncludeSameMembers([
                {
                    content: content2,
                    likes: [
                        {
                            name: name3,
                        },
                    ],
                },
                {
                    content: content1,
                    likes: expect.toIncludeSameMembers([
                        {
                            name: name1,
                        },
                        {
                            name: name2,
                        },
                    ]),
                },
            ]),
        });
    });
});

describe("https://github.com/neo4j/graphql/issues/2662 - alternative typedefs", () => {
    const testHelper = new TestHelper();

    let userType: UniqueType;
    let postType: UniqueType;
    let likesInterface: UniqueType;

    const someString1 = "Some like string";
    const someString2 = "Short str";
    const someString3 = "A third string example that is very long";

    const post1Average = (someString1.length + someString2.length) / 2;

    beforeEach(async () => {
        userType = testHelper.createUniqueType("User");
        postType = testHelper.createUniqueType("Post");
        likesInterface = testHelper.createUniqueType("Likes");

        const typeDefs = `
            type ${userType} {
                someProperty: Int!
            }
            type ${postType} {
                someProperty: Int!
                likes: [${userType}!]! @relationship(type: "LIKES", direction: IN, properties: "${likesInterface}")
            }
            type ${likesInterface} @relationshipProperties {
                someProperty: String!
            }    
        `;

        await testHelper.executeCypher(`
            CREATE (p:${postType} { someProperty: 1 })<-[:LIKES { someProperty: "${someString1}" }]-(:${userType} { someProperty: 1 })
            CREATE (p)<-[:LIKES { someProperty: "${someString2}" }]-(:${userType} { someProperty: 2 })
            CREATE (:${postType} { someProperty: 2 })<-[:LIKES { someProperty: "${someString3}" }]-(:${userType} { someProperty: 3 })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should should apply AVERAGE filter to a string edge property correctly when node has a node has a property with the same name but different type", async () => {
        const query = `
            {
                ${postType.plural}(where: { likesAggregate: { edge: { someProperty_AVERAGE_EQUAL: ${post1Average} } } }) {
                    someProperty
                    likes {
                        someProperty
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [postType.plural]: [
                {
                    someProperty: 1,
                    likes: expect.toIncludeSameMembers([
                        {
                            someProperty: 1,
                        },
                        {
                            someProperty: 2,
                        },
                    ]),
                },
            ],
        });
    });
});
