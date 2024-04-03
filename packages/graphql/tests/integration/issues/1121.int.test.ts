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

describe("https://github.com/neo4j/graphql/issues/1121", () => {
    const testHelper = new TestHelper();

    let Food: UniqueType;
    let Banana: UniqueType;
    let Sugar: UniqueType;
    let Syrup: UniqueType;

    beforeAll(async () => {
        Food = testHelper.createUniqueType("Food");
        Banana = testHelper.createUniqueType("Banana");
        Sugar = testHelper.createUniqueType("Sugar");
        Syrup = testHelper.createUniqueType("Syrup");

        const typeDefs = `
            type ${Food.name} {
                name: String
                ingredients_interface: [Ingredient_Interface!]!
                    @relationship(type: "has_Ingredient_Interface", direction: OUT)
                ingredients_union: [Ingredient_Union!]! @relationship(type: "has_Ingredient_Union", direction: OUT)
            }

            interface Ingredient_Interface {
                id: ID!
                name: String
                qty_ozs: Float
            }

            type ${Banana.name} implements Ingredient_Interface {
                id: ID! @id @unique
                name: String
                sweetness: String
                qty_ozs: Float
            }

            union Ingredient_Union = ${Sugar.name} | ${Syrup.name}

            type ${Sugar.name} {
                id: ID! @id @unique
                name: String
                sweetness: String
                qty_ozs: Float
            }

            type ${Syrup.name} {
                id: ID! @id @unique
                name: String
                sweetness: String
                qty_ozs: Float
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("error should not be thrown", async () => {
        const mutation = `
            mutation {
                ${Food.operations.create}(
                    input: [
                        {
                            name: "Cake"
                            ingredients_interface: {
                                create: [{ node: { ${Banana.name}: { name: "Golden Banana", qty_ozs: 100 } } }]
                            }
                            ingredients_union: {
                                ${Sugar.name}: {
                                    create: [
                                        { node: { name: "Simple Sugar", qty_ozs: 100 } }
                                        { node: { name: "Brown Sugar", qty_ozs: 10 } }
                                    ]
                                }
                                ${Syrup.name}: { create: { node: { name: "Maple Syrup", qty_ozs: 100 } } }
                            }
                        }
                    ]
                ) {
                    ${Food.plural} {
                        name
                    }
                }
            }
        `;

        const mutationResult = await testHelper.executeGraphQL(mutation);
        expect(mutationResult.errors).toBeUndefined();

        const query = `
            {
                ${Food.plural}(
                    where: { ingredients_interfaceConnection_ALL: { node: { qty_ozs_GT: 1  } } }
                ) {
                    name
                    ingredients_interface {
                        name
                        ... on ${Banana.name} {
                            qty_ozs
                        }
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Food.plural]: [
                {
                    ingredients_interface: [
                        {
                            name: "Golden Banana",
                            qty_ozs: 100,
                        },
                    ],
                    name: "Cake",
                },
            ],
        });
    });
});
