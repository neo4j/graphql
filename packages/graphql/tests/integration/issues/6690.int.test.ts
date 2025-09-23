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

describe("https://github.com/neo4j/graphql/issues/6690", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;
    const secret = "sssh";

    let Ingredient: UniqueType;

    beforeAll(async () => {
        Ingredient = testHelper.createUniqueType("Ingredient");

        typeDefs = /* GraphQL */ `
            type ${Ingredient} @node {
                id: ID! @id
                slug: String!
                name: String!
                # Self-referential taxonomy edge
                parents: [${Ingredient}!]! @relationship(type: "IS_A", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should do the thing", async () => {
        await testHelper.executeCypher(`
            CREATE (:${Ingredient} { id: randomUUID(), slug: "test-food", name: "Test Food" });
        `);

        const mutation = /* GraphQL */ `
            mutation {
                ${Ingredient.operations.create}(
                    input: [
                    {
                        name: "Test Food Child"
                        slug: "test-food-child"
                        parents: {
                            connect: [
                                { where: { node: { slug: { eq: "test-food" } } } }
                            ]
                        }
                    }
                    ]
                ) {
                    ${Ingredient.plural} {
                        slug
                        name
                        parents { slug }
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret);
        const queryResult = await testHelper.executeGraphQLWithToken(mutation, token);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Ingredient.operations.create]: {
                [Ingredient.plural]: [
                    {
                        name: "Test Food Child",
                        slug: "test-food-child",
                        parents: [{ slug: "test-food" }],
                    },
                ],
            },
        });
    });
});
