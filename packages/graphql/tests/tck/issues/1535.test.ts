/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1535", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Tenant @node {
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

            type Screening implements Event @node {
                id: ID! @id
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
                id: ID! @id
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
            "CYPHER 5
            MATCH (this:Tenant)
            CALL (this) {
              CALL (*) {
                WITH *
                MATCH (this)<-[this0:HOSTED_BY]-(this1:Screening)
                WITH this1 { .id, __resolveType: 'Screening', __id: elementId(this1) } AS var2
                RETURN var2
                UNION
                WITH *
                MATCH (this)<-[this3:HOSTED_BY]-(this4:Booking)
                WITH this4 { .id, __resolveType: 'Booking', __id: elementId(this4) } AS var2
                RETURN var2
              }
              WITH var2
              RETURN collect(var2) AS var2
            }
            RETURN this { .id, .name, events232: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
