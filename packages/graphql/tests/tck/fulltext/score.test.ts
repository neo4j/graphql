/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher -> fulltext -> Score", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie
                @fulltext(indexes: [{ indexName: "MovieTitle", queryName: "moviesByTitle", fields: ["title"] }])
                @node {
                title: String
                released: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("simple match with single property and score", async () => {
        const query = /* GraphQL */ `
            query {
                moviesByTitle(phrase: "a different name") {
                    edges {
                        score
                        node {
                            title
                            released
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL db.index.fulltext.queryNodes('MovieTitle', $param0) YIELD node AS this0, score AS var1
            WHERE $param1 IN labels(this0)
            WITH collect({node: this0, score: var1}) AS edges
            WITH edges, size(edges) AS totalCount
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0, edge.score AS var1
              RETURN collect({node: {title: this0.title, released: this0.released, __resolveType: 'Movie'}, score: var1}) AS var2
            }
            RETURN {edges: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });

    test("simple match with single property and score and filter", async () => {
        const query = /* GraphQL */ `
            query {
                moviesByTitle(phrase: "a different name", where: { node: { released: { gt: 2000 } } }) {
                    edges {
                        score
                        node {
                            title
                            released
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL db.index.fulltext.queryNodes('MovieTitle', $param0) YIELD node AS this0, score AS var1
            WHERE ($param1 IN labels(this0) AND this0.released > $param2)
            WITH collect({node: this0, score: var1}) AS edges
            WITH edges, size(edges) AS totalCount
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0, edge.score AS var1
              RETURN collect({node: {title: this0.title, released: this0.released, __resolveType: 'Movie'}, score: var1}) AS var2
            }
            RETURN {edges: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\",
                \\"param2\\": {
                    \\"low\\": 2000,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("with score filtering", async () => {
        const query = /* GraphQL */ `
            query {
                moviesByTitle(phrase: "a different name", where: { score: { min: 0.5 } }) {
                    edges {
                        score
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL db.index.fulltext.queryNodes('MovieTitle', $param0) YIELD node AS this0, score AS var1
            WHERE ($param1 IN labels(this0) AND var1 >= $param2)
            WITH collect({node: this0, score: var1}) AS edges
            WITH edges, size(edges) AS totalCount
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0, edge.score AS var1
              RETURN collect({node: {title: this0.title, __resolveType: 'Movie'}, score: var1}) AS var2
            }
            RETURN {edges: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\",
                \\"param2\\": 0.5
            }"
        `);
    });

    test("with sorting", async () => {
        const query = /* GraphQL */ `
            query {
                moviesByTitle(phrase: "a different name", sort: { node: { title: DESC } }) {
                    edges {
                        score
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL db.index.fulltext.queryNodes('MovieTitle', $param0) YIELD node AS this0, score AS var1
            WHERE $param1 IN labels(this0)
            WITH collect({node: this0, score: var1}) AS edges
            WITH edges, size(edges) AS totalCount
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0, edge.score AS var1
              WITH *
              ORDER BY this0.title DESC
              RETURN collect({node: {title: this0.title, __resolveType: 'Movie'}, score: var1}) AS var2
            }
            RETURN {edges: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });

    test("with score sorting", async () => {
        const query = /* GraphQL */ `
            query {
                moviesByTitle(phrase: "a different name", sort: { score: ASC }) {
                    edges {
                        score
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL db.index.fulltext.queryNodes('MovieTitle', $param0) YIELD node AS this0, score AS var1
            WHERE $param1 IN labels(this0)
            WITH collect({node: this0, score: var1}) AS edges
            WITH edges, size(edges) AS totalCount
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0, edge.score AS var1
              WITH *
              ORDER BY var1 ASC
              RETURN collect({node: {title: this0.title, __resolveType: 'Movie'}, score: var1}) AS var2
            }
            RETURN {edges: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });

    test("with score and normal sorting", async () => {
        const query = /* GraphQL */ `
            query {
                moviesByTitle(phrase: "a different name", sort: [{ score: ASC }, { node: { title: DESC } }]) {
                    edges {
                        score
                        node {
                            title
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query, {});

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL db.index.fulltext.queryNodes('MovieTitle', $param0) YIELD node AS this0, score AS var1
            WHERE $param1 IN labels(this0)
            WITH collect({node: this0, score: var1}) AS edges
            WITH edges, size(edges) AS totalCount
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0, edge.score AS var1
              WITH *
              ORDER BY var1 ASC, this0.title DESC
              RETURN collect({node: {title: this0.title, __resolveType: 'Movie'}, score: var1}) AS var2
            }
            RETURN {edges: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"a different name\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });
});
