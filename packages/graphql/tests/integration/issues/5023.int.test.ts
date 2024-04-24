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

describe("https://github.com/neo4j/graphql/issues/5013", () => {
    const testHelper = new TestHelper();
    const myUserId = "myUserId";

    let User: UniqueType;
    let Tenant: UniqueType;
    let Settings: UniqueType;
    let OpeningDay: UniqueType;
    let OpeningHoursInterval: UniqueType;

    beforeAll(async () => {
        User = testHelper.createUniqueType("User");
        Tenant = testHelper.createUniqueType("Tenant");
        Settings = testHelper.createUniqueType("Settings");
        OpeningDay = testHelper.createUniqueType("OpeningDay");
        OpeningHoursInterval = testHelper.createUniqueType("OpeningHoursInterval");

        const typeDefs = `
        type JWT @jwt {
            id: String
        }
        type ${User} @authorization(filter: [{ where: { node: { userId: "$jwt.id" } } }]) {
            userId: String! @unique
            adminAccess: [${Tenant}!]! @relationship(type: "ADMIN_IN", direction: OUT, aggregate: false)
        }

        type ${Tenant} @authorization(validate: [{ where: { node: { admins: { userId: "$jwt.id" } } } }]) {
            id: ID! @id
            admins: [${User}!]! @relationship(type: "ADMIN_IN", direction: IN, aggregate: false)
            settings: ${Settings}! @relationship(type: "HAS_SETTINGS", direction: OUT, aggregate: false)
        }

        type ${Settings}
            @authorization(validate: [{ where: { node: { tenant: { admins: { userId: "$jwt.id" } } } } }]) {
            tenant: ${Tenant}! @relationship(type: "HAS_SETTINGS", direction: IN, aggregate: false)
            extendedOpeningHours: [${OpeningDay}!]!
                @relationship(type: "HAS_OPENING_HOURS", direction: OUT, aggregate: false)
        }

        type ${OpeningDay}
            @authorization(
                validate: [{ where: { node: { settings: { tenant: { admins: { userId: "$jwt.id" } } } } } }]
            ) {
            settings: ${Settings}! @relationship(type: "HAS_OPENING_HOURS", direction: IN, aggregate: false)
            date: Date
            open: [${OpeningHoursInterval}!]!
                @relationship(type: "HAS_OPEN_INTERVALS", direction: OUT, aggregate: false)
        }

        type ${OpeningHoursInterval}
            @authorization(
                validate: [
                    { where: { node: { openingDay: { settings: { tenant: { admins: { userId: "$jwt.id" } } } } } } }
                ]
            ) {
            openingDay: ${OpeningDay} @relationship(type: "HAS_OPEN_INTERVALS", direction: IN, aggregate: false)
            name: String
        }

        extend schema @authentication @query(read: true, aggregate: false)
    `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("Should not throw when updating tenants", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Tenant.operations.update}(
                    update: {
                        settings: { update: { node: { extendedOpeningHours: [{ delete: [{ where: null }] }] } } }
                    }
                ) {
                    ${Tenant.plural} {
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

        const response = await testHelper.executeGraphQL(query, {
            contextValue: {
                jwt: { id: myUserId },
            },
        });
        expect(response.errors).toBeFalsy();
    });
});
