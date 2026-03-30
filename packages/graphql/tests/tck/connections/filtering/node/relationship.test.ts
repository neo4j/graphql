/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher -> Connections -> Filtering -> Node -> Relationship", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Equality", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { movies: { some: { title: { eq: "Forrest Gump" } } } } }) {
                        edges {
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
              WHERE EXISTS {
                MATCH (this1)-[:ACTED_IN]->(this2:Movie)
                WHERE this2.title = $param0
              }
              WITH collect({node: this1, relationship: this0}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.relationship AS this0
                RETURN collect({node: {name: this1.name, __resolveType: 'Actor'}}) AS var3
              }
              RETURN {edges: var3} AS var4
            }
            RETURN this { .title, actorsConnection: var4 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Forrest Gump\\"
            }"
        `);
    });
});
