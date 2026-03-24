/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { TestCDCEngine } from "../../utils/builders/TestCDCEngine";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Subscriptions metadata on update", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie @node {
                id: ID!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                subscriptions: new TestCDCEngine(),
            },
        });
    });

    test("Simple update with subscriptions", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(where: { id: { eq: "1" } }, update: { id_SET: "2" }) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            SET this.id = $param1
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"2\\"
            }"
        `);
    });

    test("Nested update with subscriptions", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { id: { eq: "1" } }
                    update: {
                        id_SET: "2"
                        actors: [
                            { update: { where: { node: { name: { eq: "arthur" } } }, node: { name_SET: "ford" } } }
                        ]
                    }
                ) {
                    movies {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.id = $param0
            SET this.id = $param1
            WITH *
            CALL (*) {
              MATCH (this)<-[this0:ACTED_IN]-(this1:Actor)
              WITH *
              WHERE this1.name = $param2
              SET this1.name = $param3
            }
            WITH this
            RETURN this { .id } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"1\\",
                \\"param1\\": \\"2\\",
                \\"param2\\": \\"arthur\\",
                \\"param3\\": \\"ford\\"
            }"
        `);
    });
});
