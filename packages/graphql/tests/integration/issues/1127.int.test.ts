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

describe("https://github.com/neo4j/graphql/issues/1127", () => {
    let customerType: UniqueType;
    let addressType: UniqueType;
    let postalCodeType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        customerType = testHelper.createUniqueType("Customer");
        addressType = testHelper.createUniqueType("Address");
        postalCodeType = testHelper.createUniqueType("PostalCode");

        const typeDefs = `
            type ${customerType.name} {
                uuid: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                address: ${addressType.name}! @relationship(type: "TEST_HAS_ADDRESS", direction: OUT)
            }

            type ${addressType.name} {
                uuid: ID! @id @unique
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])

                postalCode: ${postalCodeType.name}! @relationship(type: "TEST_HAS_POSTAL_CODE", direction: OUT)
            }

            type ${postalCodeType.name} {
                number: String! @unique
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
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

        const res = await testHelper.executeGraphQL(query, {
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
