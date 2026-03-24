/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher Aggregations where edge with LocalTime", () => {
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
                someLocalTime: LocalTime
                someLocalTimeAlias: LocalTime @alias(property: "_someLocalTimeAlias")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("MIN_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someLocalTime: { min: { eq: "12:00:00" } } } } }) {
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
              RETURN min(this0.someLocalTime) = $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MIN_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someLocalTime: { min: { gt: "12:00:00" } } } } }) {
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
              RETURN min(this0.someLocalTime) > $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MIN_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someLocalTime: { min: { gte: "12:00:00" } } } } }) {
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
              RETURN min(this0.someLocalTime) >= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MIN_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someLocalTime: { min: { lt: "12:00:00" } } } } }) {
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
              RETURN min(this0.someLocalTime) < $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MIN_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someLocalTime: { min: { lte: "12:00:00" } } } } }) {
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
              RETURN min(this0.someLocalTime) <= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MAX_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someLocalTime: { max: { eq: "12:00:00" } } } } }) {
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
              RETURN max(this0.someLocalTime) = $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MAX_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someLocalTime: { max: { gt: "12:00:00" } } } } }) {
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
              RETURN max(this0.someLocalTime) > $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MAX_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someLocalTime: { max: { gte: "12:00:00" } } } } }) {
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
              RETURN max(this0.someLocalTime) >= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MAX_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someLocalTime: { max: { lt: "12:00:00" } } } } }) {
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
              RETURN max(this0.someLocalTime) < $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MAX_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { edge: { someLocalTime: { max: { lte: "12:00:00" } } } } }) {
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
              RETURN max(this0.someLocalTime) <= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });
});
