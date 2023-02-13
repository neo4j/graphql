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
import type { Driver, Session } from "neo4j-driver";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/1640", () => {
    const testAdmin = new UniqueType("Admin");
    const testOrganization = new UniqueType("Organization");

    let schema: GraphQLSchema;
    let neo4j: Neo4j;
    let driver: Driver;
    let session: Session;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

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

        const neoGraphql = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await driver.close();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.close();
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

        await session.run(cypher);

        const result = await graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValuesWithBookmarks(session.lastBookmark()),
        });

        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [testOrganization.operations.delete]: {
                nodesDeleted: 2,
                relationshipsDeleted: 3,
            },
        });
    });
});
