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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2782", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Movie: UniqueType;
    let Actor: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Movie = new UniqueType("Movie");
        Actor = new UniqueType("Actor");

        const typeDefs = `
            type Product {
                id: ID!
                name: String
                colors: [Color!]! @relationship(type: "HAS_COLOR", direction: OUT)
                photos: [Photo!]! @relationship(type: "HAS_PHOTO", direction: OUT)
            }

            type Color {
                id: ID!
                name: String!
                photos: [Photo!]! @relationship(type: "OF_COLOR", direction: IN)
            }

            type Photo {
                id: ID!
                color: Color @relationship(type: "OF_COLOR", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        await session.run(`
            CREATE(p:Product {id: "1", name: "NormalConnect"})
            CREATE(p)-[:HAS_COLOR]->(red:Color {id: "1", name: "Red"})
            CREATE(red)<-[:OF_COLOR]-(photo:Photo {id: "123"})
            CREATE(photo)-[:OF_COLOR]->(:Color {id: "134", name:"Orange"})
            
            CREATE(p)-[:HAS_PHOTO]->(photo2:Photo {id: "321"})
            CREATE(p)-[:HAS_PHOTO]->(photo3:Photo {id: "33211"})

            CREATE(green:Color {id: "999", name: "Green"})
        
            CREATE(photo2)-[:OF_COLOR]->(green)
            CREATE(photo3)-[:OF_COLOR]->(red)
        `);
    });

    afterEach(async () => {
        await cleanNodes(session, [Movie, Actor]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should update with nested disconnections", async () => {
        const query = `
            mutation {
                updateProducts(
                    update: {
                        id: "123"
                        name: "Nested Connect"
                        colors: {
                            disconnect: [
                                {
                                    where: { node: { name: "Red" } }
                                    disconnect: {
                                        photos: [
                                            {
                                                where: { node: { id: "123" } }
                                                disconnect: { color: { where: { node: { id: "134" } } } }
                                            }
                                        ]
                                    }
                                }
                            ]
                        }
                        photos: {
                            disconnect: [
                                {
                                    where: { node: { id: "321" } }
                                    disconnect: { color: { where: { node: { name: "Green" } } } }
                                }
                                {
                                    where: { node: { id: "33211" } }
                                    disconnect: { color: { where: { node: { name: "Red" } } } }
                                }
                            ]
                        }
                    }
                ) {
                    products {
                        id
                    }
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            updateProducts: {
                products: [
                    {
                        id: "123",
                    },
                ],
            },
        });

        const query2 = `
            query {
                products {
                    id
                    name
                    colors {
                        id
                        name
                        photos {
                            id
                            color {
                                id
                                name
                            }
                        }
                    }
                    photos {
                        id
                        color {
                            name
                        }
                    }
                }
            }
        `;

        const result2 = await graphql({
            schema: await neoSchema.getSchema(),
            source: query2,
            contextValue: neo4j.getContextValues(),
        });

        expect(result2.errors).toBeFalsy();
        expect(result2.data).toEqual({
            products: [
                {
                    id: "123",
                    name: "Nested Connect",
                    colors: [],
                    photos: [],
                },
            ],
        });

        const query3 = `
            query {
                photos {
                    id
                    color {
                        id
                        name
                    }
                }
            }
        `;

        const result3 = await graphql({
            schema: await neoSchema.getSchema(),
            source: query3,
            contextValue: neo4j.getContextValues(),
        });

        expect(result3.errors).toBeFalsy();
        expect(result3.data).toEqual({
            photos: expect.toIncludeSameMembers([
                {
                    id: "123",
                    color: null,
                },
                {
                    id: "321",
                    color: null,
                },
                {
                    id: "33211",
                    color: null,
                },
            ]),
        });
    });
});
