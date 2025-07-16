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

describe("https://github.com/neo4j/graphql/issues/4223", () => {
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
            settings: [Settings!]! @relationship(type: "VEHICLECARD_OWNER", direction: IN)
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
            myWorkspace: [MyWorkspace!]! @relationship(type: "HAS_WORKSPACE_SETTINGS", direction: OUT)
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

        type MyWorkspace
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
            settings: [Settings!]! @relationship(type: "HAS_WORKSPACE_SETTINGS", direction: IN)
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
            "CYPHER 5
            CALL {
                CREATE (this0:Tenant)
                SET
                    this0.id = randomUUID()
                WITH *
                CREATE (this1:Settings)
                WITH *
                CREATE (this2:OpeningDay)
                WITH *
                CREATE (this3:OpeningHoursInterval)
                MERGE (this2)-[this4:HAS_OPEN_INTERVALS]->(this3)
                SET
                    this3.name = $param0
                MERGE (this1)-[this5:VALID_OPENING_DAYS]->(this2)
                SET
                    this2.id = randomUUID()
                WITH *
                CREATE (this6:MyWorkspace)
                MERGE (this1)-[this7:HAS_WORKSPACE_SETTINGS]->(this6)
                SET
                    this6.workspace = $param1
                MERGE (this0)<-[this8:VEHICLECARD_OWNER]-(this1)
                SET
                    this1.id = randomUUID()
                WITH *
                CREATE (this9:User)
                MERGE (this0)<-[this10:ADMIN_IN]-(this9)
                SET
                    this9.userId = $param2
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this0)<-[:ADMIN_IN]-(this11:User)
                    WHERE ($jwt.id IS NOT NULL AND this11.userId = $jwt.id)
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this0)<-[:ADMIN_IN]-(this12:User)
                    WHERE ($jwt.id IS NOT NULL AND this12.userId = $jwt.id)
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_SETTINGS]-(this13:Tenant)
                    WHERE EXISTS {
                        MATCH (this13)<-[:ADMIN_IN]-(this14:User)
                        WHERE ($jwt.id IS NOT NULL AND this14.userId = $jwt.id)
                    }
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this2)<-[:VALID_GARAGES]-(this15:Settings)
                    WHERE EXISTS {
                        MATCH (this15)<-[:HAS_SETTINGS]-(this16:Tenant)
                        WHERE EXISTS {
                            MATCH (this16)<-[:ADMIN_IN]-(this17:User)
                            WHERE ($jwt.id IS NOT NULL AND this17.userId = $jwt.id)
                        }
                    }
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this3)<-[:HAS_OPEN_INTERVALS]-(this18:OpeningDay)
                    WHERE EXISTS {
                        MATCH (this18)<-[:VALID_GARAGES]-(this19:Settings)
                        WHERE EXISTS {
                            MATCH (this19)<-[:HAS_SETTINGS]-(this20:Tenant)
                            WHERE EXISTS {
                                MATCH (this20)<-[:ADMIN_IN]-(this21:User)
                                WHERE ($jwt.id IS NOT NULL AND this21.userId = $jwt.id)
                            }
                        }
                    }
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this6)<-[:HAS_WORKSPACE_SETTINGS]-(this22:Settings)
                    WHERE EXISTS {
                        MATCH (this22)<-[:HAS_SETTINGS]-(this23:Tenant)
                        WHERE EXISTS {
                            MATCH (this23)<-[:ADMIN_IN]-(this24:User)
                            WHERE ($jwt.id IS NOT NULL AND this24.userId = $jwt.id)
                        }
                    }
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN this0 AS this
            }
            WITH this
            CALL (this) {
                CALL (this) {
                    MATCH (this)<-[this25:ADMIN_IN]-(this26:User)
                    WITH DISTINCT this26
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.id IS NOT NULL AND this26.userId = $jwt.id)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this26 { .userId } AS this26
                    RETURN collect(this26) AS var27
                }
                RETURN this { .id, admins: var27 } AS var28
            }
            RETURN collect(var28) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"lambo\\",
                \\"param1\\": \\"myWorkspace\\",
                \\"param2\\": \\"123\\",
                \\"isAuthenticated\\": false,
                \\"jwt\\": {}
            }"
        `);
    });
});
