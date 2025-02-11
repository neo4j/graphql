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

import { TestHelper } from "../../../utils/tests-helper";

describe("aggregations-top_level-basic", () => {
    const testHelper = new TestHelper();

    afterEach(async () => {
        await testHelper.close();
    });

    test("should count nodes", async () => {
        const randomType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} @node {
                id: ID
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (:${randomType.name} {id: "asd"})
            CREATE (:${randomType.name} {id: "asd3"})
        `);

        const query = `
                {
                    ${randomType.operations.connection} {
                        aggregate {
                            node {
                                count
                                id {
                                    longest 
                                }
                            }
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [randomType.operations.connection]: {
                aggregate: {
                    node: {
                        count: 2,
                        id: {
                            longest: "asd3",
                        },
                    },
                },
            },
        });
    });

    test("should return 0 if no nodes exist", async () => {
        const randomType = testHelper.createUniqueType("Movie");

        const typeDefs = `
            type ${randomType.name} @node {
                id: ID
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        const query = `
                {
                    ${randomType.operations.connection} {
                        aggregate {
                            node {
                                count
                            }
                        }
                    }
                }
            `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [randomType.operations.connection]: {
                aggregate: {
                    node: {
                        count: 0,
                    },
                },
            },
        });
    });
});
