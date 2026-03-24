/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher Aggregations where edge with DateTime", () => {
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
                someDateTime: DateTime
                someDateTimeAlias: DateTime @alias(property: "_someDateTimeAlias")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("MIN_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: { likesAggregate: { edge: { someDateTime: { min: { eq: "2021-09-25T12:51:24.037Z" } } } } }
                ) {
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
              RETURN min(this0.someDateTime) = datetime($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-09-25T12:51:24.037Z\\"
            }"
        `);
    });

    test("MIN_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: { likesAggregate: { edge: { someDateTime: { min: { gt: "2021-09-25T12:51:24.037Z" } } } } }
                ) {
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
              RETURN min(this0.someDateTime) > datetime($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-09-25T12:51:24.037Z\\"
            }"
        `);
    });

    test("MIN_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: { likesAggregate: { edge: { someDateTime: { min: { gte: "2021-09-25T12:51:24.037Z" } } } } }
                ) {
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
              RETURN min(this0.someDateTime) >= datetime($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-09-25T12:51:24.037Z\\"
            }"
        `);
    });

    test("MIN_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: { likesAggregate: { edge: { someDateTime: { min: { lt: "2021-09-25T12:51:24.037Z" } } } } }
                ) {
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
              RETURN min(this0.someDateTime) < datetime($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-09-25T12:51:24.037Z\\"
            }"
        `);
    });

    test("MIN_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: { likesAggregate: { edge: { someDateTime: { min: { lte: "2021-09-25T12:51:24.037Z" } } } } }
                ) {
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
              RETURN min(this0.someDateTime) <= datetime($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-09-25T12:51:24.037Z\\"
            }"
        `);
    });

    test("MAX_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: { likesAggregate: { edge: { someDateTime: { max: { eq: "2021-09-25T12:51:24.037Z" } } } } }
                ) {
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
              RETURN max(this0.someDateTime) = datetime($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-09-25T12:51:24.037Z\\"
            }"
        `);
    });

    test("MAX_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: { likesAggregate: { edge: { someDateTime: { max: { gt: "2021-09-25T12:51:24.037Z" } } } } }
                ) {
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
              RETURN max(this0.someDateTime) > datetime($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-09-25T12:51:24.037Z\\"
            }"
        `);
    });

    test("MAX_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: { likesAggregate: { edge: { someDateTime: { max: { gte: "2021-09-25T12:51:24.037Z" } } } } }
                ) {
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
              RETURN max(this0.someDateTime) >= datetime($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-09-25T12:51:24.037Z\\"
            }"
        `);
    });

    test("MAX_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: { likesAggregate: { edge: { someDateTime: { max: { lt: "2021-09-25T12:51:24.037Z" } } } } }
                ) {
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
              RETURN max(this0.someDateTime) < datetime($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-09-25T12:51:24.037Z\\"
            }"
        `);
    });

    test("MAX_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: { likesAggregate: { edge: { someDateTime: { max: { lte: "2021-09-25T12:51:24.037Z" } } } } }
                ) {
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
              RETURN max(this0.someDateTime) <= datetime($param0) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"2021-09-25T12:51:24.037Z\\"
            }"
        `);
    });
});
