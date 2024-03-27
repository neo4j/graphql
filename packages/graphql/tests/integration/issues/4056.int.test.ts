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

import type { GraphQLResponse } from "@apollo/server";
import { ApolloServer } from "@apollo/server";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4056", () => {
    const testHelper = new TestHelper();

    let User: UniqueType;
    let Tenant: UniqueType;
    let Settings: UniqueType;
    let OpeningDay: UniqueType;

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

        typeDefs = /* GraphQL */ `
        type JWT @jwt {
            id: String
            roles: [String]
          }
          type ${User}
            @authorization(
                validate: [
                    { where: { node: { userId: "$jwt.id" } }, operations: [READ] }
                    { where: { jwt: { roles_INCLUDES: "overlord" } } }
                ]
            ) {
            userId: String! @unique
            adminAccess: [${Tenant}!]! @relationship(type: "ADMIN_IN", direction: OUT)
          }
          
          
          type ${Tenant}
            @authorization(
                validate: [
                    { where: { node: { admins: { userId: "$jwt.id" } } } }
                    { where: { jwt: { roles_INCLUDES: "overlord" } } }
                ]
            ) {
            id: ID! @id
            settings: ${Settings}! @relationship(type: "HAS_SETTINGS", direction: OUT)
            admins: [${User}!]! @relationship(type: "ADMIN_IN", direction: IN)
          }
          
          
          type ${Settings} {
            id: ID! @id
            tenant: ${Tenant}! @relationship(type: "HAS_SETTINGS", direction: IN)
            openingDays: [${OpeningDay}!]! @relationship(type: "VALID_OPENING_DAYS", direction: OUT)
            name: String
            updatedBy: String @populatedBy(callback: "getUserIDFromContext", operations: [CREATE, UPDATE])
          }
          
          type ${OpeningDay}
            @authorization(
                validate: [
                {  where: { node: {settings: { tenant: { admins: { userId: "$jwt.id" } } } } } }
                { where: { jwt: { roles_INCLUDES: "overlord" } } }
            ]
            ) {
            id: ID! @id
            settings: ${Settings} @relationship(type: "VALID_OPENING_DAYS", direction: IN)
            name: String
            updatedBy: String @populatedBy(callback: "getUserIDFromContext", operations: [CREATE, UPDATE])
          }
        `;

        ADD_TENANT = /* GraphQL */ `
            mutation addTenant($input: [${Tenant}CreateInput!]!) {
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

        ADD_OPENING_DAYS = /* GraphQL */ `
            mutation addOpeningDays($input: [${OpeningDay}CreateInput!]!) {
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
                            openingDays: {
                                create: [
                                    {
                                        node: {
                                            name: "MONDAY",
                                        },
                                    },
                                ],
                            },
                        },
                    },
                },
            },
        };
        openingDayInput = (settingsId) => ({
            settings: {
                connect: {
                    where: {
                        node: {
                            id: settingsId,
                        },
                    },
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("create tenant and add opening days - subscriptions disabled", async () => {
        const neo4jGraphql = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        getUserIDFromContext: (_parent, _args, context) => {
                            const userId = context.jwt?.id;
                            if (typeof userId === "string") {
                                return userId;
                            }
                            return undefined;
                        },
                    },
                },
            },
        });
        const apolloServer = new ApolloServer({
            schema: await neo4jGraphql.getSchema(),
            introspection: true,
        });

        const addTenantResponse = await apolloServer.executeOperation(
            { query: ADD_TENANT, variables: tenantVariables },
            { contextValue: { jwt: { id: myUserId, roles: ["overlord"] } } }
        );
        expect(addTenantResponse).toMatchObject({
            body: {
                singleResult: {
                    data: {
                        [Tenant.operations.create]: {
                            [Tenant.plural]: [{ id: expect.any(String), admins: [{ userId: myUserId }] }],
                        },
                    },
                },
            },
        });

        const settingsId = (addTenantResponse.body as GraphQLResponse["body"] & { singleResult: any }).singleResult
            .data[Tenant.operations.create][Tenant.plural][0].settings.id;
        const userId = (addTenantResponse.body as GraphQLResponse["body"] & { singleResult: any }).singleResult.data[
            Tenant.operations.create
        ][Tenant.plural][0].admins[0].userId;

        const addOpeningDaysResponse = await apolloServer.executeOperation(
            { query: ADD_OPENING_DAYS, variables: { input: openingDayInput(settingsId) } },
            { contextValue: { jwt: { id: userId } } }
        );
        expect(addOpeningDaysResponse).toMatchObject({
            body: {
                singleResult: {
                    data: { [OpeningDay.operations.create]: { [OpeningDay.plural]: [{ id: expect.any(String) }] } },
                },
            },
        });
    });

    test("create tenant and add opening days - subscriptions enabled", async () => {
        const neo4jGraphql = await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: true,
                populatedBy: {
                    callbacks: {
                        getUserIDFromContext: (_parent, _args, context) => {
                            const userId = context.jwt?.id;
                            if (typeof userId === "string") {
                                return userId;
                            }
                            return undefined;
                        },
                    },
                },
            },
        });
        const apolloServer = new ApolloServer({
            schema: await neo4jGraphql.getSchema(),
            introspection: true,
        });

        const addTenantResponse = await apolloServer.executeOperation(
            { query: ADD_TENANT, variables: tenantVariables },
            { contextValue: { jwt: { id: myUserId, roles: ["overlord"] } } }
        );
        expect(addTenantResponse).toMatchObject({
            body: {
                singleResult: {
                    data: {
                        [Tenant.operations.create]: {
                            [Tenant.plural]: [{ id: expect.any(String), admins: [{ userId: myUserId }] }],
                        },
                    },
                },
            },
        });

        const settingsId = (addTenantResponse.body as GraphQLResponse["body"] & { singleResult: any }).singleResult
            .data[Tenant.operations.create][Tenant.plural][0].settings.id;
        const userId = (addTenantResponse.body as GraphQLResponse["body"] & { singleResult: any }).singleResult.data[
            Tenant.operations.create
        ][Tenant.plural][0].admins[0].userId;

        const addOpeningDaysResponse = await apolloServer.executeOperation(
            { query: ADD_OPENING_DAYS, variables: { input: openingDayInput(settingsId) } },
            { contextValue: { jwt: { id: userId } } }
        );
        expect(addOpeningDaysResponse).toMatchObject({
            body: {
                singleResult: {
                    data: { [OpeningDay.operations.create]: { [OpeningDay.plural]: [{ id: expect.any(String) }] } },
                },
            },
        });
    });
});
