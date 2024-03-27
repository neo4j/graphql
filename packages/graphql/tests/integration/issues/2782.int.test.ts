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

describe("https://github.com/neo4j/graphql/issues/2782", () => {
    const testHelper = new TestHelper();

    let Product: UniqueType;
    let Color: UniqueType;
    let Photo: UniqueType;

    beforeEach(async () => {
        Product = testHelper.createUniqueType("Product");
        Color = testHelper.createUniqueType("Color");
        Photo = testHelper.createUniqueType("Photo");

        const typeDefs = `
            type ${Product} {
                id: ID!
                name: String
                colors: [${Color}!]! @relationship(type: "HAS_COLOR", direction: OUT)
                photos: [${Photo}!]! @relationship(type: "HAS_PHOTO", direction: OUT)
            }

            type ${Color} {
                id: ID!
                name: String!
                photos: [${Photo}!]! @relationship(type: "OF_COLOR", direction: IN)
            }

            type ${Photo} {
                id: ID!
                color: ${Color} @relationship(type: "OF_COLOR", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        await testHelper.executeCypher(`
            CREATE(p:${Product} {id: "1", name: "NormalConnect"})
            CREATE(p)-[:HAS_COLOR]->(red:${Color} {id: "1", name: "Red"})
            CREATE(red)<-[:OF_COLOR]-(photo:${Photo} {id: "123"})
            CREATE(photo)-[:OF_COLOR]->(:${Color} {id: "134", name:"Orange"})
            
            CREATE(p)-[:HAS_PHOTO]->(photo2:${Photo} {id: "321"})
            CREATE(p)-[:HAS_PHOTO]->(photo3:${Photo} {id: "33211"})

            CREATE(green:${Color} {id: "999", name: "Green"})
        
            CREATE(photo2)-[:OF_COLOR]->(green)
            CREATE(photo3)-[:OF_COLOR]->(red)
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should update with nested disconnections", async () => {
        const query = `
            mutation {
                ${Product.operations.update}(
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
                    ${Product.plural} {
                        id
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Product.operations.update]: {
                [Product.plural]: [
                    {
                        id: "123",
                    },
                ],
            },
        });

        const query2 = `
            query {
                ${Product.plural} {
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

        const result2 = await testHelper.executeGraphQL(query2);

        expect(result2.errors).toBeFalsy();
        expect(result2.data).toEqual({
            [Product.plural]: [
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
                ${Photo.plural} {
                    id
                    color {
                        id
                        name
                    }
                }
            }
        `;

        const result3 = await testHelper.executeGraphQL(query3);

        expect(result3.errors).toBeFalsy();
        expect(result3.data).toEqual({
            [Photo.plural]: expect.toIncludeSameMembers([
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
