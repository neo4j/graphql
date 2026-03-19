/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
        type ${testUser.name} @node {
            id: ID! @id @alias(property: "_id")
            name: String!
            activeOrganization: [${testOrganization.name}!]! @relationship(type: "ACTIVELY_MANAGING", direction: OUT)
        }

        type ${testOrganization.name} @node {
            id: ID! @id @alias(property: "_id")
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

        const swapSidesQuery = /* GraphQL */ `
            mutation {
                ${testUser.operations.update}(
                    where: { name_EQ: "Luke Skywalker" }
                    update: {
                        activeOrganization: {
                            connect: { where: { node: { id_EQ: "${orgId}" } } } 
                            disconnect: { where: { node: { NOT: { id_EQ: "${orgId}" } } } } 
                            
                        }
                    }
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
