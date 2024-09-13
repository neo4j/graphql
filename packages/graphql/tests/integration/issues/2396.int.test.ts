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

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2396", () => {
    const testHelper = new TestHelper();

    let PostalCode: UniqueType;
    let Address: UniqueType;
    let Mandate: UniqueType;
    let Valuation: UniqueType;
    let Estate: UniqueType;

    beforeEach(async () => {
        PostalCode = testHelper.createUniqueType("PostalCode");
        Address = testHelper.createUniqueType("Address");
        Mandate = testHelper.createUniqueType("Mandate");
        Valuation = testHelper.createUniqueType("Valuation");
        Estate = testHelper.createUniqueType("Estate");

        const typeDefs = `
            type ${PostalCode} @mutation(operations: [CREATE, UPDATE]) {
                archivedAt: DateTime
                number: String! @unique

                address: [${Address}!]! @relationship(type: "HAS_POSTAL_CODE", direction: IN)
            }

            extend type ${PostalCode} @authorization(filter: [{ where: { node: { archivedAt: null } } }])

            type ${Address} @mutation(operations: [CREATE, UPDATE]) {
                archivedAt: DateTime
                uuid: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                postalCode: ${PostalCode}! @relationship(type: "HAS_POSTAL_CODE", direction: OUT)
            }

            extend type ${Address} @authorization(filter: [{ where: { node: { archivedAt: null } } }])

            type ${Mandate} @mutation(operations: [CREATE, UPDATE]) {
                archivedAt: DateTime
                number: ID! @id @unique # numéro
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                price: Float!

                valuation: ${Valuation}! @relationship(type: "HAS_VALUATION", direction: OUT)
            }

            extend type ${Mandate} @authorization(filter: [{ where: { node: { archivedAt: null } } }])

            type ${Valuation} @mutation(operations: [CREATE, UPDATE]) {
                archivedAt: DateTime
                uuid: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                estate: ${Estate} @relationship(type: "VALUATION_FOR", direction: OUT)
            }

            extend type ${Valuation} @authorization(filter: [{ where: { node: { archivedAt: null } } }])

            enum EstateType {
                APARTMENT
                HOUSE_VILLA
                TOWNHOUSE
                LAND
                PARKING
                BOX
                BUILDING
                COMMERCIAL_PREMISE
                CHALET
                CASTLE
                OFFICE
                BUSINESS_FUND
            }

            type ${Estate} @mutation(operations: [CREATE, UPDATE]) {
                archivedAt: DateTime
                uuid: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                estateType: EstateType!
                area: Float!
                floor: Int

                address: ${Address} @relationship(type: "HAS_ADDRESS", direction: OUT)
            }

            extend type ${Estate} @authorization(filter: [{ where: { node: { archivedAt: null } } }])
        `;

        const input = [
            {
                price: 99000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 75,
                                        estateType: "APARTMENT",
                                        floor: 1,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 200000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 143,
                                        estateType: "APARTMENT",
                                        floor: 2,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 209000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 90,
                                        estateType: "APARTMENT",
                                        floor: 2,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 165000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 60,
                                        estateType: "APARTMENT",
                                        floor: 5,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 96000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 29,
                                        estateType: "APARTMENT",
                                        floor: 6,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 170000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 70,
                                        estateType: "APARTMENT",
                                        floor: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 126000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 45,
                                        estateType: "APARTMENT",
                                        floor: 2,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 170000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 80,
                                        estateType: "APARTMENT",
                                        floor: 2,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 195000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 78,
                                        estateType: "APARTMENT",
                                        floor: 5,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 175000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 78,
                                        estateType: "APARTMENT",
                                        floor: 7,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 84000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 32,
                                        estateType: "APARTMENT",
                                        floor: 2,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 185000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 65,
                                        estateType: "APARTMENT",
                                        floor: 4,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 195000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 50,
                                        estateType: "APARTMENT",
                                        floor: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 415000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 106,
                                        estateType: "APARTMENT",
                                        floor: 4,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 123000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 30,
                                        estateType: "APARTMENT",
                                        floor: 4,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 288000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 87,
                                        estateType: "APARTMENT",
                                        floor: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 139000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 42,
                                        estateType: "APARTMENT",
                                        floor: 4,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 225000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 70,
                                        estateType: "APARTMENT",
                                        floor: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 288000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 122,
                                        estateType: "APARTMENT",
                                        floor: 0,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 130000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 65,
                                        estateType: "APARTMENT",
                                        floor: 2,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 105000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 38,
                                        estateType: "APARTMENT",
                                        floor: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 265000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 100,
                                        estateType: "APARTMENT",
                                        floor: 4,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 279000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 115,
                                        estateType: "APARTMENT",
                                        floor: 5,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 290000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 111,
                                        estateType: "APARTMENT",
                                        floor: 1,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 250000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 77,
                                        estateType: "APARTMENT",
                                        floor: 2,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 210000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 62,
                                        estateType: "APARTMENT",
                                        floor: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            {
                price: 279000,
                valuation: {
                    create: {
                        node: {
                            estate: {
                                create: {
                                    node: {
                                        address: {
                                            create: { node: { postalCode: { create: { node: { number: "13001" } } } } },
                                        },
                                        area: 48,
                                        estateType: "APARTMENT",
                                        floor: 3,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        ];

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: { authorization: { key: "secret" } },
        });

        const query = `
            mutation CreateMandates($input: [${Mandate}CreateInput!]!) {
                ${Mandate.operations.create}(input: $input) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        await testHelper.executeGraphQLWithToken(query, createBearerToken("secret"), {
            variableValues: { input },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return 27 results with no pagination arguments", async () => {
        const query = `
            query Mandates($where: ${Mandate}Where, $options: ${Mandate}Options) {
                ${Mandate.plural}(options: $options, where: $where) {
                    valuation {
                        estate {
                            uuid
                        }
                    }
                }
            }
        `;

        const variableValues = {
            options: {},
            where: {
                price_GTE: 0,
                valuation: {
                    estate: {
                        address: {
                            postalCode: {
                                number_IN: ["13001"],
                            },
                        },
                        area_GTE: 0,
                        estateType_IN: ["APARTMENT"],
                        floor_GTE: 0,
                    },
                },
            },
        };

        const result = await testHelper.executeGraphQLWithToken(query, createBearerToken("secret"), {
            variableValues,
        });

        expect(result.errors).toBeFalsy();
        expect(result.data?.[Mandate.plural]).toHaveLength(27);
    });

    test("should return 20 with limit 20", async () => {
        const query = `
            query Mandates($where: ${Mandate}Where, $options: ${Mandate}Options) {
                ${Mandate.plural}(options: $options, where: $where) {
                    valuation {
                        estate {
                            uuid
                        }
                    }
                }
            }
        `;

        const variableValues = {
            options: { offset: 0, limit: 20 },
            where: {
                price_GTE: 0,
                valuation: {
                    estate: {
                        address: {
                            postalCode: {
                                number_IN: ["13001"],
                            },
                        },
                        area_GTE: 0,
                        estateType_IN: ["APARTMENT"],
                        floor_GTE: 0,
                    },
                },
            },
        };

        const result = await testHelper.executeGraphQLWithToken(query, createBearerToken("secret"), {
            variableValues,
        });

        expect(result.errors).toBeFalsy();
        expect(result.data?.[Mandate.plural]).toHaveLength(20);
    });

    test("should return 7 results with offset 20 limit 40", async () => {
        const query = `
            query Mandates($where: ${Mandate}Where, $options: ${Mandate}Options) {
                ${Mandate.plural}(options: $options, where: $where) {
                    valuation {
                        estate {
                            uuid
                        }
                    }
                }
            }
        `;

        const variableValues = {
            options: {
                offset: 20,
                limit: 40,
            },
            where: {
                price_GTE: 0,
                valuation: {
                    estate: {
                        address: {
                            postalCode: {
                                number_IN: ["13001"],
                            },
                        },
                        area_GTE: 0,
                        estateType_IN: ["APARTMENT"],
                        floor_GTE: 0,
                    },
                },
            },
        };

        const result = await testHelper.executeGraphQLWithToken(query, createBearerToken("secret"), {
            variableValues,
        });

        expect(result.errors).toBeFalsy();
        expect(result.data?.[Mandate.plural]).toHaveLength(7);
    });
});
