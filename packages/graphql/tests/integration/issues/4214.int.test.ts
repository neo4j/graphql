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

import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { cleanNodes } from "../../utils/clean-nodes";
import { createBearerToken } from "../../utils/create-bearer-token";
import { UniqueType } from "../../utils/graphql-types";
import Neo4jHelper from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/4214", () => {
    let driver: Driver;
    let neo4j: Neo4jHelper;
    let neoSchema: Neo4jGraphQL;
    let session: Session;
    const secret = "secret";

    let User: UniqueType;
    let Family: UniqueType;
    let Person: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4jHelper();
        driver = await neo4j.getDriver();

        session = await neo4j.getSession();

        User = new UniqueType("User");
        Family = new UniqueType("Family");
        Person = new UniqueType("Person");

        const typeDefs = `
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
                store: ID
            }

            type User {
                id: ID! @id @unique
                email: String!
                roles: [String!]!
                store: Store @relationship(type: "WORKS_AT", direction: OUT)
            }

            type Store {
                id: ID! @id @unique
                name: String!
                employees: [User!]! @relationship(type: "WORKS_AT", direction: IN)
                transactions: [Transaction!]! @relationship(type: "TRANSACTION", direction: IN)
            }

            type Transaction {
                id: ID! @id @unique
                store: Store! @relationship(type: "TRANSACTION", direction: OUT)
                type: String!
                items: [TransactionItem!]! @relationship(type: "ITEM_TRANSACTED", direction: IN)
                completed: Boolean
            }

            type TransactionItem {
                transaction: Transaction @relationship(type: "ITEM_TRANSACTED", direction: OUT)
                name: String
                price: Float
                quantity: Int
            }

            extend type Transaction @mutation(operations: [CREATE, UPDATE])
            extend type Transaction @authentication
            extend type Transaction
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
            extend type Transaction
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

            extend type TransactionItem @mutation(operations: [CREATE, UPDATE])
            extend type TransactionItem @authentication
            extend type TransactionItem
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
            extend type TransactionItem
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });

        await session.run(`
        CREATE(u1:User {roles: ["store-owner"], id: "15cbd399-daaf-4579-ad2e-264bc956094c", email: "a@a.com"})
        CREATE(u2:User {roles: ["store-owner"], id: "2856f385-46b4-4136-a608-2d5ad627133c", email: "b@b.com"})
        CREATE(s1:Store {name: "Store", id: "8c8bb4bc-07dc-4808-bb20-f69d447a03b0"})
        CREATE(s2:Store {name: "Other Store", id:"399bb9e2-bfdd-4085-8718-d78828e5875c" })
        
        MERGE (u1)-[:WORKS_AT]->(s1)
        MERGE (u2)-[:WORKS_AT]->(s2)

        CREATE(:Transaction {completed: false, type: "inventory", id: "transactionid"})-[:TRANSACTION]->(s1)
        `);
    });

    afterAll(async () => {
        await cleanNodes(driver, [User, Family, Person]);
        await session.close();
        await driver.close();
    });

    test("should return aggregation of families only created by paid user role", async () => {
        const query = /* GraphQL */ `
            mutation SaveItems {
                createTransactionItems(
                    input: {
                        name: "Milk"
                        price: 5
                        quantity: 1
                        transaction: { connect: { where: { node: { id: "transactionid" } } } }
                    }
                ) {
                    transactionItems {
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

        const token = createBearerToken(secret, {
            id: "15cbd399-daaf-4579-ad2e-264bc956094c",
            email: "a@a.com",
            roles: ["store-owner"],
            store: "8c8bb4bc-07dc-4808-bb20-f69d447a03b0",
        });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(result.errors).toBeUndefined();
    });

    test("should throw forbidden because admin does not have create rights", async () => {
        const query = /* GraphQL */ `
            mutation SaveItems {
                createTransactionItems(
                    input: {
                        name: "Milk"
                        price: 5
                        quantity: 1
                        transaction: { connect: { where: { node: { id: "transactionid" } } } }
                    }
                ) {
                    transactionItems {
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

        const token = createBearerToken(secret, {
            id: "15cbd399-daaf-4579-ad2e-264bc956094c",
            email: "a@a.com",
            roles: ["admin"],
            store: "8c8bb4bc-07dc-4808-bb20-f69d447a03b0",
        });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues({ token }),
        });

        expect(result.errors).toBeDefined();
        expect(result.errors?.[0]?.message).toBe("Forbidden");
    });
});
