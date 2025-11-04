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

describe("https://github.com/neo4j/graphql/issues/2189", () => {
    const testHelper = new TestHelper();

    let Test_Item: UniqueType;
    let Test_Feedback: UniqueType;

    beforeEach(async () => {
        Test_Item = testHelper.createUniqueType("Test_Item");
        Test_Feedback = testHelper.createUniqueType("Test_Feedback");

        const typeDefs = `
            type ${Test_Item} {
                uuid: ID! @id @unique
                int: Int
                str: String
                bool: Boolean

                feedback: ${Test_Feedback} @relationship(type: "TEST_RELATIONSHIP", direction: IN)
                feedbackCypher: ${Test_Feedback}
                    @cypher(
                        statement: """
                        OPTIONAL MATCH (this)<-[:TEST_RELATIONSHIP]-(t:${Test_Feedback})
                        RETURN t
                        LIMIT 1
                        """,
                        columnName: "t"
                    )
            }
            type ${Test_Feedback} {
                uuid: ID! @id @unique
                int: Int
                str: String
                bool: Boolean

                item: ${Test_Item} @relationship(type: "TEST_RELATIONSHIP", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Mutation followed by query with Cypher field should return 2 nodes", async () => {
        const mutation = `
            mutation {
                ${Test_Item.operations.create}(
                    input: [
                        { feedback: { create: { node: { str: "hi there" } } }, int: 1, str: "one", bool: false }
                        { int: 2, str: "two", bool: true }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        const query = `
            query FeedbackCypher {
                ${Test_Item.plural} {
                    bool
                    int
                    str
                    uuid
                    feedbackCypher {
                        bool
                        str
                        int
                        uuid
                    }
                    feedback {
                        uuid
                        int
                        str
                        bool
                    }
                }
            }
        `;

        const mutationResult = await testHelper.executeGraphQL(mutation);

        expect(mutationResult.errors).toBeFalsy();
        expect((mutationResult?.data as any)[Test_Item.operations.create].info).toEqual({
            relationshipsCreated: 1,
            nodesCreated: 3,
        });

        const queryResult = await testHelper.executeGraphQL(query);

        expect(queryResult.errors).toBeFalsy();
        expect((queryResult?.data as any)[Test_Item.plural]).toHaveLength(2);
        expect((queryResult?.data as any)[Test_Item.plural].filter((t) => t.str === "one")[0].feedbackCypher.str).toBe(
            "hi there"
        );
        expect((queryResult?.data as any)[Test_Item.plural].filter((t) => t.str == "two")[0].feedbackCypher).toBeNull();
    });

    test("Mutation followed by query without Cypher field should return 2 nodes", async () => {
        const mutation = `
            mutation {
                ${Test_Item.operations.create}(
                    input: [
                        { feedback: { create: { node: { str: "hi there" } } }, int: 1, str: "one", bool: false }
                        { int: 2, str: "two", bool: true }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                }
            }
        `;

        const query = `
            query FeedbackCypher {
                ${Test_Item.plural} {
                    bool
                    int
                    str
                    uuid
                    feedback {
                        uuid
                        int
                        str
                        bool
                    }
                }
            }
        `;

        const mutationResult = await testHelper.executeGraphQL(mutation);

        expect(mutationResult.errors).toBeFalsy();
        expect((mutationResult?.data as any)[Test_Item.operations.create].info).toEqual({
            relationshipsCreated: 1,
            nodesCreated: 3,
        });

        const queryResult = await testHelper.executeGraphQL(query);

        expect(queryResult.errors).toBeFalsy();
        expect((queryResult?.data as any)[Test_Item.plural]).toHaveLength(2);
        expect((queryResult?.data as any)[Test_Item.plural].filter((t) => t.str === "one")[0].feedback.str).toBe(
            "hi there"
        );
        expect((queryResult?.data as any)[Test_Item.plural].filter((t) => t.str == "two")[0].feedback).toBeNull();
    });

    test("Mutation with Cypher relationship in projection should return 2 nodes", async () => {
        const query = `
            mutation {
                ${Test_Item.operations.create}(
                    input: [
                        { feedback: { create: { node: { str: "hi there" } } }, int: 1, str: "one", bool: false }
                        { int: 2, str: "two", bool: true }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                    ${Test_Item.plural} {
                        bool
                        int
                        str
                        uuid
                        feedbackCypher {
                            bool
                            str
                            int
                            uuid
                        }
                        feedback {
                            uuid
                            int
                            str
                            bool
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect((result?.data as any)[Test_Item.operations.create].info).toEqual({
            relationshipsCreated: 1,
            nodesCreated: 3,
        });
        expect((result?.data as any)[Test_Item.operations.create][Test_Item.plural]).toHaveLength(2);
        expect(
            (result?.data as any)[Test_Item.operations.create][Test_Item.plural].filter((t) => t.str === "one")[0]
                .feedbackCypher.str
        ).toBe("hi there");
        expect(
            (result?.data as any)[Test_Item.operations.create][Test_Item.plural].filter((t) => t.str == "two")[0]
                .feedbackCypher
        ).toBeNull();
    });

    test("Mutation without Cypher relationship in projection should return 2 nodes", async () => {
        const query = `
            mutation {
                ${Test_Item.operations.create}(
                    input: [
                        { feedback: { create: { node: { str: "hi there" } } }, int: 1, str: "one", bool: false }
                        { int: 2, str: "two", bool: true }
                    ]
                ) {
                    info {
                        relationshipsCreated
                        nodesCreated
                    }
                    ${Test_Item.plural} {
                        bool
                        int
                        str
                        uuid
                        feedback {
                            uuid
                            int
                            str
                            bool
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect((result?.data as any)[Test_Item.operations.create].info).toEqual({
            relationshipsCreated: 1,
            nodesCreated: 3,
        });
        expect((result?.data as any)[Test_Item.operations.create][Test_Item.plural]).toHaveLength(2);
        expect(
            (result?.data as any)[Test_Item.operations.create][Test_Item.plural].filter((t) => t.str === "one")[0]
                .feedback.str
        ).toBe("hi there");
        expect(
            (result?.data as any)[Test_Item.operations.create][Test_Item.plural].filter((t) => t.str == "two")[0]
                .feedback
        ).toBeNull();
    });
});
