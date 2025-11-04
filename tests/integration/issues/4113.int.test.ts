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

describe("https://github.com/neo4j/graphql/issues/4113", () => {
    const testHelper = new TestHelper();

    let User: UniqueType;
    let Store: UniqueType;
    let Transaction: UniqueType;
    let TransactionItem: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Store = testHelper.createUniqueType("Store");
        Transaction = testHelper.createUniqueType("Transaction");
        TransactionItem = testHelper.createUniqueType("TransactionItem");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
                store: ID
            }

            type ${User.name} {
                id: ID! @id @unique
                email: String!
                roles: [String!]!
                store: ${Store.name} @relationship(type: "WORKS_AT", direction: OUT)
            }

            type ${Store.name} {
                id: ID! @id @unique
                name: String!
                employees: [${User.name}!]! @relationship(type: "WORKS_AT", direction: IN)
                transactions: [${Transaction.name}!]! @relationship(type: "TRANSACTION", direction: IN)
            }

            type ${Transaction.name} {
                id: ID! @id @unique
                store: ${Store.name}! @relationship(type: "TRANSACTION", direction: OUT)
                type: String!
                items: [${TransactionItem.name}!]! @relationship(type: "ITEM_TRANSACTED", direction: IN)
            }

            type ${TransactionItem.name} {
                transaction: ${Transaction.name} @relationship(type: "ITEM_TRANSACTED", direction: OUT)
                name: String
                price: Float
                quantity: Int
            }

            extend type ${Transaction.name} @authentication
            extend type ${Transaction.name}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE, CREATE_RELATIONSHIP]
                            where: {
                                jwt: { OR: [{ roles_INCLUDES: "store-owner" }, { roles_INCLUDES: "employee" }] }
                                node: { store: { id: "$jwt.store" } }
                            }
                        }
                    ]
                )

            extend type ${TransactionItem.name} @authentication
            extend type ${TransactionItem.name}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE, CREATE_RELATIONSHIP]
                            where: {
                                jwt: { OR: [{ roles_INCLUDES: "store-owner" }, { roles_INCLUDES: "employee" }] }
                                node: { transaction: { store: { id: "$jwt.store" } } }
                            }
                        }
                    ]
                )
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("Create sets default enum value correctly", async () => {
        const setupCreateUsers = `#graphql
            mutation  {
                ${User.operations.create}(input: [
                    {email: "a@a.com", roles: "store-owner"},
                    {email: "b@b.com", roles: "store-owner"}
                ]) {
                    ${User.plural} {
                        id
                    }
                }
            }
      `;
        const gqlResult1 = await testHelper.executeGraphQL(setupCreateUsers);
        expect(gqlResult1.errors).toBeFalsy();

        const setupCreateStores = `#graphql
            mutation {
                ${Store.operations.create}(input: 
                {
                    name: "Store", 
                    employees: {
                    connect: {
                        where: {
                        node: {
                            email: "a@a.com"
                        }
                        }
                    }
                    }
                }
                ) {
                ${Store.plural} {
                    id
                    name
                    employees {
                    email
                    }
                }
                }
            }`;
        const gqlResult2 = await testHelper.executeGraphQL(setupCreateStores);
        expect(gqlResult2.errors).toBeFalsy();
        const storeId = (gqlResult2.data?.[Store.operations.create] as Record<string, any>)[Store.plural][0].id;

        const query = `#graphql
            mutation {
                ${Transaction.operations.create}(input: {
                    type: "sale", 
                    store: {
                        connect: {
                            where: {
                                node: {
                                    name: "Store"
                                }
                            }
                        }
                    }
                    items: {
                        create: [
                            {node: {name: "Milk", price: 2.50, quantity: 3}},
                            {node: {name: "Eggs", price: 5.00, quantity: 1}}
                        ]
                    }
                }
                ) {
                    ${Transaction.plural} {
                        store {
                            name
                        }
                        items {
                            name
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { roles: ["employee"], store: storeId });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Transaction.operations.create]: {
                [Transaction.plural]: [
                    {
                        store: {
                            name: "Store",
                        },
                        items: expect.toIncludeSameMembers([
                            {
                                name: "Milk",
                            },
                            {
                                name: "Eggs",
                            },
                        ]),
                    },
                ],
            },
        });
    });
});

describe("replicates the test for relationship to interface so that multiple refNodes are target", () => {
    const testHelper = new TestHelper();

    let User: UniqueType;
    let Store: UniqueType;
    let Transaction: UniqueType;
    let TransactionItem1: UniqueType;
    let TransactionItem2: UniqueType;

    beforeAll(async () => {
        User = testHelper.createUniqueType("User");
        Store = testHelper.createUniqueType("Store");
        Transaction = testHelper.createUniqueType("Transaction");
        TransactionItem1 = testHelper.createUniqueType("TransactionItem1");
        TransactionItem2 = testHelper.createUniqueType("TransactionItem2");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
                store: ID
            }

            type ${User.name} {
                id: ID! @id @unique
                email: String!
                roles: [String!]!
                store: ${Store.name} @relationship(type: "WORKS_AT", direction: OUT)
            }

            type ${Store.name} {
                id: ID! @id @unique
                name: String!
                employees: [${User.name}!]! @relationship(type: "WORKS_AT", direction: IN)
                transactions: [${Transaction.name}!]! @relationship(type: "TRANSACTION", direction: IN)
            }

            type ${Transaction.name} {
                id: ID! @id @unique
                store: ${Store.name}! @relationship(type: "TRANSACTION", direction: OUT)
                type: String!
                items: [TransactionItemI!]! @relationship(type: "ITEM_TRANSACTED", direction: IN)
            }

            interface TransactionItemI {
                transaction: ${Transaction.name} @declareRelationship
                name: String
                price: Float
                quantity: Int
            }

            type ${TransactionItem1.name} implements TransactionItemI {
                transaction: ${Transaction.name} @relationship(type: "ITEM_TRANSACTED", direction: OUT)
                name: String
                price: Float
                quantity: Int
            }

            type ${TransactionItem2.name} implements TransactionItemI {
                transaction: ${Transaction.name} @relationship(type: "ITEM_TRANSACTED", direction: OUT)
                name: String
                price: Float
                quantity: Int
            }

            extend type ${Transaction.name} @authentication
            extend type ${Transaction.name}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE, CREATE_RELATIONSHIP]
                            where: {
                                jwt: { OR: [{ roles_INCLUDES: "store-owner" }, { roles_INCLUDES: "employee" }] }
                                node: { store: { id: "$jwt.store" } }
                            }
                        }
                    ]
                )

            extend type ${TransactionItem1.name} @authentication
            extend type ${TransactionItem1.name}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE, CREATE_RELATIONSHIP]
                            where: {
                                jwt: { OR: [{ roles_INCLUDES: "store-owner" }, { roles_INCLUDES: "employee" }] }
                                node: { transaction: { store: { id: "$jwt.store" } } }
                            }
                        }
                    ]
                )

            extend type ${TransactionItem2.name} @authentication
            extend type ${TransactionItem2.name}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE, CREATE_RELATIONSHIP]
                            where: {
                                jwt: { OR: [{ roles_INCLUDES: "store-owner" }, { roles_INCLUDES: "employee" }] }
                                node: { transaction: { store: { id: "$jwt.store" } } }
                            }
                        }
                    ]
                )
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Create sets default enum value correctly", async () => {
        const setupCreateUsers = `#graphql
            mutation  {
                ${User.operations.create}(input: [
                    {email: "a@a.com", roles: "store-owner"},
                    {email: "b@b.com", roles: "store-owner"}
                ]) {
                    ${User.plural} {
                        id
                    }
                }
            }
      `;
        const gqlResult1 = await testHelper.executeGraphQL(setupCreateUsers);
        expect(gqlResult1.errors).toBeFalsy();

        const setupCreateStores = `#graphql
            mutation {
                ${Store.operations.create}(input: 
                {
                    name: "Store", 
                    employees: {
                    connect: {
                        where: {
                        node: {
                            email: "a@a.com"
                        }
                        }
                    }
                    }
                }
                ) {
                ${Store.plural} {
                    id
                    name
                    employees {
                    email
                    }
                }
                }
            }`;
        const gqlResult2 = await testHelper.executeGraphQL(setupCreateStores);
        expect(gqlResult2.errors).toBeFalsy();
        const storeId = (gqlResult2.data?.[Store.operations.create] as Record<string, any>)[Store.plural][0].id;

        const query = `#graphql
            mutation {
                ${Transaction.operations.create}(input: {
                    type: "sale", 
                    store: {
                        connect: {
                            where: {
                                node: {
                                    name: "Store"
                                }
                            }
                        }
                    }
                    items: {
                        create: [{ node: {
                            ${TransactionItem1.name}: {name: "Milk", price: 2.50, quantity: 3},
                            ${TransactionItem2.name}: {name: "Eggs", price: 5.00, quantity: 1}
                            }
                        },{ node: {
                            ${TransactionItem1.name}: {name: "Milky", price: 2.50, quantity: 3},
                            ${TransactionItem2.name}: {name: "Eggsy", price: 5.00, quantity: 1}
                            }
                        }]
                    }
                }
                ) {
                    ${Transaction.plural} {
                        store {
                            name
                        }
                        items {
                            name
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { roles: ["employee"], store: storeId });
        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data).toEqual({
            [Transaction.operations.create]: {
                [Transaction.plural]: [
                    {
                        store: {
                            name: "Store",
                        },
                        items: expect.toIncludeSameMembers([
                            {
                                name: "Milk",
                            },
                            {
                                name: "Eggs",
                            },
                            {
                                name: "Milky",
                            },
                            {
                                name: "Eggsy",
                            },
                        ]),
                    },
                ],
            },
        });
    });
});
