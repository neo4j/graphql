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
import Neo4jHelper from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import { createBearerToken } from "../../utils/create-bearer-token";

describe("https://github.com/neo4j/graphql/issues/4113", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let session: Session;

    let neoSchema: Neo4jGraphQL;

    const User = new UniqueType("User");
    const Store = new UniqueType("Store");
    const Transaction = new UniqueType("Transaction");
    const TransactionItem = new UniqueType("TransactionItem");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });
    afterAll(async () => {
        await driver.close();
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
        const gqlResult1 = await graphql({
            schema: await neoSchema.getSchema(),
            source: setupCreateUsers,
            contextValue: neo4j.getContextValues(),
        });
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
        const gqlResult2 = await graphql({
            schema: await neoSchema.getSchema(),
            source: setupCreateStores,
            contextValue: neo4j.getContextValues(),
        });
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
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

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
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let session: Session;

    let neoSchema: Neo4jGraphQL;

    const User = new UniqueType("User");
    const Store = new UniqueType("Store");
    const Transaction = new UniqueType("Transaction");
    const TransactionItem1 = new UniqueType("TransactionItem1");
    const TransactionItem2 = new UniqueType("TransactionItem2");

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
    });
    afterAll(async () => {
        await driver.close();
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
        const gqlResult1 = await graphql({
            schema: await neoSchema.getSchema(),
            source: setupCreateUsers,
            contextValue: neo4j.getContextValues(),
        });
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
        const gqlResult2 = await graphql({
            schema: await neoSchema.getSchema(),
            source: setupCreateStores,
            contextValue: neo4j.getContextValues(),
        });
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
        const gqlResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

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
