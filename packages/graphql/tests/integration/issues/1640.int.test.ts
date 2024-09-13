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

describe("https://github.com/neo4j/graphql/issues/1640", () => {
    let testAdmin: UniqueType;
    let testOrganization: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        testAdmin = testHelper.createUniqueType("Admin");
        testOrganization = testHelper.createUniqueType("Organization");

        const typeDefs = `
            type ${testAdmin} {
                name: String!
                organizations: [${testOrganization}!]! @relationship(type: "HAS_ADMINISTRATOR", direction: IN)
            }

            type ${testOrganization} {
                name: String!
                admins: [${testAdmin}!]! @relationship(type: "HAS_ADMINISTRATOR", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("delete administrator if the aggregation matches", async () => {
        const query = `
            mutation DeleteOrganizations {
                ${testOrganization.operations.delete}(
                    where: { name: "Org1" }
                    delete: { admins: [{ where: { node: { organizationsAggregate: { count: 1 } } } }] }
                ) {
                    nodesDeleted
                    relationshipsDeleted
                }
            }
        `;

        const cypher = `
            CREATE(org1:${testOrganization} {name: "Org1"})
            CREATE(org2:${testOrganization} {name: "Org2"})
            
            CREATE(admin1:${testAdmin} {name: "Mugukey"})
            CREATE(admin2:${testAdmin} {name: "Mugumya"})
            CREATE(admin3:${testAdmin} {name: "Other"})
            
            CREATE(org1)-[:HAS_ADMINISTRATOR]->(admin1)
            CREATE(org1)-[:HAS_ADMINISTRATOR]->(admin2)
            CREATE(org1)-[:HAS_ADMINISTRATOR]->(admin3)
            
            CREATE(org2)-[:HAS_ADMINISTRATOR]->(admin1)
            CREATE(org2)-[:HAS_ADMINISTRATOR]->(admin2)
        `;

        await testHelper.executeCypher(cypher);

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [testOrganization.operations.delete]: {
                nodesDeleted: 2,
                relationshipsDeleted: 3,
            },
        });
    });
});
