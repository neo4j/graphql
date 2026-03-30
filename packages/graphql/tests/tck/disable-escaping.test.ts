/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Disable escaping", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String!
            }

            type Movie @node(labels: ["Movie:Film"]) {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN|PATICIPATED", direction: IN)
            }
        `;
    });

    test("disableRelationshipTypeEscaping", async () => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                unsafeEscapeOptions: {
                    disableRelationshipTypeEscaping: true,
                },
            },
        });
        const query = /* GraphQL */ `
            {
                movies {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:\`Movie:Film\`)
            CALL (this) {
              MATCH (this)<-[this0:ACTED_IN|PATICIPATED]-(this1:Actor)
              WITH DISTINCT this1
              WITH this1 { .name } AS this1
              RETURN collect(this1) AS var2
            }
            RETURN this { actors: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("disableNodeLabelEscaping", async () => {
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                unsafeEscapeOptions: {
                    disableNodeLabelEscaping: true,
                },
            },
        });
        const query = /* GraphQL */ `
            {
                movies {
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie:Film)
            CALL (this) {
              MATCH (this)<-[this0:\`ACTED_IN|PATICIPATED\`]-(this1:Actor)
              WITH DISTINCT this1
              WITH this1 { .name } AS this1
              RETURN collect(this1) AS var2
            }
            RETURN this { actors: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
