/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4015", () => {
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
                surname: String
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should return all the selected node fields", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    actorsConnection {
                        edges {
                            node {
                                surname
                            }
                            no: node {
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
              WITH collect({node: this1, relationship: this0}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.relationship AS this0
                RETURN collect({node: {surname: this1.surname, name: this1.name, __resolveType: 'Actor'}}) AS var2
              }
              RETURN {edges: var2} AS var3
            }
            RETURN this { actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
