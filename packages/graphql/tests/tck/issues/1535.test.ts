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

import { gql } from "apollo-server";
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1535", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Tenant {
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

            type Booking implements Event {
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should use alias in result projection for a field using an interface", async () => {
        const query = gql`
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
            "MATCH (this:\`Tenant\`)
            WITH *
            WITH *
            CALL {
            WITH *
            CALL {
                WITH this
                MATCH (this)<-[this0:HOSTED_BY]-(this_Screening:\`Screening\`)
                RETURN { __resolveType: \\"Screening\\", id: this_Screening.id } AS this_events
                UNION
                WITH this
                MATCH (this)<-[this1:HOSTED_BY]-(this_Booking:\`Booking\`)
                RETURN { __resolveType: \\"Booking\\", id: this_Booking.id } AS this_events
            }
            RETURN collect(this_events) AS this_events
            }
            RETURN this { .id, .name, events232: this_events } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
