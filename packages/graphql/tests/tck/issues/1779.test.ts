/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/1779", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Person @node {
                name: String
                age: Int
                attends: [School!]! @relationship(type: "attends", direction: OUT)
            }

            type School @node {
                name: String
                students: [Person!]! @relationship(type: "attends", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("EXISTS should not be within return clause", async () => {
        const query = /* GraphQL */ `
            {
                people {
                    name
                    attends(where: { students: { all: { age: { gt: 23 } } } }) {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            CALL (this) {
              MATCH (this)-[this0:attends]->(this1:School)
              WHERE (EXISTS {
                MATCH (this1)<-[:attends]-(this2:Person)
                WHERE this2.age > $param0
              } AND NOT (EXISTS {
                MATCH (this1)<-[:attends]-(this2:Person)
                WHERE NOT (this2.age > $param0)
              }))
              WITH DISTINCT this1
              WITH this1 { .name } AS this1
              RETURN collect(this1) AS var3
            }
            RETURN this { .name, attends: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 23,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
