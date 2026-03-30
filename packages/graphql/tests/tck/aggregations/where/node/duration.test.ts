/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher Aggregations where node with Duration", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                someDuration: Duration
                someDurationAlias: Duration @alias(property: "_someDurationAlias")
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

    test("AVERAGE_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { average: { eq: "P1Y" } } } } }) {
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
              RETURN (datetime() + avg(this1.someDuration)) = (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("AVERAGE_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { average: { gt: "P1Y" } } } } }) {
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
              RETURN (datetime() + avg(this1.someDuration)) > (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("AVERAGE_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { average: { gte: "P1Y" } } } } }) {
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
              RETURN (datetime() + avg(this1.someDuration)) >= (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("AVERAGE_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { average: { lt: "P1Y" } } } } }) {
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
              RETURN (datetime() + avg(this1.someDuration)) < (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("AVERAGE_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { average: { lte: "P1Y" } } } } }) {
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
              RETURN (datetime() + avg(this1.someDuration)) <= (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("MIN_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { min: { eq: "P1Y" } } } } }) {
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
              RETURN (datetime() + min(this1.someDuration)) = (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("MIN_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { min: { gt: "P1Y" } } } } }) {
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
              RETURN (datetime() + min(this1.someDuration)) > (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("MIN_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { min: { gte: "P1Y" } } } } }) {
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
              RETURN (datetime() + min(this1.someDuration)) >= (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("MIN_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { min: { lt: "P1Y" } } } } }) {
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
              RETURN (datetime() + min(this1.someDuration)) < (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("MIN_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { min: { lte: "P1Y" } } } } }) {
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
              RETURN (datetime() + min(this1.someDuration)) <= (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("MAX_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { max: { eq: "P1Y" } } } } }) {
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
              RETURN (datetime() + max(this1.someDuration)) = (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("MAX_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { max: { gt: "P1Y" } } } } }) {
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
              RETURN (datetime() + max(this1.someDuration)) > (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("MAX_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { max: { gte: "P1Y" } } } } }) {
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
              RETURN (datetime() + max(this1.someDuration)) >= (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("MAX_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { max: { lt: "P1Y" } } } } }) {
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
              RETURN (datetime() + max(this1.someDuration)) < (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });

    test("MAX_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someDuration: { max: { lte: "P1Y" } } } } }) {
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
              RETURN (datetime() + max(this1.someDuration)) <= (datetime() + $param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"months\\": 12,
                    \\"days\\": 0,
                    \\"seconds\\": 0,
                    \\"nanoseconds\\": 0
                }
            }"
        `);
    });
});
