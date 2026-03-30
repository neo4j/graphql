/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Field Level Aggregations Alias", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node(labels: ["Film"]) {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor @node(labels: ["Person"]) {
                name: String
                age: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ActedIn @relationshipProperties {
                time: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Aggregation with labels", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    actorsConnection {
                        aggregate {
                            node {
                                name {
                                    shortest
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
            MATCH (this:Film)
            CALL (this) {
              CALL (this) {
                MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                WITH DISTINCT this1
                ORDER BY size(this1.name) DESC
                WITH collect(this1.name) AS list
                RETURN {shortest: last(list)} AS var2
              }
              RETURN {aggregate: {node: {name: var2}}} AS var3
            }
            RETURN this { actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
