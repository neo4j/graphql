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

describe("https://github.com/neo4j/graphql/issues/4214", () => {
    const testHelper = new TestHelper();
    const secret = "secret";

    let User: UniqueType;
    let Store: UniqueType;
    let Transaction: UniqueType;
    let TransactionItem: UniqueType;

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Store = testHelper.createUniqueType("Store");
        Transaction = testHelper.createUniqueType("Transaction");
        TransactionItem = testHelper.createUniqueType("TransactionItem");

        const typeDefs = `
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
                store: ID
            }

            type ${User} {
                id: ID! @id @unique
                email: String!
                roles: [String!]!
                store: ${Store} @relationship(type: "WORKS_AT", direction: OUT)
            }

            type ${Store} {
                id: ID! @id @unique
                name: String!
                employees: [${User}!]! @relationship(type: "WORKS_AT", direction: IN)
                transactions: [${Transaction}!]! @relationship(type: "TRANSACTION", direction: IN)
            }

            type ${Transaction} {
                id: ID! @id @unique
                store: ${Store}! @relationship(type: "TRANSACTION", direction: OUT)
                type: String!
                items: [${TransactionItem}!]! @relationship(type: "ITEM_TRANSACTED", direction: IN)
                completed: Boolean
            }

            type ${TransactionItem} {
                transaction: ${Transaction} @relationship(type: "ITEM_TRANSACTED", direction: OUT)
                name: String
                price: Float
                quantity: Int
            }

            extend type ${Transaction} @mutation(operations: [CREATE, UPDATE])
            extend type ${Transaction} @authentication
            extend type ${Transaction}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE, CREATE_RELATIONSHIP]
                            where: {
                                OR: [
                                    { jwt: { roles_INCLUDES: "store-owner" } }
                                    { jwt: { roles_INCLUDES: "employee" } }
                                ]
                                node: { store: { id: "$jwt.store" } }
                            }
                        }
                    ]
                )
            extend type ${Transaction}
                @authorization(
                    filter: [
                        { where: { jwt: { roles_INCLUDES: "admin" } } }
                        {
                            where: {
                                OR: [
                                    { jwt: { roles_INCLUDES: "store-owner" } }
                                    { jwt: { roles_INCLUDES: "employee" } }
                                ]
                                node: { store: { id: "$jwt.store" } }
                            }
                        }
                    ]
                )

            extend type ${TransactionItem} @mutation(operations: [CREATE, UPDATE])
            extend type ${TransactionItem} @authentication
            extend type ${TransactionItem}
                @authorization(
                    validate: [
                        {
                            operations: [CREATE, CREATE_RELATIONSHIP]
                            where: {
                                OR: [
                                    { jwt: { roles_INCLUDES: "store-owner" } }
                                    { jwt: { roles_INCLUDES: "employee" } }
                                ]
                                node: { transaction: { store: { id: "$jwt.store" } } }
                            }
                        }
                    ]
                )
            extend type ${TransactionItem}
                @authorization(
                    filter: [
                        { where: { jwt: { roles_INCLUDES: "admin" } } }
                        {
                            where: {
                                OR: [
                                    { jwt: { roles_INCLUDES: "store-owner" } }
                                    { jwt: { roles_INCLUDES: "employee" } }
                                ]
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
                    key: secret,
                },
            },
        });

        await testHelper.executeCypher(`
        CREATE(u1:${User} {roles: ["store-owner"], id: "15cbd399-daaf-4579-ad2e-264bc956094c", email: "a@a.com"})
        CREATE(u2:${User} {roles: ["store-owner"], id: "2856f385-46b4-4136-a608-2d5ad627133c", email: "b@b.com"})
        CREATE(s1:${Store} {name: "Store", id: "8c8bb4bc-07dc-4808-bb20-f69d447a03b0"})
        CREATE(s2:${Store} {name: "Other Store", id:"399bb9e2-bfdd-4085-8718-d78828e5875c" })
        
        MERGE (u1)-[:WORKS_AT]->(s1)
        MERGE (u2)-[:WORKS_AT]->(s2)

        CREATE(:${Transaction} {completed: false, type: "inventory", id: "transactionid"})-[:TRANSACTION]->(s1)
        `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return aggregation of families only created by paid user role", async () => {
        const query = /* GraphQL */ `
            mutation SaveItems {
                ${TransactionItem.operations.create}(
                    input: {
                        name: "Milk"
                        price: 5
                        quantity: 1
                        transaction: { connect: { where: { node: { id: "transactionid" } } } }
                    }
                ) {
                    ${TransactionItem.plural} {
                        name
                        transaction {
                            id
                            store {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, {
            id: "15cbd399-daaf-4579-ad2e-264bc956094c",
            email: "a@a.com",
            roles: ["store-owner"],
            store: "8c8bb4bc-07dc-4808-bb20-f69d447a03b0",
        });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeUndefined();
    });

    test("should throw forbidden because admin does not have create rights", async () => {
        const query = /* GraphQL */ `
            mutation SaveItems {
                ${TransactionItem.operations.create}(
                    input: {
                        name: "Milk"
                        price: 5
                        quantity: 1
                        transaction: { connect: { where: { node: { id: "transactionid" } } } }
                    }
                ) {
                    ${TransactionItem.plural} {
                        name
                        transaction {
                            id
                            store {
                                name
                            }
                        }
                    }
                }
            }
        `;

        const token = testHelper.createBearerToken(secret, {
            id: "15cbd399-daaf-4579-ad2e-264bc956094c",
            email: "a@a.com",
            roles: ["admin"],
            store: "8c8bb4bc-07dc-4808-bb20-f69d447a03b0",
        });

        const result = await testHelper.executeGraphQLWithToken(query, token);

        expect(result.errors).toBeDefined();
        expect(result.errors?.[0]?.message).toBe("Forbidden");
    });
});
