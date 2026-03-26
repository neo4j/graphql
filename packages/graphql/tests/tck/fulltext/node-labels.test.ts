/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("Cypher -> fulltext -> Additional Labels", () => {
    test("simple match with single fulltext property and static additionalLabels", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @fulltext(indexes: [{ indexName: "MovieTitle", queryName: "moviesByTitle", fields: ["title"] }])
                @node(labels: ["Movie", "AnotherLabel"]) {
                title: String
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
        });

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

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL db.index.fulltext.queryNodes('MovieTitle', $param0) YIELD node AS this0, score AS var1
            WHERE ($param1 IN labels(this0) AND $param2 IN labels(this0))
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
                \\"param2\\": \\"AnotherLabel\\"
            }"
        `);
    });

    test("simple match with single fulltext property and jwt additionalLabels", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie
                @fulltext(indexes: [{ indexName: "MovieTitle", queryName: "moviesByTitle", fields: ["title"] }])
                @node(labels: ["Movie", "$jwt.label"]) {
                title: String
            }
        `;

        const label = "some-label";

        const secret = "supershhhhhh";

        const neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: { authorization: { key: secret } },
        });

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

        const token = createBearerToken(secret, { label });
        const result = await translateQuery(neoSchema, query, {
            token,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL db.index.fulltext.queryNodes('MovieTitle', $param0) YIELD node AS this0, score AS var1
            WHERE ($param1 IN labels(this0) AND $param2 IN labels(this0))
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
                \\"param2\\": \\"some-label\\"
            }"
        `);
    });
});
