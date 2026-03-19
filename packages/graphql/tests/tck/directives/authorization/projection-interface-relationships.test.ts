/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { createBearerToken } from "../../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Auth projections for interface relationship fields", () => {
    const secret = "secret";
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
            }

            type Movie implements Production @node {
                title: String!
                runtime: Int!
            }

            type Series implements Production @node {
                title: String!
                episodes: String!
            }

            extend type Series
                @authorization(validate: [{ when: BEFORE, where: { node: { episodes: { eq: "$jwt.sub" } } } }])

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }

            type Actor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("Simple Interface Relationship Query for protected type", async () => {
        const query = /* GraphQL */ `
            query {
                actors {
                    actedIn {
                        title
                        ... on Movie {
                            runtime
                        }
                        ... on Series {
                            episodes
                        }
                    }
                }
            }
        `;

        const token = createBearerToken("secret", { sub: "super_admin" });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Actor)
            CALL (this) {
              CALL (*) {
                WITH *
                MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
                WITH this1 { .title, .runtime, __resolveType: 'Movie', __id: elementId(this1) } AS var2
                RETURN var2
                UNION
                WITH *
                MATCH (this)-[this3:ACTED_IN]->(this4:Series)
                CALL apoc.util.validate(NOT ($isAuthenticated = true AND ($jwt.sub IS NOT NULL AND this4.episodes = $jwt.sub)), '@neo4j/graphql/FORBIDDEN', [])
                WITH this4 { .title, .episodes, __resolveType: 'Series', __id: elementId(this4) } AS var2
                RETURN var2
              }
              WITH var2
              RETURN collect(var2) AS var2
            }
            RETURN this { actedIn: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"sub\\": \\"super_admin\\"
                }
            }"
        `);
    });
});
