/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1414", () => {
    let testProduct: UniqueType;
    let testProgrammeItem: UniqueType;

    let counter = 0;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        testProduct = testHelper.createUniqueType("Product");
        testProgrammeItem = testHelper.createUniqueType("ProgrammeItem");

        const typeDefs = `
            interface ${testProduct.name} {
                id: ID!
                productTitle: String!
            }

            type ${testProgrammeItem.name} implements ${testProduct.name} @node {
                id: ID! @populatedBy(operations: [CREATE], callback: "nanoid")
                productTitle: String!
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        nanoid: () => {
                            const id = `nanoid${counter}`;
                            counter += 1;
                            return id;
                        },
                    },
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("callbacks should only be called for specified operations", async () => {
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

        const updateProgrammeItems = /* GraphQL */ `
            mutation {
                ${testProgrammeItem.operations.update}(where: { id_EQ: "nanoid0" }, update: { productTitle_SET: "TestPI2" }) {
                    ${testProgrammeItem.plural} {
                        id
                        productTitle
                    }
                }
            }
        `;

        const createProgrammeItemsResults = await testHelper.executeGraphQL(createProgrammeItems);
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

        const updateProgrammeItemsResults = await testHelper.executeGraphQL(updateProgrammeItems);
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
});
