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

import { graphql, GraphQLSchema } from "graphql";
import { Driver } from "neo4j-driver";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1430", () => {
    const testAbce = generateUniqueType("ABCE");
    const testChildOne = generateUniqueType("ChildOne");
    const testChildTwo = generateUniqueType("ChildTwo");

    let schema: GraphQLSchema;
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();

        const typeDefs = `
            type ${testAbce.name} {
                id:ID @id
                name: String
                interface: InterfaceMom @relationship(type:"HAS_INTERFACE", direction:OUT)
            }
            
            interface InterfaceMom {
                id:ID @id
                name:String
            }
            
            type ${testChildOne.name} implements InterfaceMom {
                id:ID @id
                name:String
                feathur: String
            }
            
            type ${testChildTwo.name} implements InterfaceMom {
                id:ID @id
                name:String
                sth: String
            }
        `;

        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Do not allow more than one implementation for one-to-one relationships", async () => {
        const createMutation = `
            mutation createAbces {
                ${testAbce.operations.create}(
                    input: [
                        {
                            interface: {
                                create: {
                                    node: {
                                        ${testChildOne.name}: { name: "childone name" },
                                        ${testChildTwo.name}: { name: "childtwo name" }
                                    }
                                }
                            }
                        }
                    ]
                ) {
                    ${testAbce.plural} {
                        id
                        name
                        interface {
                            id
                            name
                            __typename
                        }
                    }
                }
            }
        `;

        const createMutationResults = await graphql({
            schema,
            source: createMutation,
            contextValue: {
                driver,
            },
        });

        expect(createMutationResults.errors).toHaveLength(1);
        expect(createMutationResults.errors?.[0].message).toBe(
            `Relation field "interface" cannot have more than one node linked`
        );
        expect(createMutationResults.data as any).toBeNull();
    });

    test("XXXXXXXX", async () => {
        const createMutation = `
            mutation createAbces {
                ${testAbce.operations.create}(
                    input: [
                        {
                            interface: {
                                create: {
                                    node: {
                                        ${testChildOne.name}: { name: "childone name second round" },
                                    }
                                }
                            }
                        }
                    ]
                ) {
                    ${testAbce.plural} {
                        id
                        name
                        interface {
                            id
                            name
                            __typename
                        }
                    }
                }
            }
        `;

        const createMutationResults = await graphql({
            schema,
            source: createMutation,
            contextValue: {
                driver,
            },
        });

        expect(createMutationResults.errors).toBeUndefined();
        expect(createMutationResults.data as any).toEqual({
            [testAbce.operations.create]: {
                [testAbce.plural]: [
                    {
                        id: expect.any(String),
                        name: null,
                        interface: {
                            id: expect.any(String),
                            name: "childone name second round",
                            __typename: testChildOne.name,
                        },
                    },
                ],
            },
        });

        const abcesId = (createMutationResults.data as any)[testAbce.operations.create][testAbce.plural][0].id;

        const updateMutation = `
            mutation ddfs{
                ${testAbce.operations.update}(where: { id: "${abcesId}" }
                    create: { interface:{ node: { ${testChildOne.name}: { name: "childone name2" } } } }
                ){
                    ${testAbce.plural} {
                        id
                        interface {
                            id
                            name
                            __typename
                        }
                    }
                }
            }
        `;

        const updateMutationResults = await graphql({
            schema,
            source: updateMutation,
            contextValue: {
                driver,
            },
        });

        console.log(updateMutationResults.data as any);

        expect(updateMutationResults.errors).toBeUndefined();
        expect(updateMutationResults.data as any).toEqual({
            [testAbce.operations.update]: {
                [testAbce.plural]: [
                    {
                        id: expect.any(String),
                        interface: {
                            id: expect.any(String),
                            name: "childone name2",
                            __typename: testChildOne.name,
                        },
                    },
                    {
                        id: expect.any(String),
                        interface: {
                            id: expect.any(String),
                            name: "childone name second round",
                            __typename: testChildOne.name,
                        },
                    },
                ],
            },
        });
    });
});
