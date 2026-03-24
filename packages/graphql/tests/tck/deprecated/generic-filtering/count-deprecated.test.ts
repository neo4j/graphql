/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher Aggregations where with count, deprecated", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
            }

            type Post @node {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Equality Count", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { count: { eq: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            CALL (this) {
              MATCH (this)<-[this0:LIKES]-(this1:User)
              RETURN count(this1) = $param0 AS var2
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

    test("LT Count", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { count: { lt: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            CALL (this) {
              MATCH (this)<-[this0:LIKES]-(this1:User)
              RETURN count(this1) < $param0 AS var2
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

    test("LTE Count", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { count: { lte: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            CALL (this) {
              MATCH (this)<-[this0:LIKES]-(this1:User)
              RETURN count(this1) <= $param0 AS var2
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

    test("GT Count", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { count: { gt: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            CALL (this) {
              MATCH (this)<-[this0:LIKES]-(this1:User)
              RETURN count(this1) > $param0 AS var2
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

    test("GTE Count", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { count: { gte: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Post)
            CALL (this) {
              MATCH (this)<-[this0:LIKES]-(this1:User)
              RETURN count(this1) >= $param0 AS var2
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
});
