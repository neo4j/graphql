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

describe("https://github.com/neo4j/graphql/issues/894", () => {
    let testUser: UniqueType;
    let testOrganization: UniqueType;
    const testHelper = new TestHelper();

    beforeEach(async () => {
        testUser = testHelper.createUniqueType("User");
        testOrganization = testHelper.createUniqueType("Organization");

        const typeDefs = `
        type ${testUser.name} {
            id: ID! @id @unique @alias(property: "_id")
            name: String!
            activeOrganization: ${testOrganization.name} @relationship(type: "ACTIVELY_MANAGING", direction: OUT)
        }

        type ${testOrganization.name} {
            id: ID! @id @unique @alias(property: "_id")
            name: String!
        }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should query nested connection", async () => {
        const createUserQuery = /* GraphQL */ `
            mutation {
                ${testUser.operations.create}(
                    input: {
                        name: "Luke Skywalker"
                        activeOrganization: { create: { node: { name: "Rebel Alliance" } } }
                    }
                ) {
                    ${testUser.plural} {
                        id
                    }
                }
            }
        `;
        const createOrgQuery = /* GraphQL */ `
            mutation {
                ${testOrganization.operations.create}(input: { name: "The Empire" }) {
                    ${testOrganization.plural} {
                        id
                    }
                }
            }
        `;
        const createUserResult = await testHelper.executeGraphQL(createUserQuery);
        expect(createUserResult.errors).toBeUndefined();

        const createOrgResult = (await testHelper.executeGraphQL(createOrgQuery)) as any;
        expect(createOrgResult.errors).toBeUndefined();
        const orgId = createOrgResult?.data[testOrganization.operations.create][testOrganization.plural][0]
            .id as string;

        const swapSidesQuery = /* GraphQL*/ `
                mutation {
                    ${testUser.operations.update}(
                        where: { name: "Luke Skywalker" }
                        connect: { activeOrganization: { where: { node: { id: "${orgId}" } } } }
                        disconnect: { activeOrganization: { where: { node: { id_NOT: "${orgId}" } } } }
                    ) {
                        ${testUser.plural} {
                            id
                        }
                    }
                }
            `;

        const swapSidesResult = await testHelper.executeGraphQL(swapSidesQuery);
        expect(swapSidesResult.errors).toBeUndefined();

        const userOrgs = await testHelper.executeCypher(`
                MATCH (user:${testUser.name} { name: "Luke Skywalker" })-[r:ACTIVELY_MANAGING]->(org:${testOrganization.name}) return org.name as orgName
            `);

        expect(userOrgs.records).toHaveLength(1);
        expect(userOrgs.records[0]?.toObject().orgName as string).toBe("The Empire");
    });
});
