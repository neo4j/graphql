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
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: String
            }
            type User @authorization(filter: [{ where: { node: { userId: { eq: "$jwt.id" } } } }]) @node {
                userId: String!
                adminAccess: [Tenant!]! @relationship(type: "ADMIN_IN", direction: OUT, aggregate: false)
            }

            type Tenant
                @authorization(validate: [{ where: { node: { admins: { some: { userId: { eq: "$jwt.id" } } } } } }])
                @node {
                id: ID! @id
                admins: [User!]! @relationship(type: "ADMIN_IN", direction: IN, aggregate: false)
                settings: [Settings!]! @relationship(type: "HAS_SETTINGS", direction: OUT, aggregate: false)
            }

            type Settings
                @node
                @authorization(
                    validate: [
                        { where: { node: { tenant: { some: { admins: { some: { userId: { eq: "$jwt.id" } } } } } } } }
                    ]
                ) {
                tenant: [Tenant!]! @relationship(type: "HAS_SETTINGS", direction: IN, aggregate: false)
                extendedOpeningHours: [OpeningDay!]!
                    @relationship(type: "HAS_OPENING_HOURS", direction: OUT, aggregate: false)
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
                settings: [Settings!]! @relationship(type: "HAS_OPENING_HOURS", direction: IN, aggregate: false)
                date: Date
                open: [OpeningHoursInterval!]!
                    @relationship(type: "HAS_OPEN_INTERVALS", direction: OUT, aggregate: false)
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
                                                    tenant: {
                                                        some: { admins: { some: { userId: { eq: "$jwt.id" } } } }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    ]
                ) {
                openingDay: [OpeningDay!]! @relationship(type: "HAS_OPEN_INTERVALS", direction: IN, aggregate: false)
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
            "CYPHER 5
            MATCH (this:Tenant)
            WITH *
            WITH *
            CALL (*) {
                MATCH (this)-[this0:HAS_SETTINGS]->(this1:Settings)
                WITH *
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_SETTINGS]-(this2:Tenant)
                    WHERE EXISTS {
                        MATCH (this2)<-[:ADMIN_IN]-(this3:User)
                        WHERE ($jwt.id IS NOT NULL AND this3.userId = $jwt.id)
                    }
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                WITH *
                WITH *
                CALL (*) {
                    OPTIONAL MATCH (this1)-[this4:HAS_OPENING_HOURS]->(this5:OpeningDay)
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this5)<-[:HAS_OPENING_HOURS]-(this6:Settings)
                        WHERE EXISTS {
                            MATCH (this6)<-[:HAS_SETTINGS]-(this7:Tenant)
                            WHERE EXISTS {
                                MATCH (this7)<-[:ADMIN_IN]-(this8:User)
                                WHERE ($jwt.id IS NOT NULL AND this8.userId = $jwt.id)
                            }
                        }
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    WITH this4, collect(DISTINCT this5) AS var9
                    CALL (var9) {
                        UNWIND var9 AS var10
                        DETACH DELETE var10
                    }
                }
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this1)<-[:HAS_SETTINGS]-(this11:Tenant)
                    WHERE EXISTS {
                        MATCH (this11)<-[:ADMIN_IN]-(this12:User)
                        WHERE ($jwt.id IS NOT NULL AND this12.userId = $jwt.id)
                    }
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            }
            WITH this
            WITH *
            CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                MATCH (this)<-[:ADMIN_IN]-(this13:User)
                WHERE ($jwt.id IS NOT NULL AND this13.userId = $jwt.id)
            }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            CALL (this) {
                MATCH (this)-[this14:HAS_SETTINGS]->(this15:Settings)
                WITH DISTINCT this15
                WITH *
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                    MATCH (this15)<-[:HAS_SETTINGS]-(this16:Tenant)
                    WHERE EXISTS {
                        MATCH (this16)<-[:ADMIN_IN]-(this17:User)
                        WHERE ($jwt.id IS NOT NULL AND this17.userId = $jwt.id)
                    }
                }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                CALL (this15) {
                    MATCH (this15)-[this18:HAS_OPENING_HOURS]->(this19:OpeningDay)
                    WITH DISTINCT this19
                    WITH *
                    CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                        MATCH (this19)<-[:HAS_OPENING_HOURS]-(this20:Settings)
                        WHERE EXISTS {
                            MATCH (this20)<-[:HAS_SETTINGS]-(this21:Tenant)
                            WHERE EXISTS {
                                MATCH (this21)<-[:ADMIN_IN]-(this22:User)
                                WHERE ($jwt.id IS NOT NULL AND this22.userId = $jwt.id)
                            }
                        }
                    }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                    CALL (this19) {
                        MATCH (this19)-[this23:HAS_OPEN_INTERVALS]->(this24:OpeningHoursInterval)
                        WITH DISTINCT this24
                        WITH *
                        CALL apoc.util.validate(NOT ($isAuthenticated = true AND EXISTS {
                            MATCH (this24)<-[:HAS_OPEN_INTERVALS]-(this25:OpeningDay)
                            WHERE EXISTS {
                                MATCH (this25)<-[:HAS_OPENING_HOURS]-(this26:Settings)
                                WHERE EXISTS {
                                    MATCH (this26)<-[:HAS_SETTINGS]-(this27:Tenant)
                                    WHERE EXISTS {
                                        MATCH (this27)<-[:ADMIN_IN]-(this28:User)
                                        WHERE ($jwt.id IS NOT NULL AND this28.userId = $jwt.id)
                                    }
                                }
                            }
                        }), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                        WITH this24 { .name } AS this24
                        RETURN collect(this24) AS var29
                    }
                    WITH this19 { open: var29 } AS this19
                    RETURN collect(this19) AS var30
                }
                WITH this15 { extendedOpeningHours: var30 } AS this15
                RETURN collect(this15) AS var31
            }
            RETURN this { settings: var31 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"id\\": \\"myUserId\\"
                }
            }"
        `);
    });
});
