/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher -> Connections -> Projections -> Create", () => {
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

    test("Connection can be selected following the creation of a single node", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }]) {
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
              RETURN create_this1
            }
            CALL (create_this1) {
              MATCH (create_this1)<-[create_this2:ACTED_IN]-(create_this3:Actor)
              WITH collect({node: create_this3, relationship: create_this2}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS create_this3, edge.relationship AS create_this2
                RETURN collect({properties: {screenTime: create_this2.screenTime, __resolveType: 'ActedIn'}, node: {name: create_this3.name, __resolveType: 'Actor'}}) AS create_var4
              }
              RETURN {edges: create_var4} AS create_var5
            }
            RETURN collect(create_this1 { .title, actorsConnection: create_var5 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\"
                    }
                ]
            }"
        `);
    });

    test("Connection can be selected following the creation of a multiple nodes", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }, { title: "Toy Story" }]) {
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
              RETURN create_this1
            }
            CALL (create_this1) {
              MATCH (create_this1)<-[create_this2:ACTED_IN]-(create_this3:Actor)
              WITH collect({node: create_this3, relationship: create_this2}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS create_this3, edge.relationship AS create_this2
                RETURN collect({properties: {screenTime: create_this2.screenTime, __resolveType: 'ActedIn'}, node: {name: create_this3.name, __resolveType: 'Actor'}}) AS create_var4
              }
              RETURN {edges: create_var4} AS create_var5
            }
            RETURN collect(create_this1 { .title, actorsConnection: create_var5 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\"
                    },
                    {
                        \\"title\\": \\"Toy Story\\"
                    }
                ]
            }"
        `);
    });

    test("Connection can be selected and filtered following the creation of a multiple nodes", async () => {
        const query = /* GraphQL */ `
            mutation {
                createMovies(input: [{ title: "Forrest Gump" }, { title: "Toy Story" }]) {
                    movies {
                        title
                        actorsConnection(where: { node: { name: { eq: "Tom Hanks" } } }) {
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
              RETURN create_this1
            }
            CALL (create_this1) {
              MATCH (create_this1)<-[create_this2:ACTED_IN]-(create_this3:Actor)
              WHERE create_this3.name = $create_param1
              WITH collect({node: create_this3, relationship: create_this2}) AS edges
              CALL (edges) {
                UNWIND edges AS edge
                WITH edge.node AS create_this3, edge.relationship AS create_this2
                RETURN collect({properties: {screenTime: create_this2.screenTime, __resolveType: 'ActedIn'}, node: {name: create_this3.name, __resolveType: 'Actor'}}) AS create_var4
              }
              RETURN {edges: create_var4} AS create_var5
            }
            RETURN collect(create_this1 { .title, actorsConnection: create_var5 }) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"create_param0\\": [
                    {
                        \\"title\\": \\"Forrest Gump\\"
                    },
                    {
                        \\"title\\": \\"Toy Story\\"
                    }
                ],
                \\"create_param1\\": \\"Tom Hanks\\"
            }"
        `);
    });
});
