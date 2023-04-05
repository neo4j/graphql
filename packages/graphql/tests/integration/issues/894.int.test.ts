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

import type { DocumentNode, GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { gql } from "apollo-server";
import Neo4j from "../neo4j";
import { getQuerySource } from "../../utils/get-query-source";
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";

describe("https://github.com/neo4j/graphql/issues/894", () => {
    const testUser = new UniqueType("User");
    const testOrganization = new UniqueType("Organization");
    let schema: GraphQLSchema;
    let driver: Driver;
    let neo4j: Neo4j;
    let session: Session;

    async function graphqlQuery(query: DocumentNode) {
        return graphql({
            schema,
            source: getQuerySource(query),
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = `
        type ${testUser.name} {
            id: ID! @id @alias(property: "_id")
            name: String!
            activeOrganization: ${testOrganization.name} @relationship(type: "ACTIVELY_MANAGING", direction: OUT)
        }

        type ${testOrganization.name} {
            id: ID! @id @alias(property: "_id")
            name: String!
        }
        `;
        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();
    });

    afterEach(async () => {
        await session.run(`MATCH (node:${testUser.name}) DETACH DELETE node`);
        await session.run(`MATCH (org:${testOrganization.name}) DETACH DELETE org`);

        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should query nested connection", async () => {
        const createUserQuery = gql`
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
        const createOrgQuery = gql`
            mutation {
                ${testOrganization.operations.create}(input: { name: "The Empire" }) {
                    ${testOrganization.plural} {
                        id
                    }
                }
            }
        `;
        const createUserResult = await graphqlQuery(createUserQuery);
        expect(createUserResult.errors).toBeUndefined();

        const createOrgResult = (await graphqlQuery(createOrgQuery)) as any;
        expect(createOrgResult.errors).toBeUndefined();
        const orgId = createOrgResult?.data[testOrganization.operations.create][testOrganization.plural][0]
            .id as string;

        const swapSidesQuery = gql`
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

        const swapSidesResult = await graphqlQuery(swapSidesQuery);
        expect(swapSidesResult.errors).toBeUndefined();

        const userOrgs = await session.run(`
                MATCH (user:${testUser.name} { name: "Luke Skywalker" })-[r:ACTIVELY_MANAGING]->(org:${testOrganization.name}) return org.name as orgName
            `);

        expect(userOrgs.records).toHaveLength(1);
        expect(userOrgs.records[0]?.toObject().orgName as string).toBe("The Empire");
    });
});
