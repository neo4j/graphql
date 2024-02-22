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

import { graphql } from "graphql";
import { type Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import { cleanNodes } from "../../utils/clean-nodes";
import { UniqueType } from "../../utils/graphql-types";
import { default as Neo4jHelper } from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4532", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neo4jGraphql: Neo4jGraphQL;

    describe("order-by relationship property", () => {
        const Inventory = new UniqueType("Inventory");
        const Scenario = new UniqueType("Scenario");

        beforeAll(async () => {
            neo4j = new Neo4jHelper();
            driver = await neo4j.getDriver();
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
            neo4jGraphql = new Neo4jGraphQL({
                typeDefs,
                driver,
            });

            const session = await neo4j.getSession();
            try {
                await session.run(
                    `
                CREATE(i:${Inventory} {id: "i1"})
                CREATE(i)-[:HasChildren { order: 3 }]->(c1:${Scenario} { id: "c3"})
                CREATE(i)-[:HasChildren { order: 1 }]->(c2:${Scenario} { id: "c1"})
                CREATE(i)-[:HasChildren { order: 2 }]->(c3:${Scenario} { id: "c2"})

                CREATE(:${Inventory} {id: "i2"})
                `,
                    {}
                );
            } finally {
                await session.close();
            }
        });

        afterAll(async () => {
            const session = await neo4j.getSession();
            try {
                await cleanNodes(driver, [Inventory, Scenario]);
            } finally {
                await session.close();
            }
            await driver.close();
        });

        test("should return all elements when ordering by nested connection", async () => {
            const schema = await neo4jGraphql.getSchema();

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

            const response = await graphql({
                schema,
                source: query,
                contextValue: neo4j.getContextValues(),
            });
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
        const Inventory = new UniqueType("Inventory");
        const Image = new UniqueType("Image");
        const Video = new UniqueType("Video");

        beforeAll(async () => {
            neo4j = new Neo4jHelper();
            driver = await neo4j.getDriver();
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
            neo4jGraphql = new Neo4jGraphQL({
                typeDefs,
                driver,
            });

            const session = await neo4j.getSession();
            try {
                await session.run(
                    `
                CREATE(i:${Inventory} {id: "i1"})
                CREATE(i)-[:HasChildren { order: 3 }]->(c1:${Image} { id: "c3"})
                CREATE(i)-[:HasChildren { order: 1 }]->(c2:${Video} { id: "c1"})
                CREATE(i)-[:HasChildren { order: 2 }]->(c3:${Video} { id: "c2"})

                CREATE(:${Inventory} {id: "i2"})
                `,
                    {}
                );
            } finally {
                await session.close();
            }
        });

        afterAll(async () => {
            const session = await neo4j.getSession();
            try {
                await cleanNodes(driver, [Inventory, Image, Video]);
            } finally {
                await session.close();
            }
            await driver.close();
        });

        test("should return all elements when ordering by nested connection on an interface target", async () => {
            const schema = await neo4jGraphql.getSchema();

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

            const response = await graphql({
                schema,
                source: query,
                contextValue: neo4j.getContextValues(),
            });
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
