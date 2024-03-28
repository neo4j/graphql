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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4170", () => {
    const testHelper = new TestHelper();

    let User: UniqueType;
    let Tenant: UniqueType;
    let Settings: UniqueType;
    let OpeningDay: UniqueType;
    let OpeningHoursInterval: UniqueType;

    let tenantVariables: Record<string, any>;
    let myUserId: string;

    let typeDefs: string;
    let ADD_TENANT: string;

    beforeEach(() => {
        myUserId = Math.random().toString(36).slice(2, 7);

        User = testHelper.createUniqueType("User");
        Tenant = testHelper.createUniqueType("Tenant");
        Settings = testHelper.createUniqueType("Settings");
        OpeningDay = testHelper.createUniqueType("OpeningDay");
        OpeningHoursInterval = testHelper.createUniqueType("OpeningHoursInterval");

        typeDefs = `
            type JWT @jwt {
                id: String
                roles: [String]
            }
            type ${User.name} @authorization(validate: [{ where: { node: { userId: "$jwt.id" } }, operations: [READ] }]) {
                userId: String! @unique
                adminAccess: [${Tenant.name}!]! @relationship(type: "ADMIN_IN", direction: OUT)
            }
    
            type ${Tenant.name} @authorization(validate: [{ where: { node: { admins: { userId: "$jwt.id" } } } }]) {
                id: ID! @id
                settings: ${Settings.name}! @relationship(type: "HAS_SETTINGS", direction: OUT)
                admins: [${User.name}!]! @relationship(type: "ADMIN_IN", direction: IN)
            }
    
            type ${Settings.name} @authorization(validate: [{ where: { node: { tenant: { admins: { userId: "$jwt.id" } } } } }]) {
                id: ID! @id
                tenant: ${Tenant.name}! @relationship(type: "HAS_SETTINGS", direction: IN)
                openingDays: [${OpeningDay.name}!]! @relationship(type: "VALID_OPENING_DAYS", direction: OUT)
                name: String
            }
    
            type ${OpeningDay.name}
                @authorization(
                    validate: [{ where: { node: { settings: { tenant: { admins: { userId: "$jwt.id" } } } } } }]
                ) {
                id: ID! @id
                settings: ${Settings.name} @relationship(type: "VALID_GARAGES", direction: IN)
                open: [${OpeningHoursInterval.name}!]! @relationship(type: "HAS_OPEN_INTERVALS", direction: OUT)
            }
    
            type ${OpeningHoursInterval.name}
                @authorization(
                    validate: [
                        { where: { node: { openingDay: { settings: { tenant: { admins: { userId: "$jwt.id" } } } } } } }
                    ]
                ) {
                name: String
                openingDay: ${OpeningDay.name}! @relationship(type: "HAS_OPEN_INTERVALS", direction: IN)
                updatedBy: String @populatedBy(callback: "getUserIDFromContext", operations: [CREATE, UPDATE])
            }
        `;

        ADD_TENANT = `
            mutation addTenant($input: [${Tenant.name}CreateInput!]!) {
                ${Tenant.operations.create}(input: $input) {
                    ${Tenant.plural} {
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

        tenantVariables = {
            input: {
                admins: {
                    create: {
                        node: { userId: myUserId },
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
        };
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("create tenant with nested openingDays and openHoursInterval - subscriptions disabled", async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        getUserIDFromContext: () => "hi",
                    },
                },
            },
        });

        const addTenantResponse = await testHelper.executeGraphQL(ADD_TENANT, {
            variableValues: tenantVariables,
            contextValue: { jwt: { id: myUserId } },
        });

        expect(addTenantResponse.errors?.[0]?.message).toContain("Forbidden");
    });

    test("create tenant with nested openingDays and openHoursInterval - subscriptions enabled", async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: true,
                populatedBy: {
                    callbacks: {
                        getUserIDFromContext: () => "hi",
                    },
                },
            },
        });

        const addTenantResponse = await testHelper.executeGraphQL(ADD_TENANT, {
            variableValues: tenantVariables,
            contextValue: { jwt: { id: myUserId } },
        });

        expect(addTenantResponse.errors?.[0]?.message).toContain("Forbidden");
    });
});
