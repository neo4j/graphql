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

            type ${testProgrammeItem.name} implements ${testProduct.name} {
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
