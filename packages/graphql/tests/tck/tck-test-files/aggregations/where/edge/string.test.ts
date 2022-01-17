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
import { createJwtRequest } from "../../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../../utils/tck-test-utils";

describe("Cypher Aggregations where edge with String", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                name: String!
            }

            type Post {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            interface Likes {
                someString: String
                someStringAlias: String @alias(property: "_someStringAlias")
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
                posts(where: { likesAggregate: { edge: { someString_EQUAL: "10" } } }) {
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
            RETURN this_likesAggregate_edge.someString = $this_likesAggregate_edge_someString_EQUAL
            \\", { this: this, this_likesAggregate_edge_someString_EQUAL: $this_likesAggregate_edge_someString_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_EQUAL\\": \\"10\\"
            }"
        `);
    });

    test("EQUAL with alias", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someStringAlias_EQUAL: "10" } } }) {
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
            RETURN this_likesAggregate_edge._someStringAlias = $this_likesAggregate_edge_someStringAlias_EQUAL
            \\", { this: this, this_likesAggregate_edge_someStringAlias_EQUAL: $this_likesAggregate_edge_someStringAlias_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someStringAlias_EQUAL\\": \\"10\\"
            }"
        `);
    });

    test("GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_GT: 10 } } }) {
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
            RETURN size(this_likesAggregate_edge.someString) > $this_likesAggregate_edge_someString_GT
            \\", { this: this, this_likesAggregate_edge_someString_GT: $this_likesAggregate_edge_someString_GT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_GT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_GTE: 10 } } }) {
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
            RETURN size(this_likesAggregate_edge.someString) >= $this_likesAggregate_edge_someString_GTE
            \\", { this: this, this_likesAggregate_edge_someString_GTE: $this_likesAggregate_edge_someString_GTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_GTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_LT: 10 } } }) {
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
            RETURN size(this_likesAggregate_edge.someString) < $this_likesAggregate_edge_someString_LT
            \\", { this: this, this_likesAggregate_edge_someString_LT: $this_likesAggregate_edge_someString_LT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_LT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_LTE: 10 } } }) {
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
            RETURN size(this_likesAggregate_edge.someString) <= $this_likesAggregate_edge_someString_LTE
            \\", { this: this, this_likesAggregate_edge_someString_LTE: $this_likesAggregate_edge_someString_LTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_LTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SHORTEST_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_SHORTEST_EQUAL: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_SHORTEST_EQUAL_SIZE
            RETURN min(this_likesAggregate_edge_someString_SHORTEST_EQUAL_SIZE) = $this_likesAggregate_edge_someString_SHORTEST_EQUAL
            \\", { this: this, this_likesAggregate_edge_someString_SHORTEST_EQUAL: $this_likesAggregate_edge_someString_SHORTEST_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_SHORTEST_EQUAL\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SHORTEST_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_SHORTEST_GT: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_SHORTEST_GT_SIZE
            RETURN min(this_likesAggregate_edge_someString_SHORTEST_GT_SIZE) > $this_likesAggregate_edge_someString_SHORTEST_GT
            \\", { this: this, this_likesAggregate_edge_someString_SHORTEST_GT: $this_likesAggregate_edge_someString_SHORTEST_GT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_SHORTEST_GT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SHORTEST_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_SHORTEST_GTE: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_SHORTEST_GTE_SIZE
            RETURN min(this_likesAggregate_edge_someString_SHORTEST_GTE_SIZE) >= $this_likesAggregate_edge_someString_SHORTEST_GTE
            \\", { this: this, this_likesAggregate_edge_someString_SHORTEST_GTE: $this_likesAggregate_edge_someString_SHORTEST_GTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_SHORTEST_GTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SHORTEST_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_SHORTEST_LT: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_SHORTEST_LT_SIZE
            RETURN min(this_likesAggregate_edge_someString_SHORTEST_LT_SIZE) < $this_likesAggregate_edge_someString_SHORTEST_LT
            \\", { this: this, this_likesAggregate_edge_someString_SHORTEST_LT: $this_likesAggregate_edge_someString_SHORTEST_LT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_SHORTEST_LT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SHORTEST_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_SHORTEST_LTE: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_SHORTEST_LTE_SIZE
            RETURN min(this_likesAggregate_edge_someString_SHORTEST_LTE_SIZE) <= $this_likesAggregate_edge_someString_SHORTEST_LTE
            \\", { this: this, this_likesAggregate_edge_someString_SHORTEST_LTE: $this_likesAggregate_edge_someString_SHORTEST_LTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_SHORTEST_LTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LONGEST_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_LONGEST_EQUAL: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_LONGEST_EQUAL_SIZE
            RETURN max(this_likesAggregate_edge_someString_LONGEST_EQUAL_SIZE) = $this_likesAggregate_edge_someString_LONGEST_EQUAL
            \\", { this: this, this_likesAggregate_edge_someString_LONGEST_EQUAL: $this_likesAggregate_edge_someString_LONGEST_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_LONGEST_EQUAL\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LONGEST_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_LONGEST_GT: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_LONGEST_GT_SIZE
            RETURN max(this_likesAggregate_edge_someString_LONGEST_GT_SIZE) > $this_likesAggregate_edge_someString_LONGEST_GT
            \\", { this: this, this_likesAggregate_edge_someString_LONGEST_GT: $this_likesAggregate_edge_someString_LONGEST_GT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_LONGEST_GT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LONGEST_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_LONGEST_GTE: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_LONGEST_GTE_SIZE
            RETURN max(this_likesAggregate_edge_someString_LONGEST_GTE_SIZE) >= $this_likesAggregate_edge_someString_LONGEST_GTE
            \\", { this: this, this_likesAggregate_edge_someString_LONGEST_GTE: $this_likesAggregate_edge_someString_LONGEST_GTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_LONGEST_GTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LONGEST_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_LONGEST_LT: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_LONGEST_LT_SIZE
            RETURN max(this_likesAggregate_edge_someString_LONGEST_LT_SIZE) < $this_likesAggregate_edge_someString_LONGEST_LT
            \\", { this: this, this_likesAggregate_edge_someString_LONGEST_LT: $this_likesAggregate_edge_someString_LONGEST_LT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_LONGEST_LT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LONGEST_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_LONGEST_LTE: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_LONGEST_LTE_SIZE
            RETURN max(this_likesAggregate_edge_someString_LONGEST_LTE_SIZE) <= $this_likesAggregate_edge_someString_LONGEST_LTE
            \\", { this: this, this_likesAggregate_edge_someString_LONGEST_LTE: $this_likesAggregate_edge_someString_LONGEST_LTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_LONGEST_LTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("AVERAGE_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_AVERAGE_EQUAL: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_AVERAGE_EQUAL_SIZE
            RETURN avg(this_likesAggregate_edge_someString_AVERAGE_EQUAL_SIZE) = toFloat($this_likesAggregate_edge_someString_AVERAGE_EQUAL)
            \\", { this: this, this_likesAggregate_edge_someString_AVERAGE_EQUAL: $this_likesAggregate_edge_someString_AVERAGE_EQUAL }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_AVERAGE_EQUAL\\": 10
            }"
        `);
    });

    test("AVERAGE_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_AVERAGE_GT: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_AVERAGE_GT_SIZE
            RETURN avg(this_likesAggregate_edge_someString_AVERAGE_GT_SIZE) > toFloat($this_likesAggregate_edge_someString_AVERAGE_GT)
            \\", { this: this, this_likesAggregate_edge_someString_AVERAGE_GT: $this_likesAggregate_edge_someString_AVERAGE_GT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_AVERAGE_GT\\": 10
            }"
        `);
    });

    test("AVERAGE_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_AVERAGE_GTE: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_AVERAGE_GTE_SIZE
            RETURN avg(this_likesAggregate_edge_someString_AVERAGE_GTE_SIZE) >= toFloat($this_likesAggregate_edge_someString_AVERAGE_GTE)
            \\", { this: this, this_likesAggregate_edge_someString_AVERAGE_GTE: $this_likesAggregate_edge_someString_AVERAGE_GTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_AVERAGE_GTE\\": 10
            }"
        `);
    });

    test("AVERAGE_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_AVERAGE_LT: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_AVERAGE_LT_SIZE
            RETURN avg(this_likesAggregate_edge_someString_AVERAGE_LT_SIZE) < toFloat($this_likesAggregate_edge_someString_AVERAGE_LT)
            \\", { this: this, this_likesAggregate_edge_someString_AVERAGE_LT: $this_likesAggregate_edge_someString_AVERAGE_LT }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_AVERAGE_LT\\": 10
            }"
        `);
    });

    test("AVERAGE_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { edge: { someString_AVERAGE_LTE: 10 } } }) {
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
            WITH this_likesAggregate_node, this_likesAggregate_edge, size(this_likesAggregate_edge.someString) AS this_likesAggregate_edge_someString_AVERAGE_LTE_SIZE
            RETURN avg(this_likesAggregate_edge_someString_AVERAGE_LTE_SIZE) <= toFloat($this_likesAggregate_edge_someString_AVERAGE_LTE)
            \\", { this: this, this_likesAggregate_edge_someString_AVERAGE_LTE: $this_likesAggregate_edge_someString_AVERAGE_LTE }, false )
            RETURN this { .content } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this_likesAggregate_edge_someString_AVERAGE_LTE\\": 10
            }"
        `);
    });
});
