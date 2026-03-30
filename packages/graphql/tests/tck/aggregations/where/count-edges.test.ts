/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher Aggregations where with count edges", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
            }

            type Post @node {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Equality Count Edges", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesConnection: { aggregate: { count: { edges: { eq: 10 } } } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            CALL (this) {
              MATCH (this)-[this0:LIKES]->(this1:User)
              RETURN count(this0) = $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LT Count Edges", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesConnection: { aggregate: { count: { edges: { lt: 10 } } } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            CALL (this) {
              MATCH (this)-[this0:LIKES]->(this1:User)
              RETURN count(this0) < $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("Combined Count Edges and Nodes", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesConnection: { aggregate: { count: { edges: { eq: 3 }, nodes: { eq: 2 } } } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            CALL (this) {
              MATCH (this)-[this0:LIKES]->(this1:User)
              WITH DISTINCT this1
              RETURN count(this1) = $param0 AS var2
            }
            CALL (this) {
              MATCH (this)-[this3:LIKES]->(this4:User)
              RETURN count(this3) = $param1 AS var5
            }
            WITH *
            WHERE (var2 = true AND var5 = true)
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 3,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
