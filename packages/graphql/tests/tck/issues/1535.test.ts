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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1535", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Tenant @node {
                id: ID! @id @unique
                name: String!
                events: [Event!]! @relationship(type: "HOSTED_BY", direction: IN)
                fooBars: [FooBar!]! @relationship(type: "HAS_FOOBARS", direction: OUT)
            }

            interface Event {
                id: ID!
                title: String
                beginsAt: DateTime!
            }

            type Screening implements Event @node {
                id: ID! @id @unique
                title: String
                beginsAt: DateTime!
            }

            type Booking implements Event @node {
                id: ID!
                title: String
                beginsAt: DateTime!
                duration: Int!
            }

            type FooBar @node {
                id: ID! @id @unique
                name: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should use alias in result projection for a field using an interface", async () => {
        const query = /* GraphQL */ `
            query {
                tenants {
                    id
                    name
                    events232: events {
                        id
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Tenant)
            CALL {
                WITH this
                CALL {
                    WITH *
                    MATCH (this)<-[this0:HOSTED_BY]-(this1:Screening)
                    WITH this1 { .id, __resolveType: \\"Screening\\", __id: id(this1) } AS this1
                    RETURN this1 AS var2
                    UNION
                    WITH *
                    MATCH (this)<-[this3:HOSTED_BY]-(this4:Booking)
                    WITH this4 { .id, __resolveType: \\"Booking\\", __id: id(this4) } AS this4
                    RETURN this4 AS var2
                }
                WITH var2
                RETURN collect(var2) AS var2
            }
            RETURN this { .id, .name, events232: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
