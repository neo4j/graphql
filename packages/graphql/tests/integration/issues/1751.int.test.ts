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

import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import Neo4j from "../neo4j";

describe("https://github.com/neo4j/graphql/issues/1735", () => {
    const organizationType = new UniqueType("Organization");
    const adminType = new UniqueType("Admin");

    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
        const typeDefs = `
        type ${organizationType} {
            title: String
            admins: [${adminType}!]! @relationship(type: "HAS_ADMINISTRATOR", direction: OUT)
        }

        type ${adminType} {
            adminId: ID! @id
            organizations: [${organizationType}!]! @relationship(type: "HAS_ADMINISTRATOR", direction: IN)
        }
  `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    beforeEach(async () => {
        const session = await neo4j.getSession();

        await session.run(`
        CREATE (a:${adminType} {adminId: "my-admin-to-delete"})<-[:HAS_ADMINISTRATOR]-(o:${organizationType} {title: "Google"})
        CREATE (a2:${adminType} {adminId: "my-admin2"})<-[:HAS_ADMINISTRATOR]-(o2:${organizationType} { title: "Yahoo"})
        CREATE (a3:${adminType} {adminId: "my-admin3"})<-[:HAS_ADMINISTRATOR]-(o3:${organizationType} { title: "Altavista"})
        MERGE (a3)<-[:HAS_ADMINISTRATOR]-(o)
        `);

        await session.close();
    });

    afterAll(async () => {
        await driver.close();
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

        const result = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data?.[organizationType.operations.delete]).toEqual({
            nodesDeleted: 2,
            relationshipsDeleted: 2,
        });

        const session = await neo4j.getSession();
        const remainingOrgs = await session.run(`
            MATCH(org:${organizationType})
            RETURN org.title as title
            `);

        const remainingAdmins = await session.run(`
            MATCH(admin:${adminType})
            RETURN admin.adminId as adminId
            `);

        await session.close();

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
