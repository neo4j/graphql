/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Field Level Aggregations Where", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String
                actors: [Person!]! @relationship(type: "ACTED_IN", direction: IN)
                directors: [Person!]! @relationship(type: "DIRECTED", direction: IN)
                released: DateTime
            }

            type Person @node {
                name: String
                age: Int
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Count aggregation with number filter", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { age: { gt: 40 } } }) {
                        aggregate {
                            count {
                                nodes
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
              CALL (this) {
                MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                WHERE this1.age > $param0
                RETURN {nodes: count(DISTINCT this1)} AS var2
              }
              RETURN {aggregate: {count: var2}} AS var3
            }
            RETURN this { .title, actorsConnection: var3 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 40,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Count aggregation with colliding filter", async () => {
        const query = /* GraphQL */ `
            query {
                movies {
                    title
                    actorsConnection(where: { node: { name_CONTAINS: "abc" } }) {
                        aggregate {
                            count {
                                nodes
                            }
                        }
                    }
                    directorsConnection(where: { node: { name_CONTAINS: "abcdefg" } }) {
                        aggregate {
                            count {
                                nodes
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
              CALL (this) {
                MATCH (this)<-[this0:ACTED_IN]-(this1:Person)
                WHERE this1.name CONTAINS $param0
                RETURN {nodes: count(DISTINCT this1)} AS var2
              }
              RETURN {aggregate: {count: var2}} AS var3
            }
            CALL (this) {
              CALL (this) {
                MATCH (this)<-[this4:DIRECTED]-(this5:Person)
                WHERE this5.name CONTAINS $param1
                RETURN {nodes: count(DISTINCT this5)} AS var6
              }
              RETURN {aggregate: {count: var6}} AS var7
            }
            RETURN this { .title, actorsConnection: var3, directorsConnection: var7 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"abc\\",
                \\"param1\\": \\"abcdefg\\"
            }"
        `);
    });
});
