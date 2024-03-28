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

describe("https://github.com/neo4j/graphql/issues/4532", () => {
    const testHelper = new TestHelper();

    describe("order-by relationship property", () => {
        let Inventory: UniqueType;
        let Scenario: UniqueType;

        beforeAll(async () => {
            Inventory = testHelper.createUniqueType("Inventory");
            Scenario = testHelper.createUniqueType("Scenario");

            const typeDefs = /* GraphQL */ `
                type ${Inventory} {
                    id: ID
                    children: [${Scenario}!]!
                        @relationship(type: "HasChildren", properties: "InventoryChildRelation", direction: OUT)
                }

                type ${Scenario} {
                    id: ID
                }

                type InventoryChildRelation @relationshipProperties {
                    order: Int
                }
            `;
            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await testHelper.executeCypher(
                `
                CREATE(i:${Inventory} {id: "i1"})
                CREATE(i)-[:HasChildren { order: 3 }]->(c1:${Scenario} { id: "c3"})
                CREATE(i)-[:HasChildren { order: 1 }]->(c2:${Scenario} { id: "c1"})
                CREATE(i)-[:HasChildren { order: 2 }]->(c3:${Scenario} { id: "c2"})

                CREATE(:${Inventory} {id: "i2"})
                `,
                {}
            );
        });

        afterAll(async () => {
            await testHelper.close();
        });

        test("should return all elements when ordering by nested connection", async () => {
            const query = /* GraphQL */ `
                query {
                    ${Inventory.plural} {
                        id
                        childrenConnection(sort: { edge: { order: ASC } }) {
                            edges {
                                properties {
                                    order
                                }
                                node {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const response = await testHelper.executeGraphQL(query);
            expect(response.errors).toBeFalsy();
            expect(response.data).toEqual({
                [Inventory.plural]: expect.toIncludeSameMembers([
                    {
                        id: "i1",
                        childrenConnection: {
                            edges: [
                                {
                                    node: { id: "c1" },
                                    properties: { order: 1 },
                                },
                                {
                                    node: { id: "c2" },
                                    properties: { order: 2 },
                                },
                                {
                                    node: { id: "c3" },
                                    properties: { order: 3 },
                                },
                            ],
                        },
                    },
                    {
                        id: "i2",
                        childrenConnection: {
                            edges: [],
                        },
                    },
                ]),
            });
        });
    });

    describe("order-by relationship property on interface node target", () => {
        let Inventory: UniqueType;
        let Image: UniqueType;
        let Video: UniqueType;

        beforeAll(async () => {
            Inventory = testHelper.createUniqueType("Inventory");
            Image = testHelper.createUniqueType("Image");
            Video = testHelper.createUniqueType("Video");

            const typeDefs = /* GraphQL */ `
                type ${Inventory} {
                    id: ID
                    children: [Scenario!]!
                        @relationship(type: "HasChildren", properties: "InventoryChildRelation", direction: OUT)
                }

                interface Scenario {
                    id: ID
                }

                type ${Image} implements Scenario {
                    id: ID
                }

                type ${Video} implements Scenario {
                    id: ID
                }

                type InventoryChildRelation @relationshipProperties {
                    order: Int
                }
            `;
            await testHelper.initNeo4jGraphQL({
                typeDefs,
            });

            await testHelper.executeCypher(
                `
                CREATE(i:${Inventory} {id: "i1"})
                CREATE(i)-[:HasChildren { order: 3 }]->(c1:${Image} { id: "c3"})
                CREATE(i)-[:HasChildren { order: 1 }]->(c2:${Video} { id: "c1"})
                CREATE(i)-[:HasChildren { order: 2 }]->(c3:${Video} { id: "c2"})

                CREATE(:${Inventory} {id: "i2"})
                `
            );
        });

        afterAll(async () => {
            await testHelper.close();
        });

        test("should return all elements when ordering by nested connection on an interface target", async () => {
            const query = /* GraphQL */ `
                query {
                    ${Inventory.plural} {
                        id
                        childrenConnection(sort: { edge: { order: ASC } }) {
                            edges {
                                properties {
                                    order
                                }
                                node {
                                    id
                                }
                            }
                        }
                    }
                }
            `;

            const response = await testHelper.executeGraphQL(query);
            expect(response.errors).toBeFalsy();
            expect(response.data).toEqual({
                [Inventory.plural]: expect.toIncludeSameMembers([
                    {
                        id: "i1",
                        childrenConnection: {
                            edges: [
                                {
                                    node: { id: "c1" },
                                    properties: { order: 1 },
                                },
                                {
                                    node: { id: "c2" },
                                    properties: { order: 2 },
                                },
                                {
                                    node: { id: "c3" },
                                    properties: { order: 3 },
                                },
                            ],
                        },
                    },
                    {
                        id: "i2",
                        childrenConnection: {
                            edges: [],
                        },
                    },
                ]),
            });
        });
    });
});
