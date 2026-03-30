/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1528", () => {
    test("order in connections with custom cypher", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                actorsCount: Int!
                    @cypher(
                        statement: """
                        MATCH (this)<-[:ACTED_IN]-(ac:Person)
                        RETURN count(ac) as res
                        """
                        columnName: "res"
                    )
            }

            type Person @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Genre @node {
                name: String!
                movies: [Movie!]! @relationship(type: "IS_GENRE", direction: IN)
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

        const query = /* GraphQL */ `
            query {
                genres {
                    moviesConnection(sort: [{ node: { actorsCount: DESC } }]) {
                        edges {
                            node {
                                title
                                actorsCount
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Genre)
            CALL (this) {
              MATCH (this)<-[this0:IS_GENRE]-(this1:Movie)
              WITH collect({node: this1, relationship: this0}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS this1, edge.relationship AS this0
                CALL (this1) {
                  CALL (this1) {
                    WITH this1 AS this
                    MATCH (this)<-[:ACTED_IN]-(ac:Person)
                    RETURN count(ac) as res
                  }
                  WITH res AS this2
                  RETURN this2 AS var3
                }
                WITH *
                ORDER BY var3 DESC
                RETURN collect({node: {title: this1.title, actorsCount: var3, __resolveType: 'Movie'}}) AS var4
              }
              RETURN {edges: var4} AS var5
            }
            RETURN this { moviesConnection: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
