/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Node -> OR", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                firstName: String!
                lastName: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("OR", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(
                        where: { node: { OR: [{ firstName: { eq: "Tom" } }, { lastName: { eq: "Hanks" } }] } }
                    ) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                firstName
                                lastName
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
              MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
              WHERE (this1.firstName = $param0 OR this1.lastName = $param1)
              WITH collect({node: this1, relationship: this0}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.relationship AS this0
                RETURN collect({properties: {screenTime: this0.screenTime, __resolveType: 'ActedIn'}, node: {firstName: this1.firstName, lastName: this1.lastName, __resolveType: 'Actor'}}) AS var2
              }
              RETURN {edges: var2} AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Tom\\",
                \\"param1\\": \\"Hanks\\"
            }"
        `);
    });
});
