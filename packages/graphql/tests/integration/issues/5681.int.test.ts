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

describe("https://github.com/neo4j/graphql/issues/5635", () => {
    let User: UniqueType;
    let Tenant: UniqueType;
    let Garage: UniqueType;
    let VehicleCard: UniqueType;

    const testHelper = new TestHelper();

    const usernameCallback = (_parent, _args, context) => {
        const userId = context.jwt?.id;

        if (typeof userId === "string") {
            return userId;
        }
        return undefined;
    };

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Tenant = testHelper.createUniqueType("Tenant");
        Garage = testHelper.createUniqueType("Garage");
        VehicleCard = testHelper.createUniqueType("VehicleCard");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                roles: [String!]!
                id: String
                sub: String
            }

            type ${User}
                @node
                @authorization(
                    validate: [
                        { where: { node: { userId_EQ: "$jwt.sub" } } }
                        { where: { jwt: { roles_INCLUDES: "overlord" } } }
                    ]
                )
                @authentication(
                    operations: [UPDATE, DELETE, CREATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP, SUBSCRIBE]
                    jwt: { roles_INCLUDES: "overlord" }
                ) {
                userId: String!
                adminAccess: [${Tenant}!]! @relationship(type: "ADMIN_IN", direction: OUT)
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
                updatedBy: String @populatedBy(callback: "getUserIDFromContext", operations: [CREATE, UPDATE])
            }

            type ${Tenant}
                @node
                @authentication(
                    operations: [UPDATE, DELETE, CREATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP, SUBSCRIBE]
                    jwt: { roles_INCLUDES: "overlord" }
                ) {
                id: ID! @id
                admins: [${User}!]! @relationship(type: "ADMIN_IN", direction: IN)
                garages: [${Garage}!]! @relationship(type: "TENANT_HAS_GARAGE", direction: IN)
                vehiclecards: [${VehicleCard}!]! @relationship(type: "VEHICLECARD_OWNER", direction: IN)
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
                updatedBy: String @populatedBy(callback: "getUserIDFromContext", operations: [CREATE, UPDATE])
            }

            type ${Garage}
                @node
                @authentication(
                    operations: [UPDATE, DELETE, CREATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP, SUBSCRIBE]
                    jwt: { roles_INCLUDES: "overlord" }
                ) {
                id: ID! @id
                tenant: [${Tenant}!]! @relationship(type: "TENANT_HAS_GARAGE", direction: OUT)
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
                updatedBy: String @populatedBy(callback: "getUserIDFromContext", operations: [CREATE, UPDATE])
            }

            type ${VehicleCard}
                @node
                @authentication(
                    operations: [UPDATE, DELETE, CREATE, CREATE_RELATIONSHIP, DELETE_RELATIONSHIP, SUBSCRIBE]
                    jwt: { roles_INCLUDES: "overlord" }
                ) {
                id: ID! @id
                tenant: [${Tenant}!]! @relationship(type: "VEHICLECARD_OWNER", direction: OUT) # <---  this line
                garages: [${Garage}!]! @relationship(type: "VALID_GARAGES", direction: OUT)
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
                updatedBy: String @populatedBy(callback: "getUserIDFromContext", operations: [CREATE, UPDATE])
            }

            extend schema @authentication @query(read: true, aggregate: false)
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                populatedBy: {
                    callbacks: {
                        getUserIDFromContext: usernameCallback,
                    },
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should not throw invalid argument error", async () => {
        const myUserId = "userId";

        const ADD_TENANT = /* GraphQL */ `
            mutation addTenant($input: [${Tenant}CreateInput!]!) {
                ${Tenant.operations.create}(input: $input) {
                    ${Tenant.plural} {
                        id
                        admins {
                            userId
                        }
                    }
                }
            }
        `;
        const tenantVariables = {
            input: {
                admins: {
                    create: {
                        node: { userId: myUserId },
                    },
                },
            },
        };

        const tenantResult = await testHelper.executeGraphQL(ADD_TENANT, {
            variableValues: tenantVariables,
            contextValue: { jwt: { id: myUserId, roles: ["overlord"] } },
        });
        expect(tenantResult.errors).toBeUndefined();
        expect(tenantResult.data as any).toEqual({
            [Tenant.operations.create]: {
                [Tenant.plural]: [
                    {
                        id: expect.any(String),
                        admins: [{ userId: myUserId }],
                    },
                ],
            },
        });

        const ADD_GARAGES = /* GraphQL */ `
            mutation addGarages($input: [${Garage}CreateInput!]!) {
                ${Garage.operations.create}(input: $input) {
                    ${Garage.plural} {
                        id
                    }
                }
            }
        `;
        const garageInput = (tenantId) => ({
            tenant: {
                connect: {
                    where: {
                        node: {
                            id_EQ: tenantId,
                        },
                    },
                },
            },
        });

        const garageResult = await testHelper.executeGraphQL(ADD_GARAGES, {
            variableValues: {
                input: garageInput(tenantResult.data?.[Tenant.operations.create]?.[Tenant.plural][0].id),
            },
            contextValue: { jwt: { id: myUserId, roles: ["overlord"] } },
        });
        expect(garageResult.errors).toBeUndefined();
        expect(garageResult.data as any).toEqual({
            [Garage.operations.create]: {
                [Garage.plural]: [
                    {
                        id: expect.any(String),
                    },
                ],
            },
        });

        const ADD_VEHICLE_CARD = /* GraphQL */ `
            mutation addVehicleCard($input: [${VehicleCard}CreateInput!]!) {
                ${VehicleCard.operations.create}(input: $input) {
                    ${VehicleCard.plural} {
                        id
                    }
                }
            }
        `;
        const vehicleCardInput = ({ garageId, tenantId }) => ({
            tenant: {
                connect: {
                    where: {
                        node: {
                            id_EQ: tenantId,
                        },
                    },
                },
            },
            garages: {
                connect: {
                    where: {
                        node: {
                            id_EQ: garageId,
                        },
                    },
                },
            },
        });

        const vehicleCardResult = await testHelper.executeGraphQL(ADD_VEHICLE_CARD, {
            variableValues: {
                input: vehicleCardInput({
                    garageId: garageResult.data?.[Garage.operations.create]?.[Garage.plural][0].id,
                    tenantId: tenantResult.data?.[Tenant.operations.create]?.[Tenant.plural][0].id,
                }),
            },
            contextValue: { jwt: { id: myUserId, roles: ["overlord"] } },
        });
        expect(vehicleCardResult.errors).toBeUndefined();
        expect(vehicleCardResult.data as any).toEqual({
            [VehicleCard.operations.create]: {
                [VehicleCard.plural]: [
                    {
                        id: expect.any(String),
                    },
                ],
            },
        });
    });
});
