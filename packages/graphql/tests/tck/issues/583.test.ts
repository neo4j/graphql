/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/583", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Show {
                title: String
            }

            interface Awardable {
                awardsGiven: Int!
            }

            type Actor implements Awardable @node {
                name: String
                awardsGiven: Int!
                actedIn: [Show!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie implements Show & Awardable @node {
                title: String
                awardsGiven: Int!
            }

            type Series implements Show & Awardable @node {
                title: String
                awardsGiven: Int!
            }

            type ShortFilm implements Show @node {
                title: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Should resolve properties from common interface", async () => {
        const query = /* GraphQL */ `
            query shows {
                actors {
                    name
                    __typename
                    actedIn {
                        title
                        ... on Awardable {
                            awardsGiven
                        }
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
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH this1 { .title, .awardsGiven, __resolveType: 'Movie', __id: elementId(this1) } AS var2
                RETURN var2
                UNION
                WITH *
                MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                WITH this4 { .title, .awardsGiven, __resolveType: 'Series', __id: elementId(this4) } AS var2
                RETURN var2
                UNION
                WITH *
                MATCH (this)-[this5:ACTED_IN]->(this6:ShortFilm)
                WITH this6 { .title, __resolveType: 'ShortFilm', __id: elementId(this6) } AS var2
                RETURN var2
              }
              WITH var2
              RETURN collect(var2) AS var2
            }
            RETURN this { .name, actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
