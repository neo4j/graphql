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

describe("https://github.com/neo4j/graphql/issues/1535", () => {
    const testTenant = new UniqueType("Tenant");
    const testBooking = new UniqueType("Booking");

    let driver: Driver;
    let schema: GraphQLSchema;
    let neo4j: Neo4j;
    let session: Session;

    async function graphqlQuery(query: string) {
        return graphql({
            schema,
            source: query,
            contextValue: neo4j.getContextValues(),
        });
    }

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();

        const typeDefs = `
            type ${testTenant} {
                id: ID! @id
                name: String!
                events: [Event!]! @relationship(type: "HOSTED_BY", direction: IN)
                fooBars: [FooBar!]! @relationship(type: "HAS_FOOBARS", direction: OUT)
            }
            
            interface Event {
                id: ID!
                title: String
                beginsAt: DateTime!
            }
            
            type Screening implements Event {
                id: ID! @id
                title: String
                beginsAt: DateTime!
            }
            
            type ${testBooking} implements Event {
                id: ID!
                title: String
                beginsAt: DateTime!
                duration: Int!
            }
            
            type FooBar {
                id: ID! @id
                name: String!
            }
        `;

        session = await neo4j.getSession();

        await session.run(`
            CREATE (:${testTenant} { id: "12", name: "Tenant1" })<-[:HOSTED_BY]-(:${testBooking} { id: "212" })
        `);

        const neoGraphql = new Neo4jGraphQL({ typeDefs, driver });
        schema = await neoGraphql.getSchema();
    });

    afterAll(async () => {
        await session.close();
        await driver.close();
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

        const queryResult = await graphqlQuery(query);
        expect(queryResult.errors).toBeUndefined();

        expect(queryResult.data as any).toEqual({
            [`${testTenant.plural}`]: [{ id: "12", name: "Tenant1", events232: [{ id: "212" }] }],
        });
    });
});
