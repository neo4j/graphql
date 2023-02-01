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
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1121", () => {
    let schema: GraphQLSchema;
    let neo4j: Neo4j;
    let driver: Driver;
    let session: Session;

    const Food = new UniqueType("Food");
    const Banana = new UniqueType("Banana");
    const Sugar = new UniqueType("Sugar");
    const Syrup = new UniqueType("Syrup");

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = `
            type ${Food.name} {
                name: String
                ingredients_interface: [Ingredient_Interface!]!
                    @relationship(type: "has_Ingredient_Interface", direction: OUT)
                ingredients_union: [Ingredient_Union!]! @relationship(type: "has_Ingredient_Union", direction: OUT)
            }

            interface Ingredient_Interface {
                id: ID! @id(autogenerate: true)
                name: String
            }

            type ${Banana.name} implements Ingredient_Interface {
                id: ID! @id(autogenerate: true)
                name: String
                sweetness: String
                qty_ozs: Float
            }

            union Ingredient_Union = ${Sugar.name} | ${Syrup.name}

            type ${Sugar.name} {
                id: ID! @id(autogenerate: true)
                name: String
                sweetness: String
                qty_ozs: Float
            }

            type ${Syrup.name} {
                id: ID! @id(autogenerate: true)
                name: String
                sweetness: String
                qty_ozs: Float
            }
        `;

        session = await neo4j.getSession();

        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
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

        const mutationResult = await graphqlQuery(mutation);
        expect(mutationResult.errors).toBeUndefined();

        const query = `
            {
                ${Food.plural}(
                    where: { ingredients_interfaceConnection_ALL: { node: { _on: { ${Banana.name}: { qty_ozs_GT: 1 } } } } }
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

        const queryResult = await graphqlQuery(query);
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
