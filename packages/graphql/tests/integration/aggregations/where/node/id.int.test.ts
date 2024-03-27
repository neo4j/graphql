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

describe("aggregations-where-node-id", () => {
    const testHelper = new TestHelper();
    let User: UniqueType;
    let Post: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Post = testHelper.createUniqueType("Post");

        const typeDefs = `
            type ${User} {
                id: ID
                testString: String!
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

    test("should return posts where a like ID is EQUAL to", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const testId = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", id: "${testId}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { id_EQUAL: "${testId}" } } }) {
                        testString
                        likes {
                            id
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ id: testId, testString }],
            },
        ]);
    });
});

describe("aggregations-where-node-id interface relationships of concrete types", () => {
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
            id: ID
            testString: String!
        }

        type ${Person} implements Human {
            id: ID
            testString: String!
        }

            type ${User} implements Human {
                id: ID
                testString: String!
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

    test("should return posts where a like ID is EQUAL to", async () => {
        const testString = generate({
            charset: "alphabetic",
            readable: true,
        });

        const testId = generate({
            charset: "alphabetic",
            readable: true,
        });

        await testHelper.executeCypher(
            `
                    CREATE (:${Post} {testString: "${testString}"})<-[:LIKES]-(:${User} {testString: "${testString}", id: "${testId}"})
                    CREATE (:${Post} {testString: "${testString}"})
                `
        );

        const query = `
                {
                    ${Post.plural}(where: { testString: "${testString}", likesAggregate: { node: { id_EQUAL: "${testId}" } } }) {
                        testString
                        likes {
                            id
                            testString
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);
        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Post.plural]).toEqual([
            {
                testString,
                likes: [{ id: testId, testString }],
            },
        ]);
    });
});
