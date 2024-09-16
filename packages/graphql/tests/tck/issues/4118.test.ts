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
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2871", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = /* GraphQL */ `
        type JWT @jwt {
            id: String
            roles: [String]
        }
        type User
            @authorization(
                validate: [
                    { where: { node: { userId: "$jwt.id" } }, operations: [READ] }
                    { where: { jwt: { roles_INCLUDES: "overlord" } } }
                ]
            ) {
            userId: String! @unique
            adminAccess: [Tenant!]! @relationship(type: "ADMIN_IN", direction: OUT)
        }

        type Tenant
            @authorization(
                validate: [
                    { where: { node: { admins: { userId: "$jwt.id" } } } }
                    { where: { jwt: { roles_INCLUDES: "overlord" } } }
                ]
            ) {
            id: ID! @id
            settings: Settings! @relationship(type: "HAS_SETTINGS", direction: OUT)
            admins: [User!]! @relationship(type: "ADMIN_IN", direction: IN)
        }

        type Settings
            @authorization(
                validate: [
                    { where: { node: { tenant: { admins: { userId: "$jwt.id" } } } } }
                    { where: { jwt: { roles_INCLUDES: "overlord" } } }
                ]
            ) {
            id: ID! @id
            tenant: Tenant! @relationship(type: "HAS_SETTINGS", direction: IN)
            openingDays: [OpeningDay!]! @relationship(type: "VALID_OPENING_DAYS", direction: OUT)
            name: String
        }

        type OpeningDay
            @authorization(
                validate: [{ where: { node: { settings: { tenant: { admins: { userId: "$jwt.id" } } } } } }]
            ) {
            settings: Settings @relationship(type: "VALID_OPENING_DAYS", direction: IN)
            id: ID! @id
            name: String
        }

        type LOL @authorization(validate: [{ where: { node: { host: { admins: { userId: "$jwt.id" } } } } }]) {
            host: Tenant! @relationship(type: "HOSTED_BY", direction: OUT)
            openingDays: [OpeningDay!]! @relationship(type: "HAS_OPENING_DAY", direction: OUT)
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should include checks for auth jwt param is not null", async () => {
        const query = /* GraphQL */ `
            mutation addLols($input: [LOLCreateInput!]!) {
                createLols(input: $input) {
                    lols {
                        host {
                            id
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                input: {
                    host: {
                        connect: {
                            where: {
                                node: {
                                    id: "userid",
                                },
                            },
                        },
                    },
                    openingDays: {
                        connect: {
                            where: {
                                node: {
                                    id: "openingdayid",
                                },
                            },
                        },
                    },
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:LOL)
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_host_connect0_node:Tenant)
            	WHERE this0_host_connect0_node.id = $this0_host_connect0_node_param0 AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND size([(this0_host_connect0_node)<-[:ADMIN_IN]-(authorization_0_before_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_before_this0.userId = $jwt.id) | 1]) > 0) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization_0_before_param2 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	CALL {
            		WITH *
            		WITH collect(this0_host_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_host_connect0_node
            			MERGE (this0)-[:HOSTED_BY]->(this0_host_connect0_node)
            		}
            	}
            WITH this0, this0_host_connect0_node
            WITH *
            OPTIONAL MATCH (this0)-[:HOSTED_BY]->(authorization_0_after_this1:Tenant)
            WITH *, count(authorization_0_after_this1) AS hostCount
            WITH *
            WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (hostCount <> 0 AND size([(authorization_0_after_this1)<-[:ADMIN_IN]-(authorization_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_after_this0.userId = $jwt.id) | 1]) > 0)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT (($isAuthenticated = true AND size([(this0_host_connect0_node)<-[:ADMIN_IN]-(authorization_0_after_this2:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_after_this2.userId = $jwt.id) | 1]) > 0) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $authorization_0_after_param2 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this0_host_connect_Tenant0
            }
            WITH *
            CALL {
            	WITH this0
            	OPTIONAL MATCH (this0_openingDays_connect0_node:OpeningDay)
            CALL {
                WITH this0_openingDays_connect0_node
                MATCH (this0_openingDays_connect0_node)<-[:VALID_OPENING_DAYS]-(authorization_0_before_this1:Settings)
                OPTIONAL MATCH (authorization_0_before_this1)<-[:HAS_SETTINGS]-(authorization_0_before_this2:Tenant)
                WITH *, count(authorization_0_before_this2) AS tenantCount
                WITH *
                WHERE (tenantCount <> 0 AND size([(authorization_0_before_this2)<-[:ADMIN_IN]-(authorization_0_before_this3:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_before_this3.userId = $jwt.id) | 1]) > 0)
                RETURN count(authorization_0_before_this1) = 1 AS authorization_0_before_var0
            }
            WITH *
            	WHERE this0_openingDays_connect0_node.id = $this0_openingDays_connect0_node_param0 AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND authorization_0_before_var0 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	CALL {
            		WITH *
            		WITH collect(this0_openingDays_connect0_node) as connectedNodes, collect(this0) as parentNodes
            		CALL {
            			WITH connectedNodes, parentNodes
            			UNWIND parentNodes as this0
            			UNWIND connectedNodes as this0_openingDays_connect0_node
            			MERGE (this0)-[:HAS_OPENING_DAY]->(this0_openingDays_connect0_node)
            		}
            	}
            WITH this0, this0_openingDays_connect0_node
            WITH *
            OPTIONAL MATCH (this0)-[:HOSTED_BY]->(authorization_0_after_this1:Tenant)
            WITH *, count(authorization_0_after_this1) AS hostCount
            CALL {
                WITH this0_openingDays_connect0_node
                MATCH (this0_openingDays_connect0_node)<-[:VALID_OPENING_DAYS]-(authorization_0_after_this3:Settings)
                OPTIONAL MATCH (authorization_0_after_this3)<-[:HAS_SETTINGS]-(authorization_0_after_this4:Tenant)
                WITH *, count(authorization_0_after_this4) AS tenantCount
                WITH *
                WHERE (tenantCount <> 0 AND size([(authorization_0_after_this4)<-[:ADMIN_IN]-(authorization_0_after_this5:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_after_this5.userId = $jwt.id) | 1]) > 0)
                RETURN count(authorization_0_after_this3) = 1 AS authorization_0_after_var2
            }
            WITH *
            WHERE (apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (hostCount <> 0 AND size([(authorization_0_after_this1)<-[:ADMIN_IN]-(authorization_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_after_this0.userId = $jwt.id) | 1]) > 0)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND authorization_0_after_var2 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0]))
            	RETURN count(*) AS connect_this0_openingDays_connect_OpeningDay0
            }
            WITH *
            CALL {
            	WITH this0
            	MATCH (this0)-[this0_host_Tenant_unique:HOSTED_BY]->(:Tenant)
            	WITH count(this0_host_Tenant_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDLOL.host required exactly once', [0])
            	RETURN c AS this0_host_Tenant_unique_ignored
            }
            WITH *
            OPTIONAL MATCH (this0)-[:HOSTED_BY]->(authorization_0_after_this1:Tenant)
            WITH *, count(authorization_0_after_this1) AS hostCount
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (hostCount <> 0 AND size([(authorization_0_after_this1)<-[:ADMIN_IN]-(authorization_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_after_this0.userId = $jwt.id) | 1]) > 0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0
            }
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)-[create_this0:HOSTED_BY]->(create_this1:Tenant)
                    WHERE apoc.util.validatePredicate(NOT (($isAuthenticated = true AND size([(create_this1)<-[:ADMIN_IN]-(create_this2:User) WHERE ($jwt.id IS NOT NULL AND create_this2.userId = $jwt.id) | 1]) > 0) OR ($isAuthenticated = true AND ($jwt.roles IS NOT NULL AND $create_param2 IN $jwt.roles))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH create_this1 { .id } AS create_this1
                    RETURN head(collect(create_this1)) AS create_var3
                }
                RETURN this0 { host: create_var3 } AS create_var4
            }
            RETURN [create_var4] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": false,
                \\"jwt\\": {},
                \\"create_param2\\": \\"overlord\\",
                \\"this0_host_connect0_node_param0\\": \\"userid\\",
                \\"authorization_0_before_param2\\": \\"overlord\\",
                \\"authorization_0_after_param2\\": \\"overlord\\",
                \\"this0_openingDays_connect0_node_param0\\": \\"openingdayid\\",
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
