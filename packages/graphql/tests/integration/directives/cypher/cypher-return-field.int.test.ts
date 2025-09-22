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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Return different types with @cypher directive", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let Product: UniqueType;

    beforeAll(async () => {
        Product = testHelper.createUniqueType("Product");

        typeDefs = /* GraphQL */ `
            type ${Product} @node {
                nestedObjectArray: [NestedObject!]!
                    @cypher(
                        statement: """
                        UNWIND [{
                            value: 12,
                            country: 'Italy',
                            date: date('2024-09-22')
                        }] as result
                        RETURN result
                        """
                        columnName: "result"
                    )
                nestedObject: NestedObject @cypher(
                        statement: """
                        RETURN {
                            value: 10,
                            country: 'Spain',
                            date: date('2025-09-22')
                        } as result
                        """
                        columnName: "result"
                    )   
            }

            type NestedObject {
                value: Int
                country: String
                date: Date
            }

            type Query {
                topLevelObject: NestedObject
                    @cypher(
                        statement: """
                        RETURN {
                            value: 10,
                            country: 'Spain',
                            date: date('2025-09-22')
                        } as result
                        """
                        columnName: "result"
                    )
                topLevelObjectArray: [NestedObject!]!
                    @cypher(
                        statement: """
                        UNWIND [{
                            value: 12,
                            country: 'Italy',
                            date: date('2024-09-22')
                        }] as result
                        RETURN result
                        """
                        columnName: "result"
                    )
            }
        `;

        await testHelper.executeCypher(`
            CREATE(p:${Product} {name: "product1"})
            `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("nested fields", async () => {
        const query = /* GraphQL */ `
            query {
                ${Product.plural} {
                    nestedObject {
                        value
                        country
                        date
                    }
                    nestedObjectArray {
                        value
                        country
                        date
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(queryResult.data).toEqual({
            [Product.plural]: [
                {
                    nestedObject: {
                        value: 10,
                        country: "Spain",
                        date: "2025-09-22",
                    },
                    nestedObjectArray: [
                        {
                            value: 12,
                            country: "Italy",
                            date: "2024-09-22",
                        },
                    ],
                },
            ],
        });
    });

    test("top level fields", async () => {
        const query = /* GraphQL */ `
            query {
                topLevelObject {
                    value
                    country
                    date
                }
                topLevelObjectArray {
                    value
                    country
                    date
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(queryResult.data).toEqual({
            topLevelObject: {
                value: 10,
                country: "Spain",
                date: "2025-09-22",
            },
            topLevelObjectArray: [
                {
                    value: 12,
                    country: "Italy",
                    date: "2024-09-22",
                },
            ],
        });
    });
});
