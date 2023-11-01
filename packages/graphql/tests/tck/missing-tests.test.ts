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

import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../src";
import { formatCypher, translateQuery, formatParams } from "./utils/tck-test-utils";
import { createBearerToken } from "../utils/create-bearer-token";

describe("composite-where.int.test.ts", () => {
    test("should use composite where to delete", async () => {
        const typeDefs = `
            type Actor {
                name: String
            }
        
            type Movie {
                id: ID!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }
        
            interface ActedIn @relationshipProperties {
                screenTime: Int
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = gql`
            mutation {
                updateMovies(
                    where: { id: "some-id" }
                    disconnect: { actors: { where: { node: { name: "Keanu" }, edge: { screenTime: 123 } } } }
                ) {
                    movies {
                        id
                        actors {
                            name
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WHERE this.id = $param0
            WITH this
            CALL {
            WITH this
            OPTIONAL MATCH (this)<-[this_disconnect_actors0_rel:ACTED_IN]-(this_disconnect_actors0:Actor)
            WHERE (this_disconnect_actors0.name = $updateMovies_args_disconnect_actors0_where_Actor_this_disconnect_actors0param0 AND this_disconnect_actors0_rel.screenTime = $updateMovies_args_disconnect_actors0_where_Actor_this_disconnect_actors0param1)
            CALL {
            	WITH this_disconnect_actors0, this_disconnect_actors0_rel, this
            	WITH collect(this_disconnect_actors0) as this_disconnect_actors0, this_disconnect_actors0_rel, this
            	UNWIND this_disconnect_actors0 as x
            	DELETE this_disconnect_actors0_rel
            }
            RETURN count(*) AS disconnect_this_disconnect_actors_Actor
            }
            WITH *
            CALL {
                WITH this
                MATCH (this)<-[update_this0:ACTED_IN]-(update_this1:Actor)
                WITH update_this1 { .name } AS update_this1
                RETURN collect(update_this1) AS update_var2
            }
            RETURN collect(DISTINCT this { .id, actors: update_var2 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"some-id\\",
                \\"updateMovies_args_disconnect_actors0_where_Actor_this_disconnect_actors0param0\\": \\"Keanu\\",
                \\"updateMovies_args_disconnect_actors0_where_Actor_this_disconnect_actors0param1\\": {
                    \\"low\\": 123,
                    \\"high\\": 0
                },
                \\"updateMovies\\": {
                    \\"args\\": {
                        \\"disconnect\\": {
                            \\"actors\\": [
                                {
                                    \\"where\\": {
                                        \\"node\\": {
                                            \\"name\\": \\"Keanu\\"
                                        },
                                        \\"edge\\": {
                                            \\"screenTime\\": {
                                                \\"low\\": 123,
                                                \\"high\\": 0
                                            }
                                        }
                                    }
                                }
                            ]
                        }
                    }
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

describe("4133", () => {
    test("Create sets default enum value correctly", async () => {
        const typeDefs = gql`
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
            }

            type TransactionItem {
                transaction: Transaction @relationship(type: "ITEM_TRANSACTED", direction: OUT)
                name: String
                price: Float
                quantity: Int
            }

            extend type Transaction @authentication
            extend type Transaction
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

            extend type TransactionItem @authentication
            extend type TransactionItem
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

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const query = gql`
            mutation {
                createTransactions(
                    input: {
                        type: "sale"
                        store: { connect: { where: { node: { name: "Store" } } } }
                        items: {
                            create: [
                                { node: { name: "Milk", price: 2.50, quantity: 3 } }
                                { node: { name: "Eggs", price: 5.00, quantity: 1 } }
                            ]
                        }
                    }
                ) {
                    transactions {
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

        const token = createBearerToken("secret", { roles: ["employee"], store: 2 });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Transaction)
            SET this0.id = randomUUID()
            SET this0.type = $this0_type
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_store_connect0_node:Store)
            	WHERE this0_store_connect0_node.name = $this0_store_connect0_node_param0
            	CALL {
            		WITH *
            		WITH collect(this0_store_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_store_connect0_node
            			MERGE (this0)-[:TRANSACTION]->(this0_store_connect0_node)
            		}
            	}
            WITH this0, this0_store_connect0_node
            WITH *
            OPTIONAL MATCH (this0)-[:TRANSACTION]->(authorization_this0:Store)
            WITH *, count(authorization_this0) AS storeCount
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $authorization_param2 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $authorization_param3 IN $jwt.roles)) AND (storeCount <> 0 AND ($jwt.store IS NOT NULL AND authorization_this0.id = $jwt.store))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	RETURN count(*) AS connect_this0_store_connect_Store0
            }
            WITH *
            CREATE (this0_items0_node:TransactionItem)
            SET this0_items0_node.name = $this0_items0_node_name
            SET this0_items0_node.price = $this0_items0_node_price
            SET this0_items0_node.quantity = $this0_items0_node_quantity
            MERGE (this0)<-[:ITEM_TRANSACTED]-(this0_items0_node)
            WITH *
            CALL {
            	WITH this0_items0_node
            	MATCH (this0_items0_node)-[this0_items0_node_transaction_Transaction_unique:ITEM_TRANSACTED]->(:Transaction)
            	WITH count(this0_items0_node_transaction_Transaction_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDTransactionItem.transaction must be less than or equal to one', [0])
            	RETURN c AS this0_items0_node_transaction_Transaction_unique_ignored
            }
            WITH *
            CREATE (this0_items1_node:TransactionItem)
            SET this0_items1_node.name = $this0_items1_node_name
            SET this0_items1_node.price = $this0_items1_node_price
            SET this0_items1_node.quantity = $this0_items1_node_quantity
            MERGE (this0)<-[:ITEM_TRANSACTED]-(this0_items1_node)
            WITH *
            CALL {
            	WITH this0_items1_node
            	MATCH (this0_items1_node)-[this0_items1_node_transaction_Transaction_unique:ITEM_TRANSACTED]->(:Transaction)
            	WITH count(this0_items1_node_transaction_Transaction_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDTransactionItem.transaction must be less than or equal to one', [0])
            	RETURN c AS this0_items1_node_transaction_Transaction_unique_ignored
            }
            WITH *
            CALL {
            	WITH this0
            	MATCH (this0)-[this0_store_Store_unique:TRANSACTION]->(:Store)
            	WITH count(this0_store_Store_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDTransaction.store required exactly once', [0])
            	RETURN c AS this0_store_Store_unique_ignored
            }
            WITH *
            CALL {
                WITH this0_items0_node
                MATCH (this0_items0_node)-[:ITEM_TRANSACTED]->(authorization_0_1_this1:Transaction)
                OPTIONAL MATCH (authorization_0_1_this1)-[:TRANSACTION]->(authorization_0_1_this2:Store)
                WITH *, count(authorization_0_1_this2) AS storeCount
                WITH *
                WHERE (storeCount <> 0 AND ($jwt.store IS NOT NULL AND authorization_0_1_this2.id = $jwt.store))
                RETURN count(authorization_0_1_this1) = 1 AS authorization_0_1_var0
            }
            CALL {
                WITH this0_items1_node
                MATCH (this0_items1_node)-[:ITEM_TRANSACTED]->(authorization_0_2_this1:Transaction)
                OPTIONAL MATCH (authorization_0_2_this1)-[:TRANSACTION]->(authorization_0_2_this2:Store)
                WITH *, count(authorization_0_2_this2) AS storeCount
                WITH *
                WHERE (storeCount <> 0 AND ($jwt.store IS NOT NULL AND authorization_0_2_this2.id = $jwt.store))
                RETURN count(authorization_0_2_this1) = 1 AS authorization_0_2_var0
            }
            OPTIONAL MATCH (this0)-[:TRANSACTION]->(authorization_0_0_this0:Store)
            WITH *, count(authorization_0_0_this0) AS storeCount
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $authorization_0_1_param2 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $authorization_0_1_param3 IN $jwt.roles)) AND authorization_0_1_var0 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $authorization_0_2_param2 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $authorization_0_2_param3 IN $jwt.roles)) AND authorization_0_2_var0 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $authorization_0_0_param2 IN $jwt.roles) OR ($jwt.roles IS NOT NULL AND $authorization_0_0_param3 IN $jwt.roles)) AND (storeCount <> 0 AND ($jwt.store IS NOT NULL AND authorization_0_0_this0.id = $jwt.store))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0
            }
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)-[create_this0:TRANSACTION]->(create_this1:Store)
                    WITH create_this1 { .name } AS create_this1
                    RETURN head(collect(create_this1)) AS create_var2
                }
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this3:ITEM_TRANSACTED]-(create_this4:TransactionItem)
                    WITH create_this4 { .name } AS create_this4
                    RETURN collect(create_this4) AS create_var5
                }
                RETURN this0 { store: create_var2, items: create_var5 } AS create_var6
            }
            RETURN [create_var6] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_type\\": \\"sale\\",
                \\"this0_store_connect0_node_param0\\": \\"Store\\",
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"employee\\"
                    ],
                    \\"store\\": 2
                },
                \\"authorization_param2\\": \\"store-owner\\",
                \\"authorization_param3\\": \\"employee\\",
                \\"this0_items0_node_name\\": \\"Milk\\",
                \\"this0_items0_node_price\\": 2.5,
                \\"this0_items0_node_quantity\\": {
                    \\"low\\": 3,
                    \\"high\\": 0
                },
                \\"authorization_0_1_param2\\": \\"store-owner\\",
                \\"authorization_0_1_param3\\": \\"employee\\",
                \\"this0_items1_node_name\\": \\"Eggs\\",
                \\"this0_items1_node_price\\": 5,
                \\"this0_items1_node_quantity\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"authorization_0_2_param2\\": \\"store-owner\\",
                \\"authorization_0_2_param3\\": \\"employee\\",
                \\"authorization_0_0_param2\\": \\"store-owner\\",
                \\"authorization_0_0_param3\\": \\"employee\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});

describe("4268", () => {
    test("Logical operator should work correctly", async () => {
        const typeDefs = gql`
            type JWT @jwt {
                id: ID!
                email: String!
                roles: [String!]!
            }

            type Movie
                @authorization(
                    validate: [
                        { when: [BEFORE], where: { jwt: { OR: [{ roles: "admin" }, { roles: "super-admin" }] } } }
                    ]
                ) {
                title: String
                director: [Person!]! @relationship(type: "DIRECTED", direction: IN)
            }

            type Person {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });

        const query = gql`
            query {
                movies {
                    title
                }
            }
        `;

        const token = createBearerToken("secret", { roles: ["admin"], id: "something", email: "something" });
        const result = await translateQuery(neoSchema, query, { token });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Movie)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (($jwt.roles IS NOT NULL AND $jwt.roles = $param2) OR ($jwt.roles IS NOT NULL AND $jwt.roles = $param3))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [
                        \\"admin\\"
                    ],
                    \\"id\\": \\"something\\",
                    \\"email\\": \\"something\\"
                },
                \\"param2\\": \\"admin\\",
                \\"param3\\": \\"super-admin\\"
            }"
        `);
    });
});
