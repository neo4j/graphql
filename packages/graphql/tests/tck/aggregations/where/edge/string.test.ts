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
import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../src";
import { createJwtRequest } from "../../../../utils/create-jwt-request";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher Aggregations where edge with String", () => {
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
            config: { enableRegex: true },
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge.someString = $aggr_edge_someString_EQUAL
            \\", { this: this, aggr_edge_someString_EQUAL: $aggr_edge_someString_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_EQUAL\\": \\"10\\"
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN aggr_edge._someStringAlias = $aggr_edge_someStringAlias_EQUAL
            \\", { this: this, aggr_edge_someStringAlias_EQUAL: $aggr_edge_someStringAlias_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someStringAlias_EQUAL\\": \\"10\\"
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN size(aggr_edge.someString) > $aggr_edge_someString_GT
            \\", { this: this, aggr_edge_someString_GT: $aggr_edge_someString_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_GT\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN size(aggr_edge.someString) >= $aggr_edge_someString_GTE
            \\", { this: this, aggr_edge_someString_GTE: $aggr_edge_someString_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_GTE\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN size(aggr_edge.someString) < $aggr_edge_someString_LT
            \\", { this: this, aggr_edge_someString_LT: $aggr_edge_someString_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_LT\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            RETURN size(aggr_edge.someString) <= $aggr_edge_someString_LTE
            \\", { this: this, aggr_edge_someString_LTE: $aggr_edge_someString_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_LTE\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_SHORTEST_EQUAL_SIZE
            RETURN min(aggr_edge_someString_SHORTEST_EQUAL_SIZE) = $aggr_edge_someString_SHORTEST_EQUAL
            \\", { this: this, aggr_edge_someString_SHORTEST_EQUAL: $aggr_edge_someString_SHORTEST_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_SHORTEST_EQUAL\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_SHORTEST_GT_SIZE
            RETURN min(aggr_edge_someString_SHORTEST_GT_SIZE) > $aggr_edge_someString_SHORTEST_GT
            \\", { this: this, aggr_edge_someString_SHORTEST_GT: $aggr_edge_someString_SHORTEST_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_SHORTEST_GT\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_SHORTEST_GTE_SIZE
            RETURN min(aggr_edge_someString_SHORTEST_GTE_SIZE) >= $aggr_edge_someString_SHORTEST_GTE
            \\", { this: this, aggr_edge_someString_SHORTEST_GTE: $aggr_edge_someString_SHORTEST_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_SHORTEST_GTE\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_SHORTEST_LT_SIZE
            RETURN min(aggr_edge_someString_SHORTEST_LT_SIZE) < $aggr_edge_someString_SHORTEST_LT
            \\", { this: this, aggr_edge_someString_SHORTEST_LT: $aggr_edge_someString_SHORTEST_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_SHORTEST_LT\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_SHORTEST_LTE_SIZE
            RETURN min(aggr_edge_someString_SHORTEST_LTE_SIZE) <= $aggr_edge_someString_SHORTEST_LTE
            \\", { this: this, aggr_edge_someString_SHORTEST_LTE: $aggr_edge_someString_SHORTEST_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_SHORTEST_LTE\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_LONGEST_EQUAL_SIZE
            RETURN max(aggr_edge_someString_LONGEST_EQUAL_SIZE) = $aggr_edge_someString_LONGEST_EQUAL
            \\", { this: this, aggr_edge_someString_LONGEST_EQUAL: $aggr_edge_someString_LONGEST_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_LONGEST_EQUAL\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_LONGEST_GT_SIZE
            RETURN max(aggr_edge_someString_LONGEST_GT_SIZE) > $aggr_edge_someString_LONGEST_GT
            \\", { this: this, aggr_edge_someString_LONGEST_GT: $aggr_edge_someString_LONGEST_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_LONGEST_GT\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_LONGEST_GTE_SIZE
            RETURN max(aggr_edge_someString_LONGEST_GTE_SIZE) >= $aggr_edge_someString_LONGEST_GTE
            \\", { this: this, aggr_edge_someString_LONGEST_GTE: $aggr_edge_someString_LONGEST_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_LONGEST_GTE\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_LONGEST_LT_SIZE
            RETURN max(aggr_edge_someString_LONGEST_LT_SIZE) < $aggr_edge_someString_LONGEST_LT
            \\", { this: this, aggr_edge_someString_LONGEST_LT: $aggr_edge_someString_LONGEST_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_LONGEST_LT\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_LONGEST_LTE_SIZE
            RETURN max(aggr_edge_someString_LONGEST_LTE_SIZE) <= $aggr_edge_someString_LONGEST_LTE
            \\", { this: this, aggr_edge_someString_LONGEST_LTE: $aggr_edge_someString_LONGEST_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_LONGEST_LTE\\": {
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_AVERAGE_EQUAL_SIZE
            RETURN avg(aggr_edge_someString_AVERAGE_EQUAL_SIZE) = toFloat($aggr_edge_someString_AVERAGE_EQUAL)
            \\", { this: this, aggr_edge_someString_AVERAGE_EQUAL: $aggr_edge_someString_AVERAGE_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_AVERAGE_EQUAL\\": 10
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_AVERAGE_GT_SIZE
            RETURN avg(aggr_edge_someString_AVERAGE_GT_SIZE) > toFloat($aggr_edge_someString_AVERAGE_GT)
            \\", { this: this, aggr_edge_someString_AVERAGE_GT: $aggr_edge_someString_AVERAGE_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_AVERAGE_GT\\": 10
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_AVERAGE_GTE_SIZE
            RETURN avg(aggr_edge_someString_AVERAGE_GTE_SIZE) >= toFloat($aggr_edge_someString_AVERAGE_GTE)
            \\", { this: this, aggr_edge_someString_AVERAGE_GTE: $aggr_edge_someString_AVERAGE_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_AVERAGE_GTE\\": 10
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_AVERAGE_LT_SIZE
            RETURN avg(aggr_edge_someString_AVERAGE_LT_SIZE) < toFloat($aggr_edge_someString_AVERAGE_LT)
            \\", { this: this, aggr_edge_someString_AVERAGE_LT: $aggr_edge_someString_AVERAGE_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_AVERAGE_LT\\": 10
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
            "MATCH (this:\`Post\`)
            WHERE apoc.cypher.runFirstColumnSingle(\\" MATCH (this)<-[aggr_edge:LIKES]-(aggr_node:User)
            WITH aggr_node, aggr_edge, size(aggr_edge.someString) AS aggr_edge_someString_AVERAGE_LTE_SIZE
            RETURN avg(aggr_edge_someString_AVERAGE_LTE_SIZE) <= toFloat($aggr_edge_someString_AVERAGE_LTE)
            \\", { this: this, aggr_edge_someString_AVERAGE_LTE: $aggr_edge_someString_AVERAGE_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_edge_someString_AVERAGE_LTE\\": 10
            }"
        `);
    });
});
