/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1535", () => {
    let testTenant: UniqueType;
    let testBooking: UniqueType;
    let FooBar: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        testTenant = testHelper.createUniqueType("Tenant");
        testBooking = testHelper.createUniqueType("Booking");
        FooBar = testHelper.createUniqueType("FooBar");

        const typeDefs = `
            type ${testTenant} @node {
                id: ID! @id
                name: String!
                events: [Event!]! @relationship(type: "HOSTED_BY", direction: IN)
                fooBars: [${FooBar}!]! @relationship(type: "HAS_FOOBARS", direction: OUT)
            }
            
            interface Event {
                id: ID!
                title: String
                beginsAt: DateTime!
            }
            
            type Screening implements Event @node {
                id: ID! @id
                title: String
                beginsAt: DateTime!
            }
            
            type ${testBooking} implements Event @node {
                id: ID!
                title: String
                beginsAt: DateTime!
                duration: Int!
            }
            
            type ${FooBar} @node {
                id: ID! @id
                name: String!
            }
        `;

        await testHelper.executeCypher(`
            CREATE (:${testTenant} { id: "12", name: "Tenant1" })<-[:HOSTED_BY]-(:${testBooking} { id: "212" })
        `);

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should not throw error when using alias in result projection for a field using an interface", async () => {
        const query = `
            query { 
                ${testTenant.plural} {
                    id
                    name
                    events232: events {
                        id
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);
        expect(queryResult.errors).toBeUndefined();

        expect(queryResult.data as any).toEqual({
            [`${testTenant.plural}`]: [{ id: "12", name: "Tenant1", events232: [{ id: "212" }] }],
        });
    });
});
