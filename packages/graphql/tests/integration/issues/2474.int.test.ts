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

import { int } from "neo4j-driver";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2474", () => {
    const testHelper = new TestHelper();

    let PostalCode: UniqueType;
    let Address: UniqueType;
    let Estate: UniqueType;
    let Mandate: UniqueType;
    let Valuation: UniqueType;

    beforeEach(async () => {
        PostalCode = testHelper.createUniqueType("PostalCode");
        Address = testHelper.createUniqueType("Address");
        Estate = testHelper.createUniqueType("Estate");
        Mandate = testHelper.createUniqueType("Mandate");
        Valuation = testHelper.createUniqueType("Valuation");

        const typeDefs = `
        type ${PostalCode.name} {
            archivedAt: DateTime
            number: String! @unique
            address: [${Address.name}!]! @relationship(type: "HAS_POSTAL_CODE", direction: IN)
          }
          
          union AddressNode = ${Estate.name}
          
          type ${Address.name} {
            archivedAt: DateTime
            uuid: ID! @id @unique
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
            postalCode: ${PostalCode.name} @relationship(type: "HAS_POSTAL_CODE", direction: OUT)
            node: [AddressNode!]! @relationship(type: "HAS_ADDRESS", direction: IN)
          }
          
          type ${Mandate.name} @mutation(operations: [CREATE, UPDATE]) {
            archivedAt: DateTime
            number: ID! @id @unique # numéro
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
            price: Float!
            valuation: ${Valuation.name}! @relationship(type: "HAS_VALUATION", direction: OUT)
          }
          
          type ${Valuation.name} @mutation(operations: [CREATE, UPDATE]) {
            archivedAt: DateTime
            uuid: ID! @id @unique
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
            estate: ${Estate.name}  @relationship(type: "VALUATION_FOR", direction: OUT)
          }
          
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
          
          type ${Estate.name} @mutation(operations: [CREATE, UPDATE]) {
            archivedAt: DateTime
            uuid: ID! @id @unique
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
            estateType: EstateType!
            area: Float!
            floor: Int
            address: ${Address.name} @relationship(type: "HAS_ADDRESS", direction: OUT)
          }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should creates the correct nodes", async () => {
        const query = `
        mutation {
            ${Mandate.operations.create}(
              input: [
                {
                  price: 99000 
                  valuation: {
                    create: {
                      node: {
                        estate: {
                          create: {
                            node: {
                              address: {
                                create: {
                                  node: {
                                    postalCode: { create: { node: { number: "13001" } } }
                                  }
                                }
                              }
                              area: 75
                              estateType: APARTMENT
                              floor: 2
                            }
                          }
                        }
                      }
                    }
                  }
                }
              ]
            ) {
              info {
                nodesCreated
              }
              ${Mandate.plural} {
                price
                valuation {
                  uuid
                  estate {
                    uuid
                    area
                    estateType
                    floor
                    address {
                      uuid
                      postalCode {
                        number
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Mandate.operations.create]: {
                [Mandate.plural]: [
                    {
                        price: 99000,
                        valuation: {
                            uuid: expect.any(String),
                            estate: {
                                uuid: expect.any(String),
                                area: 75,
                                estateType: "APARTMENT",
                                floor: 2,
                                address: {
                                    uuid: expect.any(String),
                                    postalCode: {
                                        number: "13001",
                                    },
                                },
                            },
                        },
                    },
                ],
                info: {
                    nodesCreated: 5,
                },
            },
        });

        const dbResult: any = await testHelper.executeCypher(`
            MATCH (mandate:${Mandate.name})-[:HAS_VALUATION]->(valuation:${Valuation.name})-[:VALUATION_FOR]->(estate:${Estate.name})-[:HAS_ADDRESS]->(address:${Address.name})-[:HAS_POSTAL_CODE]->(postalCode:${PostalCode.name})
            RETURN mandate, valuation, estate, address, postalCode
        `);
        const nodes = Object.fromEntries(
            Object.entries(dbResult.records[0].toObject()).map(([key, value]) => [key, (value as any).properties])
        );

        expect(nodes).toEqual({
            mandate: expect.objectContaining({
                price: 99000,
            }),
            valuation: expect.objectContaining({
                uuid: expect.any(String),
            }),
            estate: expect.objectContaining({
                uuid: expect.any(String),
                area: 75,
                estateType: "APARTMENT",
                floor: int(2),
            }),
            address: expect.objectContaining({
                uuid: expect.any(String),
            }),
            postalCode: expect.objectContaining({
                number: "13001",
            }),
        });
    });

    test("should not fails when used unions or interfaces as input", async () => {
        const query = `
        mutation {
            ${Mandate.operations.create}(
              input: [
                {
                  price: 99000 
                  valuation: {
                    create: {
                      node: {
                        estate: {
                          create: {
                            node: {
                              address: {
                                create: {
                                  node: {
                                    node: { ${Estate.name}: { create: { node: { area: 13.2, estateType: APARTMENT } } } }
                                  }
                                }
                              }
                              area: 75
                              estateType: APARTMENT
                              floor: 2
                            }
                          }
                        }
                      }
                    }
                  }
                }
              ]
            ) {
              info {
                nodesCreated
              }
              ${Mandate.plural} {
                price
                valuation {
                  uuid
                  estate {
                    uuid
                    area
                    estateType
                    floor
                    address {
                      uuid
                      node {
                        ...on ${Estate.name} {
                          area
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Mandate.operations.create]: {
                [Mandate.plural]: [
                    {
                        price: 99000,
                        valuation: {
                            uuid: expect.any(String),
                            estate: {
                                uuid: expect.any(String),
                                area: 75,
                                estateType: "APARTMENT",
                                floor: 2,
                                address: {
                                    uuid: expect.any(String),
                                    node: expect.arrayContaining([
                                        {
                                            area: 13.2,
                                        },
                                        {
                                            area: 75,
                                        },
                                    ]),
                                },
                            },
                        },
                    },
                ],
                info: {
                    nodesCreated: 5,
                },
            },
        });

        const dbResult: any = await testHelper.executeCypher(`
            MATCH (mandate:${Mandate.name})-[:HAS_VALUATION]->(valuation:${Valuation.name})-[:VALUATION_FOR]->(estate:${Estate.name})-[:HAS_ADDRESS]->(address:${Address.name})<-[:HAS_ADDRESS]-(estate2:${Estate.name})
            RETURN mandate, valuation, estate, address, estate2
        `);
        const nodes = Object.fromEntries(
            Object.entries(dbResult.records[0].toObject()).map(([key, value]) => [key, (value as any).properties])
        );

        expect(nodes).toEqual({
            mandate: expect.objectContaining({
                price: 99000,
            }),
            valuation: expect.objectContaining({
                uuid: expect.any(String),
            }),
            estate: expect.objectContaining({
                uuid: expect.any(String),
                area: 75,
                estateType: "APARTMENT",
                floor: int(2),
            }),
            address: expect.objectContaining({
                uuid: expect.any(String),
            }),
            estate2: expect.objectContaining({
                uuid: expect.any(String),
                area: 13.2,
                estateType: "APARTMENT",
            }),
        });
    });
});
