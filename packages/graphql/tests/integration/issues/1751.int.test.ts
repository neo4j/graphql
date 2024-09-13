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

describe("https://github.com/neo4j/graphql/issues/1735", () => {
    let organizationType: UniqueType;
    let adminType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        organizationType = testHelper.createUniqueType("Organization");
        adminType = testHelper.createUniqueType("Admin");

        const typeDefs = `
        type ${organizationType} {
            title: String
            admins: [${adminType}!]! @relationship(type: "HAS_ADMINISTRATOR", direction: OUT)
        }

        type ${adminType} {
            adminId: ID! @id @unique
            organizations: [${organizationType}!]! @relationship(type: "HAS_ADMINISTRATOR", direction: IN)
        }
  `;
        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
        CREATE (a:${adminType} {adminId: "my-admin-to-delete"})<-[:HAS_ADMINISTRATOR]-(o:${organizationType} {title: "Google"})
        CREATE (a2:${adminType} {adminId: "my-admin2"})<-[:HAS_ADMINISTRATOR]-(o2:${organizationType} { title: "Yahoo"})
        CREATE (a3:${adminType} {adminId: "my-admin3"})<-[:HAS_ADMINISTRATOR]-(o3:${organizationType} { title: "Altavista"})
        MERGE (a3)<-[:HAS_ADMINISTRATOR]-(o)
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should delete the correct node filtered by aggregated count", async () => {
        const query = `
            mutation DeleteOrganizations {
                ${organizationType.operations.delete}(
                    where: { title: "Google" }
                    delete: { admins: [{ where: { node: { organizationsAggregate: { count: 1 } } } }] }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data?.[organizationType.operations.delete]).toEqual({
            nodesDeleted: 2,
            relationshipsDeleted: 2,
        });

        const remainingOrgs = await testHelper.executeCypher(`
            MATCH(org:${organizationType})
            RETURN org.title as title
            `);

        const remainingAdmins = await testHelper.executeCypher(`
            MATCH(admin:${adminType})
            RETURN admin.adminId as adminId
            `);

        expect(remainingOrgs.records.map((r) => r.toObject())).toIncludeSameMembers([
            { title: "Yahoo" },
            { title: "Altavista" },
        ]);
        expect(remainingAdmins.records.map((r) => r.toObject())).toIncludeSameMembers([
            { adminId: "my-admin2" },
            { adminId: "my-admin3" },
        ]);
    });
});
