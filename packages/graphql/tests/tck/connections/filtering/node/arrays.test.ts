/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Node -> Arrays", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                name: String!
                favouriteColours: [String!]
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

    test("IN", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { name: { in: ["Tom Hanks", "Robin Wright"] } } }) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                name
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
              WHERE this1.name IN $param0
              WITH collect({node: this1, relationship: this0}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.relationship AS this0
                RETURN collect({properties: {screenTime: this0.screenTime, __resolveType: 'ActedIn'}, node: {name: this1.name, __resolveType: 'Actor'}}) AS var2
              }
              RETURN {edges: var2} AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    \\"Tom Hanks\\",
                    \\"Robin Wright\\"
                ]
            }"
        `);
    });

    test("INCLUDES", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { favouriteColours: { includes: "Blue" } } }) {
                        edges {
                            properties {
                                screenTime
                            }
                            node {
                                name
                                favouriteColours
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
              WHERE $param0 IN this1.favouriteColours
              WITH collect({node: this1, relationship: this0}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.relationship AS this0
                RETURN collect({properties: {screenTime: this0.screenTime, __resolveType: 'ActedIn'}, node: {name: this1.name, favouriteColours: this1.favouriteColours, __resolveType: 'Actor'}}) AS var2
              }
              RETURN {edges: var2} AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Blue\\"
            }"
        `);
    });
});
