/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher -> fulltext -> Match", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie
                @fulltext(indexes: [{ indexName: "MovieTitle", queryName: "moviesByTitle", fields: ["title"] }])
                @node {
                title: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("simple match with single fulltext property", async () => {
        const query = /* GraphQL */ `
            query {
                moviesByTitle(phrase: "something AND something") {
                    edges {
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
            WITH collect({node: this0}) AS edges
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              RETURN collect({node: {title: this0.title, __resolveType: 'Movie'}}) AS var2
            }
            RETURN {edges: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\",
                \\"param1\\": \\"Movie\\"
            }"
        `);
    });

    test("match with where and single fulltext property", async () => {
        const query = /* GraphQL */ `
            query {
                moviesByTitle(phrase: "something AND something", where: { node: { title: { eq: "some-title" } } }) {
                    edges {
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
            WHERE ($param1 IN labels(this0) AND this0.title = $param2)
            WITH collect({node: this0}) AS edges
            CALL (edges) {
              UNWIND edges AS edge
              WITH edge.node AS this0
              RETURN collect({node: {title: this0.title, __resolveType: 'Movie'}}) AS var2
            }
            RETURN {edges: var2} AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"something AND something\\",
                \\"param1\\": \\"Movie\\",
                \\"param2\\": \\"some-title\\"
            }"
        `);
    });
});
