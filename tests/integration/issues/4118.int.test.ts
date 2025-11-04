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

describe("https://github.com/neo4j/graphql/issues/4118", () => {
    const testHelper = new TestHelper();

    let User: UniqueType;
    let Tenant: UniqueType;
    let Settings: UniqueType;
    let OpeningDay: UniqueType;
    let LOL: UniqueType;

    let typeDefs: string;
    let ADD_TENANT: string;
    let ADD_OPENING_DAYS: string;

    let tenantVariables: Record<string, any>;
    let openingDayInput: (settingsId: any) => Record<string, any>;
    let myUserId: string;

    beforeEach(() => {
        User = testHelper.createUniqueType("User");
        Tenant = testHelper.createUniqueType("Tenant");
        Settings = testHelper.createUniqueType("Settings");
        OpeningDay = testHelper.createUniqueType("OpeningDay");
        LOL = testHelper.createUniqueType("LOL");

        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: String
                roles: [String]
            }
            type ${User.name}
                @authorization(
                    validate: [
                        { where: { node: { userId: "$jwt.id" } }, operations: [READ] }
                        { where: { jwt: { roles_INCLUDES: "overlord" } } }
                    ]
                ) {
                userId: String! @unique
                adminAccess: [${Tenant.name}!]! @relationship(type: "ADMIN_IN", direction: OUT)
            }
    
            type ${Tenant.name}
                @authorization(
                    validate: [
                        { where: { node: { admins: { userId: "$jwt.id" } } } }
                        { where: { jwt: { roles_INCLUDES: "overlord" } } }
                    ]
                ) {
                id: ID! @id
                settings: ${Settings.name}! @relationship(type: "HAS_SETTINGS", direction: OUT)
                admins: [${User.name}!]! @relationship(type: "ADMIN_IN", direction: IN)
            }
    
            type ${Settings.name}
                @authorization(
                    validate: [
                        { where: { node: { tenant: { admins: { userId: "$jwt.id" } } } } }
                        { where: { jwt: { roles_INCLUDES: "overlord" } } }
                    ]
                ) {
                id: ID! @id
                tenant: ${Tenant.name}! @relationship(type: "HAS_SETTINGS", direction: IN)
                openingDays: [${OpeningDay.name}!]! @relationship(type: "VALID_OPENING_DAYS", direction: OUT)
                name: String
            }
    
            type ${OpeningDay.name}
                @authorization(
                    validate: [{ where: { node: { settings: { tenant: { admins: { userId: "$jwt.id" } } } } } }]
                ) {
                settings: ${Settings.name} @relationship(type: "VALID_OPENING_DAYS", direction: IN)
                id: ID! @id
                name: String
            }
    
            type ${LOL.name} @authorization(validate: [{ where: { node: { host: { admins: { userId: "$jwt.id" } } } } }]) {
                host: ${Tenant.name}! @relationship(type: "HOSTED_BY", direction: OUT)
                openingDays: [${OpeningDay.name}!]! @relationship(type: "HAS_OPENING_DAY", direction: OUT)
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
                            id
                        }
                    }
                }
            }
        `;

        ADD_OPENING_DAYS = `
            mutation addOpeningDays($input: [${OpeningDay.name}CreateInput!]!) {
                ${OpeningDay.operations.create}(input: $input) {
                    ${OpeningDay.plural} {
                        id
                    }
                }
            }
        `;

        myUserId = Math.random().toString(36).slice(2, 7);
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
                            name: "hi",
                        },
                    },
                },
            },
        };
        openingDayInput = (settingsId) => ({
            input: {
                settings: {
                    connect: {
                        where: {
                            node: {
                                id: settingsId,
                            },
                        },
                    },
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });
    test("create lols - subscriptions disabled", async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const addTenantResponse = await testHelper.executeGraphQL(ADD_TENANT, {
            variableValues: tenantVariables,
            contextValue: { jwt: { id: myUserId, roles: ["overlord"] } },
        });
        expect(addTenantResponse).toMatchObject({
            data: {
                [Tenant.operations.create]: {
                    [Tenant.plural]: [{ id: expect.any(String), admins: [{ userId: myUserId }] }],
                },
            },
        });

        const settingsId = (addTenantResponse.data as any)[Tenant.operations.create][Tenant.plural][0].settings.id;
        const addOpeningDaysResponse = await testHelper.executeGraphQL(ADD_OPENING_DAYS, {
            variableValues: openingDayInput(settingsId),
            contextValue: { jwt: { id: myUserId, roles: ["overlord"] } },
        });
        expect(addOpeningDaysResponse).toMatchObject({
            data: { [OpeningDay.operations.create]: { [OpeningDay.plural]: [{ id: expect.any(String) }] } },
        });
        const openingDayId = (addOpeningDaysResponse.data as any)[OpeningDay.operations.create][OpeningDay.plural][0]
            .id;

        const addLolsQuery = `
            mutation addLols($input: [${LOL.name}CreateInput!]!) {
                ${LOL.operations.create}(input: $input) {
                    ${LOL.plural} {
                        host {
                            id
                        }
                    }
                }
            }`;

        const addLolResponse = await testHelper.executeGraphQL(addLolsQuery, {
            variableValues: {
                input: {
                    host: {
                        connect: {
                            where: {
                                node: {
                                    id: myUserId,
                                },
                            },
                        },
                    },
                    openingDays: {
                        connect: {
                            where: {
                                node: {
                                    id: openingDayId,
                                },
                            },
                        },
                    },
                },
            },
            contextValue: { jwt: { id: myUserId, roles: ["overlord"] } },
        });

        expect(addLolResponse.errors?.[0]?.message).toContain("Forbidden");
    });

    test("create lols - subscriptions enabled", async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: true,
            },
        });

        const addTenantResponse = await testHelper.executeGraphQL(ADD_TENANT, {
            variableValues: tenantVariables,
            contextValue: { jwt: { id: myUserId, roles: ["overlord"] } },
        });
        expect(addTenantResponse).toMatchObject({
            data: {
                [Tenant.operations.create]: {
                    [Tenant.plural]: [{ id: expect.any(String), admins: [{ userId: myUserId }] }],
                },
            },
        });

        const settingsId = (addTenantResponse.data as any)[Tenant.operations.create][Tenant.plural][0].settings.id;
        const addOpeningDaysResponse = await testHelper.executeGraphQL(ADD_OPENING_DAYS, {
            variableValues: openingDayInput(settingsId),
            contextValue: { jwt: { id: myUserId, roles: ["overlord"] } },
        });
        expect(addOpeningDaysResponse).toMatchObject({
            data: { [OpeningDay.operations.create]: { [OpeningDay.plural]: [{ id: expect.any(String) }] } },
        });
        const openingDayId = (addOpeningDaysResponse.data as any)[OpeningDay.operations.create][OpeningDay.plural][0]
            .id;

        const addLolsSource = `
            mutation addLols($input: [${LOL.name}CreateInput!]!) {
                ${LOL.operations.create}(input: $input) {
                    ${LOL.plural} {
                        host {
                            id
                        }
                    }
                }
            }
        `;

        const addLolResponse = await testHelper.executeGraphQL(addLolsSource, {
            variableValues: {
                input: {
                    host: {
                        connect: {
                            where: {
                                node: {
                                    id: myUserId,
                                },
                            },
                        },
                    },
                    openingDays: {
                        connect: {
                            where: {
                                node: {
                                    id: openingDayId,
                                },
                            },
                        },
                    },
                },
            },
            contextValue: { jwt: { id: myUserId, roles: ["overlord"] } },
        });

        expect(addLolResponse.errors?.[0]?.message).toContain("Forbidden");
    });
});
