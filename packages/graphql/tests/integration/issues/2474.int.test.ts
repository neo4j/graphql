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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType, UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2474", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    let PostalCode: UniqueType;
    let Address: UniqueType;
    let Estate: UniqueType;
    let Mandate: UniqueType;
    let Valuation: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        PostalCode = generateUniqueType("PostalCode");
        Address = generateUniqueType("Address");
        Estate = generateUniqueType("Estate");
        Mandate = generateUniqueType("Mandate");
        Valuation = generateUniqueType("Valuation");

        session = await neo4j.getSession();

        const typeDefs = `
        type ${PostalCode.name} {
            archivedAt: DateTime
            number: String! @id(autogenerate: false)
            address: [${Address.name}!]! @relationship(type: "HAS_POSTAL_CODE", direction: IN)
          }
          
          union AddressNode = ${Estate.name}
          
          type ${Address.name} {
            archivedAt: DateTime
            uuid: ID! @id
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
            postalCode: ${PostalCode.name} @relationship(type: "HAS_POSTAL_CODE", direction: OUT)
            node: [AddressNode!]! @relationship(type: "HAS_ADDRESS", direction: IN)
          }
          
          type ${Mandate.name} @exclude(operations: [DELETE]) {
            archivedAt: DateTime
            number: ID! @id # numéro
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
            price: Float!
            valuation: ${Valuation.name}! @relationship(type: "HAS_VALUATION", direction: OUT)
          }
          
          type ${Valuation.name} @exclude(operations: [DELETE]) {
            archivedAt: DateTime
            uuid: ID! @id
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
          
          type ${Estate.name} @exclude(operations: [DELETE]) {
            archivedAt: DateTime
            uuid: ID! @id
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
            estateType: EstateType!
            area: Float!
            floor: Int
            address: ${Address.name} @relationship(type: "HAS_ADDRESS", direction: OUT)
          }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [PostalCode, Address, Estate, Mandate, Valuation]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should fail", async () => {
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
            }
          }
        `; 

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({});
    });
});
