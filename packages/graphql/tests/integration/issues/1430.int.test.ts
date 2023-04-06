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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1430", () => {
    const testAbce = new UniqueType("ABCE");
    const testChildOne = new UniqueType("ChildOne");
    const testChildTwo = new UniqueType("ChildTwo");

    let schema: GraphQLSchema;
    let neo4j: Neo4j;
    let driver: Driver;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

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

    test("should not allow to create more than one node for a one-to-one relationship", async () => {
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
            contextValue: neo4j.getContextValues(),
        });

        expect(createMutationResults.errors).toHaveLength(1);
        expect(createMutationResults.errors?.[0]?.message).toBe(
            `Relationship field "${testAbce.name}.interface" cannot have more than one node linked`
        );
        expect(createMutationResults.data as any).toBeNull();
    });

    test("should not allow creating a second node to an existing one-to-one relationship", async () => {
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
            contextValue: neo4j.getContextValues(),
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
                    create: { interface: { node: { ${testChildOne.name}: { name: "childone name2" } } } }
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
            contextValue: neo4j.getContextValues(),
        });

        expect(updateMutationResults.errors).toHaveLength(1);
        expect(updateMutationResults.errors?.[0]?.message).toContain(
            `Relationship field "${testAbce.name}.interface" cannot have more than one node linked`
        );
        expect(updateMutationResults.data as any).toBeNull();
    });

    test("should not allow connecting a second node to an existing one-to-one relationship", async () => {
        const createMutation = `
            mutation createAbces {
                ${testAbce.operations.create}(
                    input: [
                        {
                            interface: {
                                create: {
                                    node: {
                                        ${testChildOne.name}: { name: "childone name connect" },
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
            contextValue: neo4j.getContextValues(),
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
                            name: "childone name connect",
                            __typename: testChildOne.name,
                        },
                    },
                ],
            },
        });

        const abcesId = (createMutationResults.data as any)[testAbce.operations.create][testAbce.plural][0].id;

        const updateMutation = `
            mutation {
                ${testAbce.operations.update}(
                    where: { id: "${abcesId}" }
                    connect: { interface: { where: { node: { name: "childone name connect" } } } }
                ) {
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
            contextValue: neo4j.getContextValues(),
        });

        expect(updateMutationResults.errors).toHaveLength(1);
        expect(updateMutationResults.errors?.[0]?.message).toContain(
            `Relationship field "${testAbce.name}.interface" cannot have more than one node linked`
        );
        expect(updateMutationResults.data as any).toBeNull();
    });

    test("should not allow a nested create of a second node to an existing one-to-one relationship", async () => {
        const createMutation = `
            mutation createAbces {
                ${testAbce.operations.create}(
                    input: [
                        {
                            interface: {
                                create: {
                                    node: {
                                        ${testChildOne.name}: { name: "childone name nested create" },
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
            contextValue: neo4j.getContextValues(),
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
                            name: "childone name nested create",
                            __typename: testChildOne.name,
                        },
                    },
                ],
            },
        });

        const abcesId = (createMutationResults.data as any)[testAbce.operations.create][testAbce.plural][0].id;

        const updateMutation = `
            mutation {
                ${testAbce.operations.update}(
                    where: { id: "${abcesId}" }
                    create: { interface: { node: { ${testChildOne.name}: { name: "childone anme nested create" } } } }
                ) {
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
            contextValue: neo4j.getContextValues(),
        });

        expect(updateMutationResults.errors).toHaveLength(1);
        expect(updateMutationResults.errors?.[0]?.message).toContain(
            `Relationship field "${testAbce.name}.interface" cannot have more than one node linked`
        );
        expect(updateMutationResults.data as any).toBeNull();
    });
});
