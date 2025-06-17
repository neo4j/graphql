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

describe("https://github.com/neo4j/graphql/issues/4170", () => {
    let neoSchema: Neo4jGraphQL;

    const typeDefs = /* GraphQL */ `
        type JWT @jwt {
            id: String
            roles: [String]
        }
        type User
            @authorization(validate: [{ where: { node: { userId: { eq: "$jwt.id" } } }, operations: [READ] }])
            @node {
            userId: String!
            adminAccess: [Tenant!]! @relationship(type: "ADMIN_IN", direction: OUT)
        }

        type Tenant
            @authorization(validate: [{ where: { node: { admins: { some: { userId: { eq: "$jwt.id" } } } } } }])
            @node {
            id: ID! @id
            settings: [Settings!]! @relationship(type: "HAS_SETTINGS", direction: OUT)
            admins: [User!]! @relationship(type: "ADMIN_IN", direction: IN)
        }

        type Settings
            @authorization(
                validate: [
                    { where: { node: { tenant: { some: { admins: { some: { userId: { eq: "$jwt.id" } } } } } } } }
                ]
            )
            @node {
            id: ID! @id
            tenant: [Tenant!]! @relationship(type: "HAS_SETTINGS", direction: IN)
            openingDays: [OpeningDay!]! @relationship(type: "VALID_OPENING_DAYS", direction: OUT)
            name: String
        }

        type OpeningDay
            @node
            @authorization(
                validate: [
                    {
                        where: {
                            node: {
                                settings: {
                                    some: { tenant: { some: { admins: { some: { userId: { eq: "$jwt.id" } } } } } }
                                }
                            }
                        }
                    }
                ]
            ) {
            id: ID! @id
            settings: [Settings!]! @relationship(type: "VALID_GARAGES", direction: IN)
            open: [OpeningHoursInterval!]! @relationship(type: "HAS_OPEN_INTERVALS", direction: OUT)
        }

        type OpeningHoursInterval
            @node
            @authorization(
                validate: [
                    {
                        where: {
                            node: {
                                openingDay: {
                                    some: {
                                        settings: {
                                            some: {
                                                tenant: { some: { admins: { some: { userId: { eq: "$jwt.id" } } } } }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            ) {
            name: String
            openingDay: [OpeningDay!]! @relationship(type: "HAS_OPEN_INTERVALS", direction: IN)
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
                            },
                        },
                    },
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL(*) {
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
            MERGE (this0_settings0_node)-[:VALID_OPENING_DAYS]->(this0_settings0_node_openingDays0_node)
            MERGE (this0)-[:HAS_SETTINGS]->(this0_settings0_node)
            WITH *
            CREATE (this0_admins0_node:User)
            SET this0_admins0_node.userId = $this0_admins0_node_userId
            MERGE (this0)<-[:ADMIN_IN]-(this0_admins0_node)
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this0_settings0_node_openingDays0_node_open0_node)<-[:HAS_OPEN_INTERVALS]-(authorization_0_0_0_0_0_0_0_0_0_0_after_this0:OpeningDay)
                WHERE EXISTS {
                    MATCH (authorization_0_0_0_0_0_0_0_0_0_0_after_this0)<-[:VALID_GARAGES]-(authorization_0_0_0_0_0_0_0_0_0_0_after_this1:Settings)
                    WHERE EXISTS {
                        MATCH (authorization_0_0_0_0_0_0_0_0_0_0_after_this1)<-[:HAS_SETTINGS]-(authorization_0_0_0_0_0_0_0_0_0_0_after_this2:Tenant)
                        WHERE EXISTS {
                            MATCH (authorization_0_0_0_0_0_0_0_0_0_0_after_this2)<-[:ADMIN_IN]-(authorization_0_0_0_0_0_0_0_0_0_0_after_this3:User)
                            WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_0_0_0_0_0_0_after_this3.userId = $jwt.id)
                        }
                    }
                }
            }), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this0_settings0_node_openingDays0_node)<-[:VALID_GARAGES]-(authorization_0_0_0_0_0_0_0_after_this0:Settings)
                WHERE EXISTS {
                    MATCH (authorization_0_0_0_0_0_0_0_after_this0)<-[:HAS_SETTINGS]-(authorization_0_0_0_0_0_0_0_after_this1:Tenant)
                    WHERE EXISTS {
                        MATCH (authorization_0_0_0_0_0_0_0_after_this1)<-[:ADMIN_IN]-(authorization_0_0_0_0_0_0_0_after_this2:User)
                        WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_0_0_0_after_this2.userId = $jwt.id)
                    }
                }
            }), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this0_settings0_node)<-[:HAS_SETTINGS]-(authorization_0_0_0_0_after_this0:Tenant)
                WHERE EXISTS {
                    MATCH (authorization_0_0_0_0_after_this0)<-[:ADMIN_IN]-(authorization_0_0_0_0_after_this1:User)
                    WHERE ($jwt.id IS NOT NULL AND authorization_0_0_0_0_after_this1.userId = $jwt.id)
                }
            }), \\"@neo4j/graphql/FORBIDDEN\\", [0]) AND apoc.util.validatePredicate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this0)<-[:ADMIN_IN]-(authorization_0_after_this0:User)
                WHERE ($jwt.id IS NOT NULL AND authorization_0_after_this0.userId = $jwt.id)
            }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            RETURN this0
            }
            CALL (this0) {
                CALL (this0) {
                    MATCH (this0)<-[create_this0:ADMIN_IN]-(create_this1:User)
                    WITH DISTINCT create_this1
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.id IS NOT NULL AND create_this1.userId = $jwt.id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
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
                \\"this0_admins0_node_userId\\": \\"123\\",
                \\"resolvedCallbacks\\": {
                    \\"this0_settings0_node_openingDays0_node_open0_node_updatedBy_getUserIDFromContext\\": \\"hi\\"
                }
            }"
        `);
    });
});
