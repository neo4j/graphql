/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Relationship Properties Create Cypher", () => {
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

    test("Create movie with a relationship that has properties", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(
                    input: [
                        {
                            title: "Forrest Gump"
                            actors: { create: [{ node: { name: "Tom Hanks" }, edge: { screenTime: 60 } }] }
                        }
                    ]
                ) {
                    movies {
                        title
                        actorsConnection {
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
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            UNWIND $create_param0 AS create_var0
            CALL (create_var0) {
              CREATE (create_this1:Movie)
              SET create_this1.title = create_var0.title
              WITH create_this1, create_var0
              CALL (create_this1, create_var0) {
                UNWIND create_var0.actors.create AS create_var2
                CREATE (create_this3:Actor)
                SET create_this3.name = create_var2.node.name
                MERGE (create_this1)<-[create_this4:ACTED_IN]-(create_this3)
                SET create_this4.screenTime = create_var2.edge.screenTime
                RETURN collect(NULL) AS create_var5
              }
              RETURN create_this1
            }
            CALL (create_this1) {
              MATCH (create_this1)<-[create_this6:ACTED_IN]-(create_this7:Actor)
              WITH collect({node: create_this7, relationship: create_this6}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS create_this7, edge.relationship AS create_this6
                RETURN collect({properties: {screenTime: create_this6.screenTime, __resolveType: 'ActedIn'}, node: {name: create_this7.name, __resolveType: 'Actor'}}) AS create_var8
              }
              RETURN {edges: create_var8} AS create_var9
            }
            RETURN collect(create_this1 { .title, actorsConnection: create_var9 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\",
                        \\"actors\\": {
                            \\"create\\": [
                                {
                                    \\"edge\\": {
                                        \\"screenTime\\": {
                                            \\"low\\": 60,
                                            \\"high\\": 0
                                        }
                                    },
                                    \\"node\\": {
                                        \\"name\\": \\"Tom Hanks\\"
                                    }
                                }
                            ]
                        }
                    }
                ]
            }"
        `);
    });
});
