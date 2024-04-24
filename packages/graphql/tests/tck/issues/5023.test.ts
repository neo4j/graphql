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
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5023", () => {
    const myUserId = "myUserId";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = `
            type JWT @jwt {
                id: String
            }
            type User @authorization(filter: [{ where: { node: { userId: "$jwt.id" } } }]) {
                userId: String! @unique
                adminAccess: [Tenant!]! @relationship(type: "ADMIN_IN", direction: OUT, aggregate: false)
            }

            type Tenant @authorization(validate: [{ where: { node: { admins: { userId: "$jwt.id" } } } }]) {
                id: ID! @id
                admins: [User!]! @relationship(type: "ADMIN_IN", direction: IN, aggregate: false)
                settings: Settings! @relationship(type: "HAS_SETTINGS", direction: OUT, aggregate: false)
            }

            type Settings
                @authorization(validate: [{ where: { node: { tenant: { admins: { userId: "$jwt.id" } } } } }]) {
                tenant: Tenant! @relationship(type: "HAS_SETTINGS", direction: IN, aggregate: false)
                extendedOpeningHours: [OpeningDay!]!
                    @relationship(type: "HAS_OPENING_HOURS", direction: OUT, aggregate: false)
            }

            type OpeningDay
                @authorization(
                    validate: [{ where: { node: { settings: { tenant: { admins: { userId: "$jwt.id" } } } } } }]
                ) {
                settings: Settings! @relationship(type: "HAS_OPENING_HOURS", direction: IN, aggregate: false)
                date: Date
                open: [OpeningHoursInterval!]!
                    @relationship(type: "HAS_OPEN_INTERVALS", direction: OUT, aggregate: false)
            }

            type OpeningHoursInterval
                @authorization(
                    validate: [
                        { where: { node: { openingDay: { settings: { tenant: { admins: { userId: "$jwt.id" } } } } } } }
                    ]
                ) {
                openingDay: OpeningDay @relationship(type: "HAS_OPEN_INTERVALS", direction: IN, aggregate: false)
                name: String
            }

            extend schema @authentication @query(read: true, aggregate: false)
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Update tenants", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateTenants(
                    update: {
                        settings: { update: { node: { extendedOpeningHours: [{ delete: [{ where: null }] }] } } }
                    }
                ) {
                    tenants {
                        settings {
                            extendedOpeningHours {
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
            contextValues: {
                jwt: { id: myUserId },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Tenant)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this)<-[:ADMIN_IN]-(this0:User) WHERE ($jwt.id IS NOT NULL AND this0.userId = $jwt.id) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this
            CALL {
            	WITH this
            	MATCH (this)-[this_has_settings0_relationship:HAS_SETTINGS]->(this_settings0:Settings)
            	OPTIONAL MATCH (this_settings0)<-[:HAS_SETTINGS]-(authorization__before_this1:Tenant)
            	WITH *, count(authorization__before_this1) AS tenantCount
            	WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (tenantCount <> 0 AND size([(authorization__before_this1)<-[:ADMIN_IN]-(authorization__before_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization__before_this0.userId = $jwt.id) | 1]) > 0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	WITH *
            	CALL {
            	WITH *
            	OPTIONAL MATCH (this_settings0)-[this_settings0_extendedOpeningHours0_delete0_relationship:HAS_OPENING_HOURS]->(this_settings0_extendedOpeningHours0_delete0:OpeningDay)
            	CALL {
            	    WITH this_settings0_extendedOpeningHours0_delete0
            	    MATCH (this_settings0_extendedOpeningHours0_delete0)<-[:HAS_OPENING_HOURS]-(authorization__before_this1:Settings)
            	    OPTIONAL MATCH (authorization__before_this1)<-[:HAS_SETTINGS]-(authorization__before_this2:Tenant)
            	    WITH *, count(authorization__before_this2) AS tenantCount
            	    WITH *
            	    WHERE (tenantCount <> 0 AND size([(authorization__before_this2)<-[:ADMIN_IN]-(authorization__before_this3:User) WHERE ($jwt.id IS NOT NULL AND authorization__before_this3.userId = $jwt.id) | 1]) > 0)
            	    RETURN count(authorization__before_this1) = 1 AS authorization__before_var0
            	}
            	WITH *
            	WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND authorization__before_var0 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	WITH this_settings0_extendedOpeningHours0_delete0_relationship, collect(DISTINCT this_settings0_extendedOpeningHours0_delete0) AS this_settings0_extendedOpeningHours0_delete0_to_delete
            	CALL {
            		WITH this_settings0_extendedOpeningHours0_delete0_to_delete
            		UNWIND this_settings0_extendedOpeningHours0_delete0_to_delete AS x
            		DETACH DELETE x
            	}
            	}
            	WITH this, this_settings0
            	OPTIONAL MATCH (this_settings0)<-[:HAS_SETTINGS]-(authorization__after_this1:Tenant)
            	WITH *, count(authorization__after_this1) AS tenantCount
            	WITH *
            	WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (tenantCount <> 0 AND size([(authorization__after_this1)<-[:ADMIN_IN]-(authorization__after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization__after_this0.userId = $jwt.id) | 1]) > 0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            	WITH this, this_settings0
            	CALL {
            		WITH this_settings0
            		MATCH (this_settings0)<-[this_settings0_tenant_Tenant_unique:HAS_SETTINGS]-(:Tenant)
            		WITH count(this_settings0_tenant_Tenant_unique) as c
            		WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDSettings.tenant required exactly once', [0])
            		RETURN c AS this_settings0_tenant_Tenant_unique_ignored
            	}
            	RETURN count(*) AS update_this_settings0
            }
            WITH this
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this)<-[:ADMIN_IN]-(authorization__after_this0:User) WHERE ($jwt.id IS NOT NULL AND authorization__after_this0.userId = $jwt.id) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH *
            CALL {
            	WITH this
            	MATCH (this)-[this_settings_Settings_unique:HAS_SETTINGS]->(:Settings)
            	WITH count(this_settings_Settings_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDTenant.settings required exactly once', [0])
            	RETURN c AS this_settings_Settings_unique_ignored
            }
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND size([(this)<-[:ADMIN_IN]-(update_this0:User) WHERE ($jwt.id IS NOT NULL AND update_this0.userId = $jwt.id) | 1]) > 0), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL {
                WITH this
                MATCH (this)-[update_this1:HAS_SETTINGS]->(update_this2:Settings)
                OPTIONAL MATCH (update_this2)<-[:HAS_SETTINGS]-(update_this3:Tenant)
                WITH *, count(update_this3) AS tenantCount
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (tenantCount <> 0 AND size([(update_this3)<-[:ADMIN_IN]-(update_this4:User) WHERE ($jwt.id IS NOT NULL AND update_this4.userId = $jwt.id) | 1]) > 0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL {
                    WITH update_this2
                    MATCH (update_this2)-[update_this5:HAS_OPENING_HOURS]->(update_this6:OpeningDay)
                    CALL {
                        WITH update_this6
                        MATCH (update_this6)<-[:HAS_OPENING_HOURS]-(update_this7:Settings)
                        OPTIONAL MATCH (update_this7)<-[:HAS_SETTINGS]-(update_this8:Tenant)
                        WITH *, count(update_this8) AS tenantCount
                        WITH *
                        WHERE (tenantCount <> 0 AND size([(update_this8)<-[:ADMIN_IN]-(update_this9:User) WHERE ($jwt.id IS NOT NULL AND update_this9.userId = $jwt.id) | 1]) > 0)
                        RETURN count(update_this7) = 1 AS update_var10
                    }
                    WITH *
                    WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND update_var10 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CALL {
                        WITH update_this6
                        MATCH (update_this6)-[update_this11:HAS_OPEN_INTERVALS]->(update_this12:OpeningHoursInterval)
                        CALL {
                            WITH update_this12
                            MATCH (update_this12)<-[:HAS_OPEN_INTERVALS]-(update_this13:OpeningDay)
                            CALL {
                                WITH update_this13
                                MATCH (update_this13)<-[:HAS_OPENING_HOURS]-(update_this14:Settings)
                                OPTIONAL MATCH (update_this14)<-[:HAS_SETTINGS]-(update_this15:Tenant)
                                WITH *, count(update_this15) AS tenantCount
                                WITH *
                                WHERE (tenantCount <> 0 AND size([(update_this15)<-[:ADMIN_IN]-(update_this16:User) WHERE ($jwt.id IS NOT NULL AND update_this16.userId = $jwt.id) | 1]) > 0)
                                RETURN count(update_this14) = 1 AS update_var17
                            }
                            WITH *
                            WHERE update_var17 = true
                            RETURN count(update_this13) = 1 AS update_var18
                        }
                        WITH *
                        WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND update_var18 = true), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH update_this12 { .name } AS update_this12
                        RETURN collect(update_this12) AS update_var19
                    }
                    WITH update_this6 { open: update_var19 } AS update_this6
                    RETURN collect(update_this6) AS update_var20
                }
                WITH update_this2 { extendedOpeningHours: update_var20 } AS update_this2
                RETURN head(collect(update_this2)) AS update_var21
            }
            RETURN collect(DISTINCT this { settings: update_var21 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"id\\": \\"myUserId\\"
                },
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
