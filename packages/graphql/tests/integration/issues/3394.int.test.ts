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

describe("https://github.com/neo4j/graphql/issues/3394", () => {
    const testHelper = new TestHelper();

    let Product: UniqueType;
    let Employee: UniqueType;

    beforeEach(async () => {
        Product = testHelper.createUniqueType("Product");
        Employee = testHelper.createUniqueType("Employee");

        const typeDefs = `#graphql
            type ${Employee} {
                products: [${Product}!]! @relationship(type: "CAN_ACCESS", direction: OUT)
            }

            type ${Product} {
                id: String! @alias(property: "fg_item_id")
                description: String!
                partNumber: ID! @alias(property: "fg_item")
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(
            `
                    CREATE (e:${Employee} {fg_item_id: "p1", description: "a p1", fg_item: "part1"})
                    CREATE (p1:${Product} {fg_item_id: "p1", description: "a p1", fg_item: "part1"})
                    CREATE (p2:${Product} {fg_item_id: "p2", description: "a p2", fg_item: "part2"})

                    CREATE (e)-[:CAN_ACCESS]->(p1)
                    CREATE (e)-[:CAN_ACCESS]->(p2)
                `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should sort elements by aliased field", async () => {
        const query = `#graphql
            query listProducts {
                ${Product.plural}(options: { sort: { partNumber: DESC } }) {
                    id
                    partNumber
                    description
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data?.[Product.plural]).toEqual([
            {
                id: "p2",
                description: "a p2",
                partNumber: "part2",
            },
            {
                id: "p1",
                description: "a p1",
                partNumber: "part1",
            },
        ]);
    });

    test("should sort elements by aliased field in relationship", async () => {
        const query = `#graphql
            query listProducts {
                ${Employee.plural} {
                    products(options: { sort: { partNumber: DESC } }) {
                        id
                        partNumber
                        description
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data?.[Employee.plural]).toEqual([
            {
                products: [
                    {
                        id: "p2",
                        description: "a p2",
                        partNumber: "part2",
                    },
                    {
                        id: "p1",
                        description: "a p1",
                        partNumber: "part1",
                    },
                ],
            },
        ]);
    });

    describe("Connection sort", () => {
        test("should sort elements by aliased field in connection", async () => {
            const query = `#graphql
            query listProducts {
                ${Product.operations.connection}(sort: { partNumber: DESC } ) {
                    edges {
                        node {
                            id
                            partNumber
                            description
                        }
                    }
                }
            }
        `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[Product.operations.connection]).toEqual({
                edges: [
                    {
                        node: {
                            id: "p2",
                            description: "a p2",
                            partNumber: "part2",
                        },
                    },
                    {
                        node: {
                            id: "p1",
                            description: "a p1",
                            partNumber: "part1",
                        },
                    },
                ],
            });
        });

        test("should sort elements by aliased field in nested  connection", async () => {
            const query = `#graphql
            query listProducts {
                ${Employee.plural}{
                    productsConnection(sort: { node: { partNumber: DESC } } ) {
                        edges {
                            node {
                                id
                                partNumber
                                description
                            }
                        }
                    }
                }
            }
        `;

            const gqlResult = await testHelper.executeGraphQL(query);

            expect(gqlResult.errors).toBeFalsy();
            expect(gqlResult.data?.[Employee.plural]).toEqual([
                {
                    productsConnection: {
                        edges: [
                            {
                                node: {
                                    id: "p2",
                                    description: "a p2",
                                    partNumber: "part2",
                                },
                            },
                            {
                                node: {
                                    id: "p1",
                                    description: "a p1",
                                    partNumber: "part1",
                                },
                            },
                        ],
                    },
                },
            ]);
        });
    });
});
