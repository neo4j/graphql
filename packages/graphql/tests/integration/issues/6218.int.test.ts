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

describe("https://github.com/neo4j/graphql/issues/6219", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let Continent: UniqueType;
    let Country: UniqueType;

    beforeAll(async () => {
        Continent = testHelper.createUniqueType("Continent");
        Country = testHelper.createUniqueType("Country");

        typeDefs = /* GraphQL */ `
            type ${Continent} @mutation(operations: [CREATE, UPDATE, DELETE]) @node {
                countries: [${Country}!]!
                    @relationship(
                        type: "CONTINENT_HAS_COUNTRY"
                        properties: "ContinentHasCountryProperties"
                        direction: OUT
                    )
                id: Int!
            }

            type ${Country} @mutation(operations: [CREATE, UPDATE, DELETE]) @node {
                code: String!
                continent: [${Continent}!]!
                    @relationship(
                        type: "CONTINENT_HAS_COUNTRY"
                        properties: "ContinentHasCountryProperties"
                        direction: IN
                    )
            }

            type ContinentHasCountryProperties @relationshipProperties {
                _pk: String! @populatedBy(callback: "myCallback", operations: [CREATE, UPDATE])
            }
        `;

        await testHelper.executeCypher(`
            CREATE(:${Continent} { id: 112312312 })
            CREATE(:${Country} { code: "ESS1" })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        myCallback() {
                            return "Test";
                        },
                    },
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("trigger callbacks for relationship properties on create and connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Continent.operations.update}(
                    where: { id: { eq: 112312312 } }
                    update: {
                        countries: [
                            {
                                create: [{ node: { code: "FRS2" } }]
                                connect: [{ where: { node: { code: { eq: "ESS1" } } } }]
                            }
                        ]
                    }
                ) {
                    ${Continent.plural} {
                        id
                        countriesConnection {
                            edges {
                                properties {
                                    _pk
                                }
                                node {
                                    code
                                }
                            }
                        }
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            [Continent.operations.update]: {
                [Continent.plural]: [
                    {
                        id: 112312312,
                        countriesConnection: {
                            edges: expect.toIncludeSameMembers([
                                {
                                    properties: {
                                        _pk: "Test",
                                    },
                                    node: {
                                        code: "FRS2",
                                    },
                                },
                                {
                                    properties: {
                                        _pk: "Test",
                                    },
                                    node: {
                                        code: "ESS1",
                                    },
                                },
                            ]),
                        },
                    },
                ],
            },
        });
    });
});
