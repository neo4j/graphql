/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher Aggregations where edge with Time", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String
            }

            type Post @node {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            type Likes @relationshipProperties {
                someTime: Time
                someTimeAlias: Time @alias(property: "_someTimeAlias")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("MIN_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someTime: { min: { eq: "12:00:00" } } } } }) {
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
              RETURN min(this0.someTime) = time($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"12:00:00\\"
            }"
        `);
    });

    test("MIN_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someTime: { min: { gt: "12:00:00" } } } } }) {
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
              RETURN min(this0.someTime) > time($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"12:00:00\\"
            }"
        `);
    });

    test("MIN_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someTime: { min: { gte: "12:00:00" } } } } }) {
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
              RETURN min(this0.someTime) >= time($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"12:00:00\\"
            }"
        `);
    });

    test("MIN_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someTime: { min: { lt: "12:00:00" } } } } }) {
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
              RETURN min(this0.someTime) < time($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"12:00:00\\"
            }"
        `);
    });

    test("MIN_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someTime: { min: { lte: "12:00:00" } } } } }) {
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
              RETURN min(this0.someTime) <= time($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"12:00:00\\"
            }"
        `);
    });

    test("MAX_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someTime: { max: { eq: "12:00:00" } } } } }) {
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
              RETURN max(this0.someTime) = time($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"12:00:00\\"
            }"
        `);
    });

    test("MAX_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someTime: { max: { gt: "12:00:00" } } } } }) {
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
              RETURN max(this0.someTime) > time($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"12:00:00\\"
            }"
        `);
    });

    test("MAX_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someTime: { max: { gte: "12:00:00" } } } } }) {
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
              RETURN max(this0.someTime) >= time($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"12:00:00\\"
            }"
        `);
    });

    test("MAX_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someTime: { max: { lt: "12:00:00" } } } } }) {
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
              RETURN max(this0.someTime) < time($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"12:00:00\\"
            }"
        `);
    });

    test("MAX_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someTime: { max: { lte: "12:00:00" } } } } }) {
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
              RETURN max(this0.someTime) <= time($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"12:00:00\\"
            }"
        `);
    });
});
