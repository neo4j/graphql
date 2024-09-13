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

import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4214", () => {
    const secret = "sssh!";
    let neoSchema: Neo4jGraphQL;

    const typeDefs = /* GraphQL */ `
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
                            OR: [{ jwt: { roles_INCLUDES: "store-owner" } }, { jwt: { roles_INCLUDES: "employee" } }]
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
                            OR: [{ jwt: { roles_INCLUDES: "store-owner" } }, { jwt: { roles_INCLUDES: "employee" } }]
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
                            OR: [{ jwt: { roles_INCLUDES: "store-owner" } }, { jwt: { roles_INCLUDES: "employee" } }]
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
                            OR: [{ jwt: { roles_INCLUDES: "store-owner" } }, { jwt: { roles_INCLUDES: "employee" } }]
                            node: { transaction: { store: { id: "$jwt.store" } } }
                        }
                    }
                ]
            )
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("should include checks for auth jwt param is not null", async () => {
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

        const token = createBearerToken(secret, { sub: "michel", roles: ["store-owner"] });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:TransactionItem)
            SET this0.name = $this0_name
            SET this0.price = $this0_price
            SET this0.quantity = $this0_quantity
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_transaction_connect0_node:Transaction)
            OPTIONAL MATCH (this0_transaction_connect0_node)-[:TRANSACTION]->(authorization_0_before_this0:Store)
            WITH *, count(authorization_0_before_this0) AS storeCount
            OPTIONAL MATCH (this0_transaction_connect0_node)-[:TRANSACTION]->(authorization_0_before_this1:Store)
            WITH *, count(authorization_0_before_this1) AS storeCount
            WITH *
            	WHERE this0_transaction_connect0_node.id = $this0_transaction_connect0_node_param0 AND ((($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization_0_before_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $authorization_0_before_param3 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $authorization_0_before_param4 IN $jwt.roles)) AND (storeCount <> 0 AND ($jwt.store IS NOT NULL AND authorization_0_before_this0.id = $jwt.store)))) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $authorization_0_before_param5 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $authorization_0_before_param6 IN $jwt.roles)) AND (storeCount <> 0 AND ($jwt.store IS NOT NULL AND authorization_0_before_this1.id = $jwt.store))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	CALL {
            		WITH *
            		WITH collect(this0_transaction_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_transaction_connect0_node
            			MERGE (this0)-[:ITEM_TRANSACTED]->(this0_transaction_connect0_node)
            		}
            	}
            WITH this0, this0_transaction_connect0_node
            WITH *
            CALL {
                WITH this0
                MATCH (this0)-[:ITEM_TRANSACTED]->(authorization_0_after_this2:Transaction)
                OPTIONAL MATCH (authorization_0_after_this2)-[:TRANSACTION]->(authorization_0_after_this3:Store)
                WITH *, count(authorization_0_after_this3) AS storeCount
                WITH *
                WHERE (storeCount <> 0 AND ($jwt.store IS NOT NULL AND authorization_0_after_this3.id = $jwt.store))
                RETURN count(authorization_0_after_this2) = 1 AS authorization_0_after_var0
            }
            OPTIONAL MATCH (this0_transaction_connect0_node)-[:TRANSACTION]->(authorization_0_after_this1:Store)
            WITH *, count(authorization_0_after_this1) AS storeCount
            WITH *
            WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $authorization_0_after_param2 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $authorization_0_after_param3 IN $jwt.roles)) AND authorization_0_after_var0 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $authorization_0_after_param4 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $authorization_0_after_param5 IN $jwt.roles)) AND (storeCount <> 0 AND ($jwt.store IS NOT NULL AND authorization_0_after_this1.id = $jwt.store))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this0_transaction_connect_Transaction0
            }
            WITH *
            CALL {
            	WITH this0
            	MATCH (this0)-[this0_transaction_Transaction_unique:ITEM_TRANSACTED]->(:Transaction)
            	WITH count(this0_transaction_Transaction_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDTransactionItem.transaction must be less than or equal to one', [0])
            	RETURN c AS this0_transaction_Transaction_unique_ignored
            }
            WITH *
            CALL {
                WITH this0
                MATCH (this0)-[:ITEM_TRANSACTED]->(authorization_0_after_this1:Transaction)
                OPTIONAL MATCH (authorization_0_after_this1)-[:TRANSACTION]->(authorization_0_after_this2:Store)
                WITH *, count(authorization_0_after_this2) AS storeCount
                WITH *
                WHERE (storeCount <> 0 AND ($jwt.store IS NOT NULL AND authorization_0_after_this2.id = $jwt.store))
                RETURN count(authorization_0_after_this1) = 1 AS authorization_0_after_var0
            }
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $authorization_0_after_param2 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $authorization_0_after_param3 IN $jwt.roles)) AND authorization_0_after_var0 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0
            }
            CALL {
                WITH this0
                WITH *
                CALL {
                    WITH this0
                    MATCH (this0)-[create_this0:ITEM_TRANSACTED]->(create_this1:Transaction)
                    OPTIONAL MATCH (create_this1)-[:TRANSACTION]->(create_this2:Store)
                    WITH *, count(create_this2) AS storeCount
                    WITH *
                    WHERE (($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param2 IN $jwt.roles)) OR ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $create_param3 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $create_param4 IN $jwt.roles)) AND (storeCount <> 0 AND ($jwt.store IS NOT NULL AND create_this2.id = $jwt.store))))
                    CALL {
                        WITH create_this1
                        MATCH (create_this1)-[create_this3:TRANSACTION]->(create_this4:Store)
                        WITH create_this4 { .name } AS create_this4
                        RETURN head(collect(create_this4)) AS create_var5
                    }
                    WITH create_this1 { .id, store: create_var5 } AS create_this1
                    RETURN head(collect(create_this1)) AS create_var6
                }
                RETURN this0 { .name, transaction: create_var6 } AS create_var7
            }
            RETURN [create_var7] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"store-owner\\"
                    ],
                    \\"sub\\": \\"michel\\"
                },
                \\"create_param2\\": \\"admin\\",
                \\"create_param3\\": \\"store-owner\\",
                \\"create_param4\\": \\"employee\\",
                \\"this0_name\\": \\"Milk\\",
                \\"this0_price\\": 5,
                \\"this0_quantity\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"this0_transaction_connect0_node_param0\\": \\"transactionid\\",
                \\"authorization_0_before_param2\\": \\"admin\\",
                \\"authorization_0_before_param3\\": \\"store-owner\\",
                \\"authorization_0_before_param4\\": \\"employee\\",
                \\"authorization_0_before_param5\\": \\"store-owner\\",
                \\"authorization_0_before_param6\\": \\"employee\\",
                \\"authorization_0_after_param2\\": \\"store-owner\\",
                \\"authorization_0_after_param3\\": \\"employee\\",
                \\"authorization_0_after_param4\\": \\"store-owner\\",
                \\"authorization_0_after_param5\\": \\"employee\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
