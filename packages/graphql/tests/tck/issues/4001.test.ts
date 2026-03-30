/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/4001", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            input Pagination {
                limit: Int = 20
                offset: Int = 0
            }

            type Video @node {
                id: ID!
            }

            type Serie @node {
                id: ID!

                allEpisodes(options: Pagination): [Video!]!
                    @cypher(
                        statement: """
                        MATCH (n:Video) RETURN n
                        SKIP toInteger($options.offset) LIMIT toInteger($options.limit)
                        """
                        columnName: "n"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("resolve @cypher field with custom input types", async () => {
        const query = /* GraphQL */ `
            query {
                series {
                    allEpisodes(options: { limit: 10, offset: 0 }) {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Serie)
            CALL (this) {
              CALL (this) {
                WITH this AS this
                MATCH (n:Video) RETURN n
                SKIP toInteger($param0.offset) LIMIT toInteger($param0.limit)
              }
              WITH n AS this0
              WITH this0 { .id } AS this0
              RETURN collect(this0) AS var1
            }
            RETURN this { allEpisodes: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"limit\\": {
                        \\"low\\": 10,
                        \\"high\\": 0
                    },
                    \\"offset\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("resolve @cypher field with custom input types argument", async () => {
        const query = /* GraphQL */ `
            query ($option: Pagination) {
                series {
                    allEpisodes(options: $option) {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {
            variableValues: {
                option: {
                    limit: 10,
                    offset: 0,
                },
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Serie)
            CALL (this) {
              CALL (this) {
                WITH this AS this
                MATCH (n:Video) RETURN n
                SKIP toInteger($param0.offset) LIMIT toInteger($param0.limit)
              }
              WITH n AS this0
              WITH this0 { .id } AS this0
              RETURN collect(this0) AS var1
            }
            RETURN this { allEpisodes: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"limit\\": {
                        \\"low\\": 10,
                        \\"high\\": 0
                    },
                    \\"offset\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });

    test("resolve @cypher field with custom input types default", async () => {
        const query = /* GraphQL */ `
            query {
                series {
                    allEpisodes(options: {}) {
                        id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Serie)
            CALL (this) {
              CALL (this) {
                WITH this AS this
                MATCH (n:Video) RETURN n
                SKIP toInteger($param0.offset) LIMIT toInteger($param0.limit)
              }
              WITH n AS this0
              WITH this0 { .id } AS this0
              RETURN collect(this0) AS var1
            }
            RETURN this { allEpisodes: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"limit\\": {
                        \\"low\\": 20,
                        \\"high\\": 0
                    },
                    \\"offset\\": {
                        \\"low\\": 0,
                        \\"high\\": 0
                    }
                }
            }"
        `);
    });
});
