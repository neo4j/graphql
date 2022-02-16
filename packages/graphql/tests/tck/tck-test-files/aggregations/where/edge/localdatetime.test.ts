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

import { gql } from "apollo-server";
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../../../utils/tck-test-utils";
import { createJwtRequest } from "../../../../../utils/create-jwt-request";

describe("Cypher Aggregations where edge with LocalDateTime", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                name: String
            }

            type Post {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            interface Likes {
                someLocalDateTime: LocalDateTime
                someLocalDateTimeAlias: LocalDateTime @alias(property: "_someLocalDateTimeAlias")
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_EQUAL: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN this_likesAggregate_edge.someLocalDateTime = $this_likesAggregate_edge_someLocalDateTime_EQUAL
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_EQUAL: $this_likesAggregate_edge_someLocalDateTime_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_EQUAL\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("EQUAL with alias", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTimeAlias_EQUAL: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN this_likesAggregate_edge._someLocalDateTimeAlias = $this_likesAggregate_edge_someLocalDateTimeAlias_EQUAL
            \\", { this: this, this_likesAggregate_edge_someLocalDateTimeAlias_EQUAL: $this_likesAggregate_edge_someLocalDateTimeAlias_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTimeAlias_EQUAL\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_GT: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN this_likesAggregate_edge.someLocalDateTime > $this_likesAggregate_edge_someLocalDateTime_GT
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_GT: $this_likesAggregate_edge_someLocalDateTime_GT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_GT\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_GTE: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN this_likesAggregate_edge.someLocalDateTime >= $this_likesAggregate_edge_someLocalDateTime_GTE
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_GTE: $this_likesAggregate_edge_someLocalDateTime_GTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_GTE\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_LT: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN this_likesAggregate_edge.someLocalDateTime < $this_likesAggregate_edge_someLocalDateTime_LT
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_LT: $this_likesAggregate_edge_someLocalDateTime_LT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_LT\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_LTE: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN this_likesAggregate_edge.someLocalDateTime <= $this_likesAggregate_edge_someLocalDateTime_LTE
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_LTE: $this_likesAggregate_edge_someLocalDateTime_LTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_LTE\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MIN_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_MIN_EQUAL: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN  min(this_likesAggregate_edge.someLocalDateTime) = $this_likesAggregate_edge_someLocalDateTime_MIN_EQUAL
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_MIN_EQUAL: $this_likesAggregate_edge_someLocalDateTime_MIN_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_MIN_EQUAL\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MIN_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_MIN_GT: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN  min(this_likesAggregate_edge.someLocalDateTime) > $this_likesAggregate_edge_someLocalDateTime_MIN_GT
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_MIN_GT: $this_likesAggregate_edge_someLocalDateTime_MIN_GT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_MIN_GT\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MIN_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_MIN_GTE: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN  min(this_likesAggregate_edge.someLocalDateTime) >= $this_likesAggregate_edge_someLocalDateTime_MIN_GTE
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_MIN_GTE: $this_likesAggregate_edge_someLocalDateTime_MIN_GTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_MIN_GTE\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MIN_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_MIN_LT: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN  min(this_likesAggregate_edge.someLocalDateTime) < $this_likesAggregate_edge_someLocalDateTime_MIN_LT
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_MIN_LT: $this_likesAggregate_edge_someLocalDateTime_MIN_LT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_MIN_LT\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MIN_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_MIN_LTE: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN  min(this_likesAggregate_edge.someLocalDateTime) <= $this_likesAggregate_edge_someLocalDateTime_MIN_LTE
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_MIN_LTE: $this_likesAggregate_edge_someLocalDateTime_MIN_LTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_MIN_LTE\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MAX_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_MAX_EQUAL: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN  max(this_likesAggregate_edge.someLocalDateTime) = $this_likesAggregate_edge_someLocalDateTime_MAX_EQUAL
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_MAX_EQUAL: $this_likesAggregate_edge_someLocalDateTime_MAX_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_MAX_EQUAL\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MAX_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_MAX_GT: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN  max(this_likesAggregate_edge.someLocalDateTime) > $this_likesAggregate_edge_someLocalDateTime_MAX_GT
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_MAX_GT: $this_likesAggregate_edge_someLocalDateTime_MAX_GT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_MAX_GT\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MAX_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_MAX_GTE: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN  max(this_likesAggregate_edge.someLocalDateTime) >= $this_likesAggregate_edge_someLocalDateTime_MAX_GTE
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_MAX_GTE: $this_likesAggregate_edge_someLocalDateTime_MAX_GTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_MAX_GTE\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MAX_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_MAX_LT: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN  max(this_likesAggregate_edge.someLocalDateTime) < $this_likesAggregate_edge_someLocalDateTime_MAX_LT
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_MAX_LT: $this_likesAggregate_edge_someLocalDateTime_MAX_LT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_MAX_LT\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });

    test("MAX_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someLocalDateTime_MAX_LTE: "2003-09-14T12:00:00" } } }) {
                    content
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Post)
            WHERE apoc.cypher.runFirstColumn(\\" MATCH (this)<-[this_likesAggregate_edge:LIKES]-(this_likesAggregate_node:User)
            RETURN  max(this_likesAggregate_edge.someLocalDateTime) <= $this_likesAggregate_edge_someLocalDateTime_MAX_LTE
            \\", { this: this, this_likesAggregate_edge_someLocalDateTime_MAX_LTE: $this_likesAggregate_edge_someLocalDateTime_MAX_LTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someLocalDateTime_MAX_LTE\\": {
                    \\"year\\": 2003,
                    \\"month\\": 9,
                    \\"day\\": 14,
                    \\"hour\\": 12,
                    \\"minute\\": 0,
                    \\"second\\": 0,
                    \\"nanosecond\\": 0
                }
            }"
        `);
    });
});
