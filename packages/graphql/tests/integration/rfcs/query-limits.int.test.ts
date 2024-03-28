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
import { TestHelper } from "../../utils/tests-helper";

describe("integration/rfcs/query-limits", () => {
    const testHelper = new TestHelper();

    beforeEach(() => {});

    afterEach(async () => {
        await testHelper.close();
    });

    describe("Top Level Query Limits", () => {
        test("should limit the top level query", async () => {
            const randomType = testHelper.createUniqueType("Movie");

            const typeDefs = `
                type ${randomType.name} @limit(default: 2) {
                    id: ID!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            await testHelper.executeCypher(
                `
                        WITH [1,2,3,4,5] AS iterate
                        UNWIND iterate AS i
                        CREATE (:${randomType.name} {id: randomUUID()})
                    `,
                {}
            );

            const query = `
                        {
                            ${randomType.plural} {
                                id
                            }
                        }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[randomType.plural]).toHaveLength(2);
        });
    });

    describe("Field Level Query Limits", () => {
        test("should limit the normal field level query", async () => {
            const randomType1 = testHelper.createUniqueType("Movie");
            const randomType2 = testHelper.createUniqueType("Person");
            const movieId = generate({
                charset: "alphabetic",
            });

            const typeDefs = `
                type ${randomType1.name}  {
                    id: ID!
                    actors: [${randomType2.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type ${randomType2.name} @limit(default: 3) {
                    id: ID!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            await testHelper.executeCypher(
                `
                        CREATE (movie:${randomType1.name} {id: "${movieId}"})
                        WITH movie, [1,2,3,4,5] AS iterate
                        UNWIND iterate AS i
                        MERGE (movie)<-[:ACTED_IN]-(:${randomType2.name} {id: randomUUID()})
                    `,
                {}
            );

            const query = `
                        {
                            ${randomType1.plural} {
                                id
                                actors {
                                    id
                                }
                            }
                        }
                `;

            const gqlResult = await testHelper.executeGraphQL(query);

            if (gqlResult.errors) {
                console.log(JSON.stringify(gqlResult.errors, null, 2));
            }

            expect(gqlResult.errors).toBeUndefined();
            expect((gqlResult.data as any)[randomType1.plural][0].actors).toHaveLength(3);
        });

        test("should limit the connection field level query", async () => {
            const randomType1 = testHelper.createUniqueType("Movie");
            const randomType2 = testHelper.createUniqueType("Person");
            const movieId = generate({
                charset: "alphabetic",
            });

            const typeDefs = `
                type ${randomType1.name}  {
                    id: ID!
                    actors: [${randomType2.name}!]! @relationship(type: "ACTED_IN", direction: IN)
                }

                type ${randomType2.name} @limit(default: 4) {
                    id: ID!
                }
            `;

            await testHelper.initNeo4jGraphQL({ typeDefs });

            await testHelper.executeCypher(
                `
                        CREATE (movie:${randomType1.name} {id: "${movieId}"})
                        WITH movie, [1,2,3,4,5] AS iterate
                        UNWIND iterate AS i
                        MERGE (movie)<-[:ACTED_IN]-(:${randomType2.name} {id: randomUUID()})
                    `,
                {}
            );

            const query = `
                        {
                            ${randomType1.plural} {
                                id
                                actorsConnection {
                                    edges {
                                        node {
                                            id
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
            expect((gqlResult.data as any)[randomType1.plural][0].actorsConnection.edges).toHaveLength(4);
        });
    });
});
