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

        type User @node {
            id: ID! @id
            email: String!
            roles: [String!]!
            store: [Store!]! @relationship(type: "WORKS_AT", direction: OUT)
        }

        type Store @node {
            id: ID! @id
            name: String!
            employees: [User!]! @relationship(type: "WORKS_AT", direction: IN)
            transactions: [Transaction!]! @relationship(type: "TRANSACTION", direction: IN)
        }

        type Transaction @node {
            id: ID! @id
            store: [Store!]! @relationship(type: "TRANSACTION", direction: OUT)
            type: String!
            items: [TransactionItem!]! @relationship(type: "ITEM_TRANSACTED", direction: IN)
            completed: Boolean
        }

        type TransactionItem @node {
            transaction: [Transaction!]! @relationship(type: "ITEM_TRANSACTED", direction: OUT)
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
                                { jwt: { roles: { includes: "store-owner" } } }
                                { jwt: { roles: { includes: "employee" } } }
                            ]
                            node: { store: { some: { id: { eq: "$jwt.store" } } } }
                        }
                    }
                ]
            )
        extend type Transaction
            @authorization(
                filter: [
                    { where: { jwt: { roles: { includes: "admin" } } } }
                    {
                        where: {
                            OR: [
                                { jwt: { roles: { includes: "store-owner" } } }
                                { jwt: { roles: { includes: "employee" } } }
                            ]
                            node: { store: { some: { id: { eq: "$jwt.store" } } } }
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
                                { jwt: { roles: { includes: "store-owner" } } }
                                { jwt: { roles: { includes: "employee" } } }
                            ]
                            node: { transaction: { some: { store: { some: { id: { eq: "$jwt.store" } } } } } }
                        }
                    }
                ]
            )
        extend type TransactionItem
            @authorization(
                filter: [
                    { where: { jwt: { roles: { includes: "admin" } } } }
                    {
                        where: {
                            OR: [
                                { jwt: { roles: { includes: "store-owner" } } }
                                { jwt: { roles: { includes: "employee" } } }
                            ]
                            node: { transaction: { some: { store: { some: { id: { eq: "$jwt.store" } } } } } }
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
                        transaction: { connect: { where: { node: { id: { eq: "transactionid" } } } } }
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
            "CYPHER 5
            CALL {
                CREATE (this0:TransactionItem)
                SET
                    this0.name = $param0,
                    this0.price = $param1,
                    this0.quantity = $param2
                WITH *
                CALL (this0) {
                    MATCH (this1:Transaction)
                    WHERE ((($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param5 IN $jwt.roles)) OR ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $param6 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $param7 IN $jwt.roles)) AND EXISTS {
                        MATCH (this1)-[:TRANSACTION]->(this2:Store)
                        WHERE ($jwt.store IS NOT NULL AND this2.id = $jwt.store)
                    })) AND this1.id = $param8)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $param9 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $param10 IN $jwt.roles)) AND EXISTS {
                        MATCH (this1)-[:TRANSACTION]->(this3:Store)
                        WHERE ($jwt.store IS NOT NULL AND this3.id = $jwt.store)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CREATE (this0)-[this4:ITEM_TRANSACTED]->(this1)
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $param11 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $param12 IN $jwt.roles)) AND EXISTS {
                        MATCH (this1)-[:TRANSACTION]->(this5:Store)
                        WHERE ($jwt.store IS NOT NULL AND this5.id = $jwt.store)
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $param13 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $param14 IN $jwt.roles)) AND EXISTS {
                        MATCH (this0)-[:ITEM_TRANSACTED]->(this6:Transaction)
                        WHERE EXISTS {
                            MATCH (this6)-[:TRANSACTION]->(this7:Store)
                            WHERE ($jwt.store IS NOT NULL AND this7.id = $jwt.store)
                        }
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
                WITH *
                CALL (*) {
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $param15 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $param16 IN $jwt.roles)) AND EXISTS {
                        MATCH (this0)-[:ITEM_TRANSACTED]->(this8:Transaction)
                        WHERE EXISTS {
                            MATCH (this8)-[:TRANSACTION]->(this9:Store)
                            WHERE ($jwt.store IS NOT NULL AND this9.id = $jwt.store)
                        }
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                }
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                CALL (this) {
                    MATCH (this)-[this10:ITEM_TRANSACTED]->(this11:Transaction)
                    WHERE (($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $param17 IN $jwt.roles)) OR ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $param18 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $param19 IN $jwt.roles)) AND EXISTS {
                        MATCH (this11)-[:TRANSACTION]->(this12:Store)
                        WHERE ($jwt.store IS NOT NULL AND this12.id = $jwt.store)
                    }))
                    WITH DISTINCT this11
                    CALL (this11) {
                        MATCH (this11)-[this13:TRANSACTION]->(this14:Store)
                        WITH DISTINCT this14
                        WITH this14 { .name } AS this14
                        RETURN collect(this14) AS var15
                    }
                    WITH this11 { .id, store: var15 } AS this11
                    RETURN collect(this11) AS var16
                }
                RETURN this { .name, transaction: var16 } AS var17
            }
            RETURN collect(var17) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Milk\\",
                \\"param1\\": 5,
                \\"param2\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"store-owner\\"
                    ],
                    \\"sub\\": \\"michel\\"
                },
                \\"param5\\": \\"admin\\",
                \\"param6\\": \\"store-owner\\",
                \\"param7\\": \\"employee\\",
                \\"param8\\": \\"transactionid\\",
                \\"param9\\": \\"store-owner\\",
                \\"param10\\": \\"employee\\",
                \\"param11\\": \\"store-owner\\",
                \\"param12\\": \\"employee\\",
                \\"param13\\": \\"store-owner\\",
                \\"param14\\": \\"employee\\",
                \\"param15\\": \\"store-owner\\",
                \\"param16\\": \\"employee\\",
                \\"param17\\": \\"admin\\",
                \\"param18\\": \\"store-owner\\",
                \\"param19\\": \\"employee\\"
            }"
        `);
    });
});
