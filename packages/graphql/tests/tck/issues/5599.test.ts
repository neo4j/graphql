/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5599", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type LeadActor @node {
                name: String!
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Extra @node {
                name: String
                actedIn: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            union Actor = LeadActor | Extra
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("update with nested delete of an union", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    update: { actors: { LeadActor: [{ delete: [{ where: { node: { name: { eq: "Actor1" } } } }] }] } }
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WITH *
            CALL (*) {
              OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:LeadActor)
              WHERE this1.name = $param0
              WITH this0, collect(DISTINCT this1) AS var2
              CALL (var2) {
                UNWIND var2 AS var3
                DETACH DELETE var3
              }
            }
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Actor1\\"
            }"
        `);
    });

    test("update with nested delete of an union with multiple concrete entities", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    update: {
                        actors: {
                            LeadActor: [{ delete: [{ where: { node: { name: { eq: "Actor1" } } } }] }]
                            Extra: [{ delete: [{ where: { node: { name: { eq: "Actor2" } } } }] }]
                        }
                    }
                ) {
                    movies {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WITH *
            CALL (*) {
              OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:LeadActor)
              WHERE this1.name = $param0
              WITH this0, collect(DISTINCT this1) AS var2
              CALL (var2) {
                UNWIND var2 AS var3
                DETACH DELETE var3
              }
            }
            WITH *
            CALL (*) {
              OPTIONAL MATCH (this)<-[this4:ACTED_IN]-(this5:Extra)
              WHERE this5.name = $param1
              WITH this4, collect(DISTINCT this5) AS var6
              CALL (var6) {
                UNWIND var6 AS var7
                DETACH DELETE var7
              }
            }
            WITH this
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Actor1\\",
                \\"param1\\": \\"Actor2\\"
            }"
        `);
    });
});
