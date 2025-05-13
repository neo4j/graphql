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

describe("https://github.com/neo4j/graphql/issues/4429", () => {
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
            admins: [User!]! @relationship(type: "ADMIN_IN", direction: IN)
            settings: Settings @relationship(type: "VEHICLECARD_OWNER", direction: IN)
        }

        type Settings @authorization(validate: [{ where: { node: { tenant: { admins: { userId: "$jwt.id" } } } } }]) {
            id: ID! @id
            openingDays: [OpeningDay!]! @relationship(type: "VALID_GARAGES", direction: OUT)
            tenant: Tenant! @relationship(type: "VEHICLECARD_OWNER", direction: OUT) # <---  this line
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
            createdAt: DateTime! @timestamp(operations: [CREATE])
            updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
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
                        settings {
                            openingDays {
                                open {
                                    name
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                input: {
                    settings: {
                        create: {
                            node: {
                                openingDays: {
                                    create: [
                                        {
                                            node: {
                                                open: {
                                                    create: [
                                                        {
                                                            node: {
                                                                name: "hi",
                                                            },
                                                        },
                                                    ],
                                                },
                                            },
                                        },
                                        {
                                            node: {
                                                open: {
                                                    create: [
                                                        {
                                                            node: {
                                                                name: "hi",
                                                            },
                                                        },
                                                        {
                                                            node: {
                                                                name: "hi",
                                                            },
                                                        },
                                                    ],
                                                },
                                            },
                                        },
                                    ],
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
            SET this0_settings0_node_openingDays0_node_open0_node.createdAt = datetime()
            SET this0_settings0_node_openingDays0_node_open0_node.updatedAt = datetime()
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
            MERGE (this0_settings0_node)-[:VALID_GARAGES]->(this0_settings0_node_openingDays0_node)
            WITH *
            CALL {
            	WITH this0_settings0_node_openingDays0_node
            	MATCH (this0_settings0_node_openingDays0_node)<-[this0_settings0_node_openingDays0_node_settings_Settings_unique:VALID_GARAGES]-(:Settings)
            	WITH count(this0_settings0_node_openingDays0_node_settings_Settings_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDOpeningDay.settings must be less than or equal to one', [0])
            	RETURN c AS this0_settings0_node_openingDays0_node_settings_Settings_unique_ignored
            }
            WITH *
            CREATE (this0_settings0_node_openingDays1_node:OpeningDay)
            SET this0_settings0_node_openingDays1_node.id = randomUUID()
            WITH *
            CREATE (this0_settings0_node_openingDays1_node_open0_node:OpeningHoursInterval)
            SET this0_settings0_node_openingDays1_node_open0_node.createdAt = datetime()
            SET this0_settings0_node_openingDays1_node_open0_node.updatedAt = datetime()
            SET this0_settings0_node_openingDays1_node_open0_node.updatedBy = $resolvedCallbacks.this0_settings0_node_openingDays1_node_open0_node_updatedBy_getUserIDFromContext
            SET this0_settings0_node_openingDays1_node_open0_node.name = $this0_settings0_node_openingDays1_node_open0_node_name
            MERGE (this0_settings0_node_openingDays1_node)-[:HAS_OPEN_INTERVALS]->(this0_settings0_node_openingDays1_node_open0_node)
            WITH *
            CALL {
            	WITH this0_settings0_node_openingDays1_node_open0_node
            	MATCH (this0_settings0_node_openingDays1_node_open0_node)<-[this0_settings0_node_openingDays1_node_open0_node_openingDay_OpeningDay_unique:HAS_OPEN_INTERVALS]-(:OpeningDay)
            	WITH count(this0_settings0_node_openingDays1_node_open0_node_openingDay_OpeningDay_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDOpeningHoursInterval.openingDay required exactly once', [0])
            	RETURN c AS this0_settings0_node_openingDays1_node_open0_node_openingDay_OpeningDay_unique_ignored
            }
            WITH *
            CREATE (this0_settings0_node_openingDays1_node_open1_node:OpeningHoursInterval)
            SET this0_settings0_node_openingDays1_node_open1_node.createdAt = datetime()
            SET this0_settings0_node_openingDays1_node_open1_node.updatedAt = datetime()
            SET this0_settings0_node_openingDays1_node_open1_node.updatedBy = $resolvedCallbacks.this0_settings0_node_openingDays1_node_open1_node_updatedBy_getUserIDFromContext
            SET this0_settings0_node_openingDays1_node_open1_node.name = $this0_settings0_node_openingDays1_node_open1_node_name
            MERGE (this0_settings0_node_openingDays1_node)-[:HAS_OPEN_INTERVALS]->(this0_settings0_node_openingDays1_node_open1_node)
            WITH *
            CALL {
            	WITH this0_settings0_node_openingDays1_node_open1_node
            	MATCH (this0_settings0_node_openingDays1_node_open1_node)<-[this0_settings0_node_openingDays1_node_open1_node_openingDay_OpeningDay_unique:HAS_OPEN_INTERVALS]-(:OpeningDay)
            	WITH count(this0_settings0_node_openingDays1_node_open1_node_openingDay_OpeningDay_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDOpeningHoursInterval.openingDay required exactly once', [0])
            	RETURN c AS this0_settings0_node_openingDays1_node_open1_node_openingDay_OpeningDay_unique_ignored
            }
            MERGE (this0_settings0_node)-[:VALID_GARAGES]->(this0_settings0_node_openingDays1_node)
            WITH *
            CALL {
            	WITH this0_settings0_node_openingDays1_node
            	MATCH (this0_settings0_node_openingDays1_node)<-[this0_settings0_node_openingDays1_node_settings_Settings_unique:VALID_GARAGES]-(:Settings)
            	WITH count(this0_settings0_node_openingDays1_node_settings_Settings_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDOpeningDay.settings must be less than or equal to one', [0])
            	RETURN c AS this0_settings0_node_openingDays1_node_settings_Settings_unique_ignored
            }
            MERGE (this0)<-[:VEHICLECARD_OWNER]-(this0_settings0_node)
            WITH *
            CALL {
            	WITH this0_settings0_node
            	MATCH (this0_settings0_node)-[this0_settings0_node_tenant_Tenant_unique:VEHICLECARD_OWNER]->(:Tenant)
            	WITH count(this0_settings0_node_tenant_Tenant_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDSettings.tenant required exactly once', [0])
            	RETURN c AS this0_settings0_node_tenant_Tenant_unique_ignored
            }
            WITH *
            CALL {
            	WITH this0
            	MATCH (this0)<-[this0_settings_Settings_unique:VEHICLECARD_OWNER]-(:Settings)
            	WITH count(this0_settings_Settings_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c <= 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDTenant.settings must be less than or equal to one', [0])
            	RETURN c AS this0_settings_Settings_unique_ignored
            }
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0_settings0_node_openingDays0_node_open0_node)<-[:HAS_OPEN_INTERVALS]-(authorization_0_0_0_0_0_0_0_0_0_0_after_this3:OpeningDay) WHERE single(authorization_0_0_0_0_0_0_0_0_0_0_after_this2 IN [(authorization_0_0_0_0_0_0_0_0_0_0_after_this3)<-[:VALID_GARAGES]-(authorization_0_0_0_0_0_0_0_0_0_0_after_this2:Settings) WHERE size([(authorization_0_0_0_0_0_0_0_0_0_0_after_this2)-[:VEHICLECARD_OWNER]->(authorization_0_0_0_0_0_0_0_0_0_0_after_this1:Tenant) WHERE size([(authorization_0_0_0_0_0_0_0_0_0_0_after_this1)<-[:ADMIN_IN]-(authorization_0_0_0_0_0_0_0_0_0_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_0_0_0_0_0_0_after_this0.userId = $jwt.id) | 1]) > 0 | 1]) > 0 | 1] WHERE true) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND single(authorization_0_0_0_0_0_0_0_after_this2 IN [(this0_settings0_node_openingDays0_node)<-[:VALID_GARAGES]-(authorization_0_0_0_0_0_0_0_after_this2:Settings) WHERE size([(authorization_0_0_0_0_0_0_0_after_this2)-[:VEHICLECARD_OWNER]->(authorization_0_0_0_0_0_0_0_after_this1:Tenant) WHERE size([(authorization_0_0_0_0_0_0_0_after_this1)<-[:ADMIN_IN]-(authorization_0_0_0_0_0_0_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_0_0_0_after_this0.userId = $jwt.id) | 1]) > 0 | 1]) > 0 | 1] WHERE true)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0_settings0_node_openingDays1_node_open0_node)<-[:HAS_OPEN_INTERVALS]-(authorization_0_0_0_0_0_1_0_0_0_0_after_this3:OpeningDay) WHERE single(authorization_0_0_0_0_0_1_0_0_0_0_after_this2 IN [(authorization_0_0_0_0_0_1_0_0_0_0_after_this3)<-[:VALID_GARAGES]-(authorization_0_0_0_0_0_1_0_0_0_0_after_this2:Settings) WHERE size([(authorization_0_0_0_0_0_1_0_0_0_0_after_this2)-[:VEHICLECARD_OWNER]->(authorization_0_0_0_0_0_1_0_0_0_0_after_this1:Tenant) WHERE size([(authorization_0_0_0_0_0_1_0_0_0_0_after_this1)<-[:ADMIN_IN]-(authorization_0_0_0_0_0_1_0_0_0_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_0_1_0_0_0_0_after_this0.userId = $jwt.id) | 1]) > 0 | 1]) > 0 | 1] WHERE true) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0_settings0_node_openingDays1_node_open1_node)<-[:HAS_OPEN_INTERVALS]-(authorization_0_0_0_0_0_1_0_0_1_0_after_this3:OpeningDay) WHERE single(authorization_0_0_0_0_0_1_0_0_1_0_after_this2 IN [(authorization_0_0_0_0_0_1_0_0_1_0_after_this3)<-[:VALID_GARAGES]-(authorization_0_0_0_0_0_1_0_0_1_0_after_this2:Settings) WHERE size([(authorization_0_0_0_0_0_1_0_0_1_0_after_this2)-[:VEHICLECARD_OWNER]->(authorization_0_0_0_0_0_1_0_0_1_0_after_this1:Tenant) WHERE size([(authorization_0_0_0_0_0_1_0_0_1_0_after_this1)<-[:ADMIN_IN]-(authorization_0_0_0_0_0_1_0_0_1_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_0_1_0_0_1_0_after_this0.userId = $jwt.id) | 1]) > 0 | 1]) > 0 | 1] WHERE true) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND single(authorization_0_0_0_0_0_1_0_after_this2 IN [(this0_settings0_node_openingDays1_node)<-[:VALID_GARAGES]-(authorization_0_0_0_0_0_1_0_after_this2:Settings) WHERE size([(authorization_0_0_0_0_0_1_0_after_this2)-[:VEHICLECARD_OWNER]->(authorization_0_0_0_0_0_1_0_after_this1:Tenant) WHERE size([(authorization_0_0_0_0_0_1_0_after_this1)<-[:ADMIN_IN]-(authorization_0_0_0_0_0_1_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_0_1_0_after_this0.userId = $jwt.id) | 1]) > 0 | 1]) > 0 | 1] WHERE true)), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0_settings0_node)-[:VEHICLECARD_OWNER]->(authorization_0_0_0_0_after_this1:Tenant) WHERE size([(authorization_0_0_0_0_after_this1)<-[:ADMIN_IN]-(authorization_0_0_0_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_after_this0.userId = $jwt.id) | 1]) > 0 | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this0)<-[:ADMIN_IN]-(authorization_0_after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization_0_after_this0.userId = $jwt.id) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                CALL {
                    WITH this0
                    MATCH (this0)<-[create_this3:VEHICLECARD_OWNER]-(create_this4:Settings)
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(create_this4)-[:VEHICLECARD_OWNER]->(create_this6:Tenant) WHERE size([(create_this6)<-[:ADMIN_IN]-(create_this5:User) WHERE ($jwt.id IS NOT NULL AND create_this5.userId = $jwt.id) | 1]) > 0 | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CALL {
                        WITH create_this4
                        MATCH (create_this4)-[create_this7:VALID_GARAGES]->(create_this8:OpeningDay)
                        WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND single(create_this11 IN [(create_this8)<-[:VALID_GARAGES]-(create_this11:Settings) WHERE size([(create_this11)-[:VEHICLECARD_OWNER]->(create_this10:Tenant) WHERE size([(create_this10)<-[:ADMIN_IN]-(create_this9:User) WHERE ($jwt.id IS NOT NULL AND create_this9.userId = $jwt.id) | 1]) > 0 | 1]) > 0 | 1] WHERE true)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        CALL {
                            WITH create_this8
                            MATCH (create_this8)-[create_this12:HAS_OPEN_INTERVALS]->(create_this13:OpeningHoursInterval)
                            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(create_this13)<-[:HAS_OPEN_INTERVALS]-(create_this17:OpeningDay) WHERE single(create_this16 IN [(create_this17)<-[:VALID_GARAGES]-(create_this16:Settings) WHERE size([(create_this16)-[:VEHICLECARD_OWNER]->(create_this15:Tenant) WHERE size([(create_this15)<-[:ADMIN_IN]-(create_this14:User) WHERE ($jwt.id IS NOT NULL AND create_this14.userId = $jwt.id) | 1]) > 0 | 1]) > 0 | 1] WHERE true) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                            WITH create_this13 { .name } AS create_this13
                            RETURN collect(create_this13) AS create_var18
                        }
                        WITH create_this8 { open: create_var18 } AS create_this8
                        RETURN collect(create_this8) AS create_var19
                    }
                    WITH create_this4 { openingDays: create_var19 } AS create_this4
                    RETURN head(collect(create_this4)) AS create_var20
                }
                RETURN this0 { .id, admins: create_var2, settings: create_var20 } AS create_var21
            }
            RETURN [create_var21] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": false,
                \\"jwt\\": {},
                \\"this0_settings0_node_openingDays0_node_open0_node_name\\": \\"hi\\",
                \\"this0_settings0_node_openingDays1_node_open0_node_name\\": \\"hi\\",
                \\"this0_settings0_node_openingDays1_node_open1_node_name\\": \\"hi\\",
                \\"resolvedCallbacks\\": {
                    \\"this0_settings0_node_openingDays0_node_open0_node_updatedBy_getUserIDFromContext\\": \\"hi\\",
                    \\"this0_settings0_node_openingDays1_node_open0_node_updatedBy_getUserIDFromContext\\": \\"hi\\",
                    \\"this0_settings0_node_openingDays1_node_open1_node_updatedBy_getUserIDFromContext\\": \\"hi\\"
                }
            }"
        `);
    });
});
