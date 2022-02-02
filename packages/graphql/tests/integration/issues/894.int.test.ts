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

import { DocumentNode, graphql } from "graphql";
import { Driver } from "neo4j-driver";
import { gql } from "apollo-server";
import neo4j from "../neo4j";
import { getQuerySource } from "../../utils/get-query-source";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/894", () => {
    let driver: Driver;

    beforeAll(async () => {
        driver = await neo4j();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should query nested connection", async () => {
        // TODO: use getUniqueType
        const testUser = "User894";
        const testOrganization = "Organization894";

        const typeDefs = `
        type ${testUser} {
            id: ID! @id @alias(property: "_id")
            name: String!
            activeOrganization: ${testOrganization} @relationship(type: "ACTIVELY_MANAGING", direction: OUT)
        }

        type ${testOrganization} {
            id: ID! @id @alias(property: "_id")
            name: String!
        }
        `;

        const { schema } = new Neo4jGraphQL({ typeDefs, driver });

        const session = driver.session();

        async function graphqlQuery(query: DocumentNode) {
            return graphql({
                schema,
                source: getQuerySource(query),
                contextValue: {
                    driver,
                },
            });
        }

        try {
            const createUserQuery = gql`
                mutation {
                    createUser894s(
                        input: {
                            name: "Luke Skywalker"
                            activeOrganization: { create: { node: { name: "Rebel Alliance" } } }
                        }
                    ) {
                        user894s {
                            id
                        }
                    }
                }
            `;
            const createOrgQuery = gql`
                mutation {
                    createOrganization894s(input: { name: "The Empire" }) {
                        organization894s {
                            id
                        }
                    }
                }
            `;
            const createUserResult = await graphqlQuery(createUserQuery);
            expect(createUserResult.errors).toBeUndefined();

            const createOrgResult = await graphqlQuery(createOrgQuery);
            expect(createOrgResult.errors).toBeUndefined();

            const orgId = createOrgResult?.data?.createOrganization894s.organization894s[0].id as string;

            const swapSidesQuery = gql`
                mutation {
                    updateUser894s(
                        where: { name: "Luke Skywalker" }
                        connect: { activeOrganization: { where: { node: { id: "${orgId}" } } } }
                        disconnect: { activeOrganization: { where: { node: { id_NOT: "${orgId}" } } } }
                    ) {
                        user894s {
                            id
                        }
                    }
                }
            `;

            const swapSidesResult = await graphqlQuery(swapSidesQuery);
            expect(swapSidesResult.errors).toBeUndefined();

            const result = await session.run(`
                MATCH (user:User894 { name: "Luke Skywalker" })-[r:ACTIVELY_MANAGING]->(org:Organization894) return org.name as orgName
            `);
            expect(result.records).toHaveLength(1);
            expect(result.records[0].toObject().orgName as string).toBe("The Empire");
        } finally {
            await session.run(`MATCH (node:User894) DETACH DELETE node`);
            await session.run(`MATCH (org:Organization894) DETACH DELETE org`);
            await session.close();
        }
    });
});
