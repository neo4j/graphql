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

describe("https://github.com/neo4j/graphql/issues/4223", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = /* GraphQL */ `
        type JWT @jwt {
            id: String
            roles: [String]
        }
        type User @authorization(validate: [{ where: { node: { userId: "$jwt.id" } }, operations: [READ] }]) {
            userId: String! @unique
            adminAccess: [Tenant!]! @relationship(type: "ADMIN_IN", direction: OUT)
        }

        type Tenant @authorization(validate: [{ where: { node: { admins: { userId: "$jwt.id" } } } }]) {
            id: ID! @id
            settings: Settings! @relationship(type: "VEHICLECARD_OWNER", direction: IN)
            admins: [User!]! @relationship(type: "ADMIN_IN", direction: IN)
        }

        type Settings @authorization(validate: [{ where: { node: { tenant: { admins: { userId: "$jwt.id" } } } } }]) {
            id: ID! @id
            tenant: Tenant! @relationship(type: "HAS_SETTINGS", direction: IN)
            openingDays: [OpeningDay!]! @relationship(type: "VALID_OPENING_DAYS", direction: OUT)
            myWorkspace: MyWorkspace! @relationship(type: "HAS_WORKSPACE_SETTINGS", direction: OUT)
            name: String
        }

        type OpeningDay
            @authorization(
                validate: [{ where: { node: { settings: { tenant: { admins: { userId: "$jwt.id" } } } } } }]
            ) {
            id: ID! @id
            settings: Settings @relationship(type: "VALID_GARAGES", direction: IN)
            open: [OpeningHoursInterval!]! @relationship(type: "HAS_OPEN_INTERVALS", direction: OUT)
        }

        type OpeningHoursInterval
            @authorization(
                validate: [
                    { where: { node: { openingDay: { settings: { tenant: { admins: { userId: "$jwt.id" } } } } } } }
                ]
            ) {
            name: String
            openingDay: OpeningDay! @relationship(type: "HAS_OPEN_INTERVALS", direction: IN)
            updatedBy: String @populatedBy(callback: "getUserIDFromContext", operations: [CREATE, UPDATE])
        }

        type MyWorkspace
            @authorization(
                validate: [{ where: { node: { settings: { tenant: { admins: { userId: "$jwt.id" } } } } } }]
            ) {
            settings: Settings! @relationship(type: "HAS_WORKSPACE_SETTINGS", direction: IN)
            workspace: String
            updatedBy: String @populatedBy(callback: "getUserIDFromContext", operations: [CREATE, UPDATE])
        }
    `;

    beforeAll(() => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        getUserIDFromContext: () => "hi",
                    },
                },
            },
        });
    });

    test("should include checks for auth jwt param is not null", async () => {
        const query = /* GraphQL */ `
            mutation addTenant($input: [TenantCreateInput!]!) {
                createTenants(input: $input) {
                    tenants {
                        id
                        admins {
                            userId
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                input: {
                    admins: {
                        create: {
                            node: { userId: "123" },
                        },
                    },
                    settings: {
                        create: {
                            node: {
                                openingDays: {
                                    create: {
                                        node: {
                                            open: {
                                                create: {
                                                    node: {
                                                        name: "lambo",
                                                    },
                                                },
                                            },
                                        },
                                    },
                                },
                                myWorkspace: {
                                    create: {
                                        node: {
                                            workspace: "myWorkspace",
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:Tenant)
            SET this0.id = randomUUID()
            WITH *
            CREATE (this0_settings0_node:Settings)
            SET this0_settings0_node.id = randomUUID()
            WITH *
            CREATE (this0_settings0_node_openingDays0_node:OpeningDay)
            SET this0_settings0_node_openingDays0_node.id = randomUUID()
            WITH *
            CREATE (this0_settings0_node_openingDays0_node_open0_node:OpeningHoursInterval)
            SET this0_settings0_node_openingDays0_node_open0_node.updatedBy = $resolvedCallbacks.this0_settings0_node_openingDays0_node_open0_node_updatedBy_getUserIDFromContext
            SET this0_settings0_node_openingDays0_node_open0_node.name = $this0_settings0_node_openingDays0_node_open0_node_name
            MERGE (this0_settings0_node_openingDays0_node)-[:HAS_OPEN_INTERVALS]->(this0_settings0_node_openingDays0_node_open0_node)
            WITH *
            CALL {
            	WITH this0_settings0_node_openingDays0_node_open0_node
            	MATCH (this0_settings0_node_openingDays0_node_open0_node)<-[this0_settings0_node_openingDays0_node_open0_node_openingDay_OpeningDay_unique:HAS_OPEN_INTERVALS]-(:OpeningDay)
            	WITH count(this0_settings0_node_openingDays0_node_open0_node_openingDay_OpeningDay_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDOpeningHoursInterval.openingDay required exactly once', [0])
            	RETURN c AS this0_settings0_node_openingDays0_node_open0_node_openingDay_OpeningDay_unique_ignored
            }
            MERGE (this0_settings0_node)-[:VALID_OPENING_DAYS]->(this0_settings0_node_openingDays0_node)
            WITH *
            CALL {
            	WITH this0_settings0_node_openingDays0_node
            	MATCH (this0_settings0_node_openingDays0_node)<-[this0_settings0_node_openingDays0_node_settings_Settings_unique:VALID_GARAGES]-(:Settings)
            	WITH count(this0_settings0_node_openingDays0_node_settings_Settings_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDOpeningDay.settings must be less than or equal to one', [0])
            	RETURN c AS this0_settings0_node_openingDays0_node_settings_Settings_unique_ignored
            }
            WITH *
            CREATE (this0_settings0_node_myWorkspace0_node:MyWorkspace)
            SET this0_settings0_node_myWorkspace0_node.updatedBy = $resolvedCallbacks.this0_settings0_node_myWorkspace0_node_updatedBy_getUserIDFromContext
            SET this0_settings0_node_myWorkspace0_node.workspace = $this0_settings0_node_myWorkspace0_node_workspace
            MERGE (this0_settings0_node)-[:HAS_WORKSPACE_SETTINGS]->(this0_settings0_node_myWorkspace0_node)
            WITH *
            CALL {
            	WITH this0_settings0_node_myWorkspace0_node
            	MATCH (this0_settings0_node_myWorkspace0_node)<-[this0_settings0_node_myWorkspace0_node_settings_Settings_unique:HAS_WORKSPACE_SETTINGS]-(:Settings)
            	WITH count(this0_settings0_node_myWorkspace0_node_settings_Settings_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMyWorkspace.settings required exactly once', [0])
            	RETURN c AS this0_settings0_node_myWorkspace0_node_settings_Settings_unique_ignored
            }
            MERGE (this0)<-[:VEHICLECARD_OWNER]-(this0_settings0_node)
            WITH *
            CALL {
            	WITH this0_settings0_node
            	MATCH (this0_settings0_node)<-[this0_settings0_node_tenant_Tenant_unique:HAS_SETTINGS]-(:Tenant)
            	WITH count(this0_settings0_node_tenant_Tenant_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDSettings.tenant required exactly once', [0])
            	RETURN c AS this0_settings0_node_tenant_Tenant_unique_ignored
            }
            CALL {
            	WITH this0_settings0_node
            	MATCH (this0_settings0_node)-[this0_settings0_node_myWorkspace_MyWorkspace_unique:HAS_WORKSPACE_SETTINGS]->(:MyWorkspace)
            	WITH count(this0_settings0_node_myWorkspace_MyWorkspace_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDSettings.myWorkspace required exactly once', [0])
            	RETURN c AS this0_settings0_node_myWorkspace_MyWorkspace_unique_ignored
            }
            WITH *
            CREATE (this0_admins0_node:User)
            SET this0_admins0_node.userId = $this0_admins0_node_userId
            MERGE (this0)<-[:ADMIN_IN]-(this0_admins0_node)
            WITH *
            CALL {
            	WITH this0
            	MATCH (this0)<-[this0_settings_Settings_unique:VEHICLECARD_OWNER]-(:Settings)
            	WITH count(this0_settings_Settings_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDTenant.settings required exactly once', [0])
            	RETURN c AS this0_settings_Settings_unique_ignored
            }
            WITH *
            CALL {
                WITH this0_settings0_node_openingDays0_node_open0_node
                MATCH (this0_settings0_node_openingDays0_node_open0_node)<-[:HAS_OPEN_INTERVALS]-(authorization_0_0_0_0_0_0_0_0_0_0_after_this1:OpeningDay)
                CALL {
                    WITH authorization_0_0_0_0_0_0_0_0_0_0_after_this1
                    MATCH (authorization_0_0_0_0_0_0_0_0_0_0_after_this1)<-[:VALID_GARAGES]-(authorization_0_0_0_0_0_0_0_0_0_0_after_this2:Settings)
                    OPTIONAL MATCH (authorization_0_0_0_0_0_0_0_0_0_0_after_this2)<-[:HAS_SETTINGS]-(authorization_0_0_0_0_0_0_0_0_0_0_after_this3:Tenant)
                    WITH *, count(authorization_0_0_0_0_0_0_0_0_0_0_after_this3) AS tenantCount
                    WITH *
                    WHERE (tenantCount <> 0 AND size([(authorization_0_0_0_0_0_0_0_0_0_0_after_this3)<-[:ADMIN_IN]-(authorization_0_0_0_0_0_0_0_0_0_0_after_this4:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_0_0_0_0_0_0_after_this4.userId = $jwt.id) | 1]) > 0)
                    RETURN count(authorization_0_0_0_0_0_0_0_0_0_0_after_this2) = 1 AS authorization_0_0_0_0_0_0_0_0_0_0_after_var5
                }
                WITH *
                WHERE authorization_0_0_0_0_0_0_0_0_0_0_after_var5 = true
                RETURN count(authorization_0_0_0_0_0_0_0_0_0_0_after_this1) = 1 AS authorization_0_0_0_0_0_0_0_0_0_0_after_var0
            }
            CALL {
                WITH this0_settings0_node_openingDays0_node
                MATCH (this0_settings0_node_openingDays0_node)<-[:VALID_GARAGES]-(authorization_0_0_0_0_0_0_0_after_this1:Settings)
                OPTIONAL MATCH (authorization_0_0_0_0_0_0_0_after_this1)<-[:HAS_SETTINGS]-(authorization_0_0_0_0_0_0_0_after_this2:Tenant)
                WITH *, count(authorization_0_0_0_0_0_0_0_after_this2) AS tenantCount
                WITH *
                WHERE (tenantCount <> 0 AND size([(authorization_0_0_0_0_0_0_0_after_this2)<-[:ADMIN_IN]-(authorization_0_0_0_0_0_0_0_after_this3:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_0_0_0_after_this3.userId = $jwt.id) | 1]) > 0)
                RETURN count(authorization_0_0_0_0_0_0_0_after_this1) = 1 AS authorization_0_0_0_0_0_0_0_after_var0
            }
            CALL {
                WITH this0_settings0_node_myWorkspace0_node
                MATCH (this0_settings0_node_myWorkspace0_node)<-[:HAS_WORKSPACE_SETTINGS]-(authorization_0_0_0_0_1_0_0_after_this1:Settings)
                OPTIONAL MATCH (authorization_0_0_0_0_1_0_0_after_this1)<-[:HAS_SETTINGS]-(authorization_0_0_0_0_1_0_0_after_this2:Tenant)
                WITH *, count(authorization_0_0_0_0_1_0_0_after_this2) AS tenantCount
                WITH *
                WHERE (tenantCount <> 0 AND size([(authorization_0_0_0_0_1_0_0_after_this2)<-[:ADMIN_IN]-(authorization_0_0_0_0_1_0_0_after_this3:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_1_0_0_after_this3.userId = $jwt.id) | 1]) > 0)
                RETURN count(authorization_0_0_0_0_1_0_0_after_this1) = 1 AS authorization_0_0_0_0_1_0_0_after_var0
            }
            OPTIONAL MATCH (this0_settings0_node)<-[:HAS_SETTINGS]-(authorization_0_0_0_0_after_this1:Tenant)
            WITH *, count(authorization_0_0_0_0_after_this1) AS tenantCount
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND authorization_0_0_0_0_0_0_0_0_0_0_after_var0 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND authorization_0_0_0_0_0_0_0_after_var0 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND authorization_0_0_0_0_1_0_0_after_var0 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (tenantCount <> 0 AND size([(authorization_0_0_0_0_after_this1)<-[:ADMIN_IN]-(authorization_0_0_0_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_after_this0.userId = $jwt.id) | 1]) > 0)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0)<-[:ADMIN_IN]-(authorization_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_after_this0.userId = $jwt.id) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0
            }
            CALL {
                WITH this0
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this0:ADMIN_IN]-(create_this1:User)
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND ($jwt.id IS NOT NULL AND create_this1.userId = $jwt.id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH create_this1 { .userId } AS create_this1
                    RETURN collect(create_this1) AS create_var2
                }
                RETURN this0 { .id, admins: create_var2 } AS create_var3
            }
            RETURN [create_var3] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": false,
                \\"jwt\\": {},
                \\"this0_settings0_node_openingDays0_node_open0_node_name\\": \\"lambo\\",
                \\"this0_settings0_node_myWorkspace0_node_workspace\\": \\"myWorkspace\\",
                \\"this0_admins0_node_userId\\": \\"123\\",
                \\"resolvedCallbacks\\": {
                    \\"this0_settings0_node_openingDays0_node_open0_node_updatedBy_getUserIDFromContext\\": \\"hi\\",
                    \\"this0_settings0_node_myWorkspace0_node_updatedBy_getUserIDFromContext\\": \\"hi\\"
                }
            }"
        `);
    });
});
