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

import { graphql, GraphQLSchema } from "graphql";
import { Driver } from "neo4j-driver";
import neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { generateUniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1127", () => {
    const customerType = generateUniqueType("Customer");
    const addressType = generateUniqueType("Address");
    const postalCodeType = generateUniqueType("PostalCode");

    let schema: GraphQLSchema;
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();

        const typeDefs = `
            type ${customerType.name} {
                uuid: ID! @id
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                address: ${addressType.name}! @relationship(type: "TEST_HAS_ADDRESS", direction: OUT)
            }

            type ${addressType.name} {
                uuid: ID! @id
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                postalCode: ${postalCodeType.name}! @relationship(type: "TEST_HAS_POSTAL_CODE", direction: OUT)
            }

            type ${postalCodeType.name} {
                number: String! @unique
            }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should be able to connectOrCreate under nested create", async () => {
        const query = `
            mutation CreateTestCustomers($input: [${customerType.name}CreateInput!]!) {
                ${customerType.operations.create}(input: $input) {
                    info {
                        nodesCreated
                        relationshipsCreated
                    }
                    ${customerType.plural} {
                        address {
                            postalCode {
                                number
                            }
                        }
                    }
                }
            }
        `;

        const res = await graphql({
            schema,
            source: query,
            contextValue: {
                driver,
            },
            variableValues: {
                input: [
                    {
                        address: {
                            create: {
                                node: {
                                    postalCode: {
                                        connectOrCreate: {
                                            where: {
                                                node: {
                                                    number: "00001",
                                                },
                                            },
                                            onCreate: {
                                                node: {
                                                    number: "00001",
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                ],
            },
        });

        expect(res.errors).toBeUndefined();

        expect(res.data).toEqual({
            [customerType.operations.create]: {
                info: {
                    nodesCreated: 3,
                    relationshipsCreated: 2,
                },
                [customerType.plural]: [
                    {
                        address: {
                            postalCode: {
                                number: "00001",
                            },
                        },
                    },
                ],
            },
        });
    });
});
