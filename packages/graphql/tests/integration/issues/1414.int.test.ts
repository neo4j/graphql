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
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1414", () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const warningsSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    let testProduct: UniqueType;
    let testProgrammeItem: UniqueType;
    let counter: number;
    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeEach(async () => {
        warningsSpy.mockClear()
        testProduct = generateUniqueType("Product");
        testProgrammeItem = generateUniqueType("ProgrammeItem");
        counter = 0;
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterEach(async () => {
        await driver.close();
    });

    test("callbacks should only be called for specified operations", async () => {
        const typeDefs = `
            interface ${testProduct.name} {
                id: ID! @callback(operations: [CREATE], name: "nanoid")
                productTitle: String!
            }

            type ${testProgrammeItem.name} implements ${testProduct.name} {
                id: ID!
                productTitle: String!
            }
        `;
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            config: {
                callbacks: {
                    nanoid: () => {
                        const id = `nanoid${counter}`;
                        counter += 1;
                        return id;
                    },
                },
            },
        });
        schema = await neoGraphql.getSchema();

        const createProgrammeItems = `
            mutation {
                ${testProgrammeItem.operations.create}(input: { productTitle: "TestPI" }) {
                    ${testProgrammeItem.plural} {
                        id
                        productTitle
                    }
                }
            }
        `;

        const updateProgrammeItems = `
            mutation {
                ${testProgrammeItem.operations.update}(where: { id: "nanoid0" }, update: { productTitle: "TestPI2" }) {
                    ${testProgrammeItem.plural} {
                        id
                        productTitle
                    }
                }
            }
        `;

        const createProgrammeItemsResults = await graphqlQuery(createProgrammeItems);
        expect(createProgrammeItemsResults.errors).toBeUndefined();
        expect(createProgrammeItemsResults.data as any).toEqual({
            [testProgrammeItem.operations.create]: {
                [testProgrammeItem.plural]: [
                    {
                        id: "nanoid0",
                        productTitle: "TestPI",
                    },
                ],
            },
        });

        const updateProgrammeItemsResults = await graphqlQuery(updateProgrammeItems);
        expect(updateProgrammeItemsResults.errors).toBeUndefined();
        expect(updateProgrammeItemsResults.data as any).toEqual({
            [testProgrammeItem.operations.update]: {
                [testProgrammeItem.plural]: [
                    {
                        id: "nanoid0",
                        productTitle: "TestPI2",
                    },
                ],
            },
        });
    });
    test("callbacks should only be called for specified operations - deprecated callback directive", async () => {
        const typeDefs = `
            interface ${testProduct.name} {
                id: ID! @callback(operations: [CREATE], name: "nanoid")
                productTitle: String!
            }

            type ${testProgrammeItem.name} implements ${testProduct.name} {
                id: ID!
                productTitle: String!
            }
        `;
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            config: {
                callbacks: {
                    nanoid: () => {
                        const id = `nanoid${counter}`;
                        counter += 1;
                        return id;
                    },
                },
            },
        });
        schema = await neoGraphql.getSchema();

        const createProgrammeItems = `
            mutation {
                ${testProgrammeItem.operations.create}(input: { productTitle: "TestPI" }) {
                    ${testProgrammeItem.plural} {
                        id
                        productTitle
                    }
                }
            }
        `;

        const updateProgrammeItems = `
            mutation {
                ${testProgrammeItem.operations.update}(where: { id: "nanoid0" }, update: { productTitle: "TestPI2" }) {
                    ${testProgrammeItem.plural} {
                        id
                        productTitle
                    }
                }
            }
        `;

        const createProgrammeItemsResults = await graphqlQuery(createProgrammeItems);
        expect(createProgrammeItemsResults.errors).toBeUndefined();
        expect(createProgrammeItemsResults.data as any).toEqual({
            [testProgrammeItem.operations.create]: {
                [testProgrammeItem.plural]: [
                    {
                        id: "nanoid0",
                        productTitle: "TestPI",
                    },
                ],
            },
        });

        const updateProgrammeItemsResults = await graphqlQuery(updateProgrammeItems);
        expect(updateProgrammeItemsResults.errors).toBeUndefined();
        expect(updateProgrammeItemsResults.data as any).toEqual({
            [testProgrammeItem.operations.update]: {
                [testProgrammeItem.plural]: [
                    {
                        id: "nanoid0",
                        productTitle: "TestPI2",
                    },
                ],
            },
        });
        expect(warningsSpy).toHaveBeenCalledWith("The @callback directive has been deprecated and will be removed in version 4.0. Please use @populatedBy instead.");
    });
    test("callbacks should only be called for specified operations - populatedBy and deprecated callback directives", async () => {
        const typeDefs = `
            interface ${testProduct.name} {
                id: ID! @callback(operations: [CREATE], name: "nanoid")
                populatedById: ID! @populatedBy(callback: "nanoid", operations: [CREATE])
                productTitle: String!
            }

            type ${testProgrammeItem.name} implements ${testProduct.name} {
                id: ID!
                populatedById: ID!
                productTitle: String!
            }
        `;
        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
            config: {
                callbacks: {
                    nanoid: () => {
                        const id = `nanoid${counter}`;
                        counter += 1;
                        return id;
                    },
                },
            },
        });
        schema = await neoGraphql.getSchema();

        const createProgrammeItems = `
            mutation {
                ${testProgrammeItem.operations.create}(input: { productTitle: "TestPI" }) {
                    ${testProgrammeItem.plural} {
                        id
                        populatedById
                        productTitle
                    }
                }
            }
        `;

        const updateProgrammeItems = `
            mutation {
                ${testProgrammeItem.operations.update}(where: { id: "nanoid0" }, update: { productTitle: "TestPI2" }) {
                    ${testProgrammeItem.plural} {
                        id
                        populatedById
                        productTitle
                    }
                }
            }
        `;

        const createProgrammeItemsResults = await graphqlQuery(createProgrammeItems);
        expect(createProgrammeItemsResults.errors).toBeUndefined();
        expect(createProgrammeItemsResults.data as any).toEqual({
            [testProgrammeItem.operations.create]: {
                [testProgrammeItem.plural]: [
                    {
                        id: "nanoid0",
                        populatedById: "nanoid1",
                        productTitle: "TestPI",
                    },
                ],
            },
        });

        const updateProgrammeItemsResults = await graphqlQuery(updateProgrammeItems);
        expect(updateProgrammeItemsResults.errors).toBeUndefined();
        expect(updateProgrammeItemsResults.data as any).toEqual({
            [testProgrammeItem.operations.update]: {
                [testProgrammeItem.plural]: [
                    {
                        id: "nanoid0",
                        populatedById: "nanoid1",
                        productTitle: "TestPI2",
                    },
                ],
            },
        });
        expect(warningsSpy).toHaveBeenCalledWith("The @callback directive has been deprecated and will be removed in version 4.0. Please use @populatedBy instead.");
    });
});
