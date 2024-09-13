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
            type ${testTenant} {
                id: ID! @id @unique
                name: String!
                events: [Event!]! @relationship(type: "HOSTED_BY", direction: IN)
                fooBars: [${FooBar}!]! @relationship(type: "HAS_FOOBARS", direction: OUT)
            }
            
            interface Event {
                id: ID!
                title: String
                beginsAt: DateTime!
            }
            
            type Screening implements Event {
                id: ID! @id @unique
                title: String
                beginsAt: DateTime!
            }
            
            type ${testBooking} implements Event {
                id: ID!
                title: String
                beginsAt: DateTime!
                duration: Int!
            }
            
            type ${FooBar} {
                id: ID! @id @unique
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
