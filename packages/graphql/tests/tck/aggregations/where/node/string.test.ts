/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../../utils/tck-test-utils";

describe("Cypher Aggregations where node with String", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User {
                name: String!
                someStringAlias: String @alias(property: "_someStringAlias")
            }

            type Post {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_EQUAL: "10" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN any(var2 IN collect(this1.name) WHERE var2 = $param0) AS var3
            }
            WITH *
            WHERE var3 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"10\\"
            }"
        `);
    });

    test("EQUAL with alias", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someStringAlias_EQUAL: "10" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN any(var2 IN collect(this1._someStringAlias) WHERE var2 = $param0) AS var3
            }
            WITH *
            WHERE var3 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"10\\"
            }"
        `);
    });

    test("GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_GT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN any(var2 IN collect(size(this1.name)) WHERE var2 > $param0) AS var3
            }
            WITH *
            WHERE var3 = true
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

    test("GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_GTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN any(var2 IN collect(size(this1.name)) WHERE var2 >= $param0) AS var3
            }
            WITH *
            WHERE var3 = true
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

    test("LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN any(var2 IN collect(size(this1.name)) WHERE var2 < $param0) AS var3
            }
            WITH *
            WHERE var3 = true
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

    test("LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN any(var2 IN collect(size(this1.name)) WHERE var2 <= $param0) AS var3
            }
            WITH *
            WHERE var3 = true
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

    test("SHORTEST_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_EQUAL: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN min(size(this1.name)) = $param0 AS var2
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

    test("SHORTEST_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_GT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN min(size(this1.name)) > $param0 AS var2
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

    test("SHORTEST_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_GTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN min(size(this1.name)) >= $param0 AS var2
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

    test("SHORTEST_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_LT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN min(size(this1.name)) < $param0 AS var2
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

    test("SHORTEST_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_LTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN min(size(this1.name)) <= $param0 AS var2
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

    test("LONGEST_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_EQUAL: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN max(size(this1.name)) = $param0 AS var2
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

    test("LONGEST_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_GT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN max(size(this1.name)) > $param0 AS var2
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

    test("LONGEST_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_GTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN max(size(this1.name)) >= $param0 AS var2
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

    test("LONGEST_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_LT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN max(size(this1.name)) < $param0 AS var2
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

    test("LONGEST_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_LTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN max(size(this1.name)) <= $param0 AS var2
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

    test("AVERAGE_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_EQUAL: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN avg(size(this1.name)) = $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });

    test("AVERAGE_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_GT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN avg(size(this1.name)) > $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });

    test("AVERAGE_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_GTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN avg(size(this1.name)) >= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });

    test("AVERAGE_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_LT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN avg(size(this1.name)) < $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });

    test("AVERAGE_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_LTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1:User)
                RETURN avg(size(this1.name)) <= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });
});

describe("Cypher Aggregations where node with String interface relationships of concrete types", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Human {
                name: String!
                someStringAlias: String
            }

            type User implements Human @node(labels: ["User", "Employee"]) {
                name: String!
                someStringAlias: String @alias(property: "_someStringAlias")
            }

            type Person implements Human {
                name: String!
                someStringAlias: String
            }

            type Post {
                content: String!
                likes: [Human!]! @relationship(type: "LIKES", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_EQUAL: "10" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN any(var2 IN collect(this1.name) WHERE var2 = $param0) AS var3
            }
            WITH *
            WHERE var3 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"10\\"
            }"
        `);
    });

    test("EQUAL with alias", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { someStringAlias_EQUAL: "10" } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN any(var2 IN collect(CASE
                    WHEN this1:User:Employee THEN this1._someStringAlias
                    ELSE this1.someStringAlias
                END) WHERE var2 = $param0) AS var3
            }
            WITH *
            WHERE var3 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"10\\"
            }"
        `);
    });

    test("GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_GT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN any(var2 IN collect(size(this1.name)) WHERE var2 > $param0) AS var3
            }
            WITH *
            WHERE var3 = true
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

    test("GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_GTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN any(var2 IN collect(size(this1.name)) WHERE var2 >= $param0) AS var3
            }
            WITH *
            WHERE var3 = true
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

    test("LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN any(var2 IN collect(size(this1.name)) WHERE var2 < $param0) AS var3
            }
            WITH *
            WHERE var3 = true
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

    test("LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN any(var2 IN collect(size(this1.name)) WHERE var2 <= $param0) AS var3
            }
            WITH *
            WHERE var3 = true
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

    test("SHORTEST_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_EQUAL: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN min(size(this1.name)) = $param0 AS var2
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

    test("SHORTEST_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_GT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN min(size(this1.name)) > $param0 AS var2
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

    test("SHORTEST_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_GTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN min(size(this1.name)) >= $param0 AS var2
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

    test("SHORTEST_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_LT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN min(size(this1.name)) < $param0 AS var2
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

    test("SHORTEST_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_LTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN min(size(this1.name)) <= $param0 AS var2
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

    test("LONGEST_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_EQUAL: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN max(size(this1.name)) = $param0 AS var2
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

    test("LONGEST_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_GT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN max(size(this1.name)) > $param0 AS var2
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

    test("LONGEST_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_GTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN max(size(this1.name)) >= $param0 AS var2
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

    test("LONGEST_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_LT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN max(size(this1.name)) < $param0 AS var2
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

    test("LONGEST_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_LTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN max(size(this1.name)) <= $param0 AS var2
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

    test("AVERAGE_EQUAL", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_EQUAL: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN avg(size(this1.name)) = $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });

    test("AVERAGE_GT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_GT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN avg(size(this1.name)) > $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });

    test("AVERAGE_GTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_GTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN avg(size(this1.name)) >= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });

    test("AVERAGE_LT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_LT: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN avg(size(this1.name)) < $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });

    test("AVERAGE_LTE", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_LTE: 10 } } }) {
                    content
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            CALL {
                WITH this
                MATCH (this)<-[this0:LIKES]-(this1)
                WHERE (this1:User:Employee OR this1:Person)
                RETURN avg(size(this1.name)) <= $param0 AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });
});
