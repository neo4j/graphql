/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2614", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = `
            interface Production {
                title: String!
                actors: [Actor!]!
            }
            
            type Movie implements Production @node(labels:["Film"]){
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                runtime: Int!
            }
            
            type Series implements Production @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                episodes: Int!
            }
            
            type ActedIn @relationshipProperties {
                role: String!
            }
            
            type Actor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should use the provided node directive label in the call subquery", async () => {
        const query = /* GraphQL */ `
            query GetProductionsMovie {
                actors {
                    actedIn(where: { title: { eq: "Test Movie" } }) {
                        title
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            CALL (this) {
              CALL (*) {
                WITH *
                MATCH (this)-[this0:ACTED_IN]->(this1:Film)
                WHERE this1.title = $param0
                WITH this1 { .title, __resolveType: 'Movie', __id: elementId(this1) } AS var2
                RETURN var2
                UNION
                WITH *
                MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                WHERE this4.title = $param1
                WITH this4 { .title, __resolveType: 'Series', __id: elementId(this4) } AS var2
                RETURN var2
              }
              WITH var2
              RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Test Movie\\",
                \\"param1\\": \\"Test Movie\\"
            }"
        `);
    });
});
