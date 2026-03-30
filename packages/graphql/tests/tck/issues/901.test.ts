/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/901", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Series @node {
                id: ID! @id
                name: String!
                brand: [Series!]! @relationship(type: "HAS_BRAND", direction: OUT, properties: "Properties")
                manufacturer: [Series!]!
                    @relationship(type: "HAS_MANUFACTURER", direction: OUT, properties: "Properties")
            }

            type Properties @relationshipProperties {
                current: Boolean
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("conjuctions", async () => {
        const query = /* GraphQL */ `
            query ($where: SeriesWhere) {
                series(where: $where) {
                    name
                    brand {
                        name
                    }
                    manufacturer {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                where: {
                    OR: [
                        {
                            manufacturerConnection: {
                                some: {
                                    edge: {
                                        current: { eq: true },
                                    },
                                    node: {
                                        name: { eq: "abc" },
                                    },
                                },
                            },
                        },
                        {
                            brandConnection: {
                                some: {
                                    edge: {
                                        current: { eq: true },
                                    },
                                    node: {
                                        name: { eq: "smart" },
                                    },
                                },
                            },
                        },
                    ],
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Series)
            WHERE (EXISTS {
              MATCH (this)-[this0:HAS_MANUFACTURER]->(this1:Series)
              WHERE (this1.name = $param0 AND this0.current = $param1)
            } OR EXISTS {
              MATCH (this)-[this2:HAS_BRAND]->(this3:Series)
              WHERE (this3.name = $param2 AND this2.current = $param3)
            })
            CALL (this) {
              MATCH (this)-[this4:HAS_BRAND]->(this5:Series)
              WITH DISTINCT this5
              WITH this5 { .name } AS this5
              RETURN collect(this5) AS var6
            }
            CALL (this) {
              MATCH (this)-[this7:HAS_MANUFACTURER]->(this8:Series)
              WITH DISTINCT this8
              WITH this8 { .name } AS this8
              RETURN collect(this8) AS var9
            }
            RETURN this { .name, brand: var6, manufacturer: var9 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"abc\\",
                \\"param1\\": true,
                \\"param2\\": \\"smart\\",
                \\"param3\\": true
            }"
        `);
    });
});
