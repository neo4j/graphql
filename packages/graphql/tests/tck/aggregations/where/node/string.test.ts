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

describe("Cypher Aggregations where node with String", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
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
            config: { enableRegex: true },
        });
    });

    test("EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_EQUAL: "10" } } }) {
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
            RETURN aggr_node.name = $aggr_node_name_EQUAL
            \\", { this: this, aggr_node_name_EQUAL: $aggr_node_name_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_EQUAL\\": \\"10\\"
            }"
        `);
    });

    test("EQUAL with alias", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someStringAlias_EQUAL: "10" } } }) {
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
            RETURN aggr_node._someStringAlias = $aggr_node_someStringAlias_EQUAL
            \\", { this: this, aggr_node_someStringAlias_EQUAL: $aggr_node_someStringAlias_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someStringAlias_EQUAL\\": \\"10\\"
            }"
        `);
    });

    test("GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_GT: 10 } } }) {
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
            RETURN size(aggr_node.name) > $aggr_node_name_GT
            \\", { this: this, aggr_node_name_GT: $aggr_node_name_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_GT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_GTE: 10 } } }) {
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
            RETURN size(aggr_node.name) >= $aggr_node_name_GTE
            \\", { this: this, aggr_node_name_GTE: $aggr_node_name_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_GTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_LT: 10 } } }) {
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
            RETURN size(aggr_node.name) < $aggr_node_name_LT
            \\", { this: this, aggr_node_name_LT: $aggr_node_name_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_LT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_LTE: 10 } } }) {
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
            RETURN size(aggr_node.name) <= $aggr_node_name_LTE
            \\", { this: this, aggr_node_name_LTE: $aggr_node_name_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_LTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SHORTEST_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_EQUAL: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_SHORTEST_EQUAL_SIZE
            RETURN min(aggr_node_name_SHORTEST_EQUAL_SIZE) = $aggr_node_name_SHORTEST_EQUAL
            \\", { this: this, aggr_node_name_SHORTEST_EQUAL: $aggr_node_name_SHORTEST_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_SHORTEST_EQUAL\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SHORTEST_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_GT: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_SHORTEST_GT_SIZE
            RETURN min(aggr_node_name_SHORTEST_GT_SIZE) > $aggr_node_name_SHORTEST_GT
            \\", { this: this, aggr_node_name_SHORTEST_GT: $aggr_node_name_SHORTEST_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_SHORTEST_GT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SHORTEST_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_GTE: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_SHORTEST_GTE_SIZE
            RETURN min(aggr_node_name_SHORTEST_GTE_SIZE) >= $aggr_node_name_SHORTEST_GTE
            \\", { this: this, aggr_node_name_SHORTEST_GTE: $aggr_node_name_SHORTEST_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_SHORTEST_GTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SHORTEST_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_LT: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_SHORTEST_LT_SIZE
            RETURN min(aggr_node_name_SHORTEST_LT_SIZE) < $aggr_node_name_SHORTEST_LT
            \\", { this: this, aggr_node_name_SHORTEST_LT: $aggr_node_name_SHORTEST_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_SHORTEST_LT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SHORTEST_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_SHORTEST_LTE: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_SHORTEST_LTE_SIZE
            RETURN min(aggr_node_name_SHORTEST_LTE_SIZE) <= $aggr_node_name_SHORTEST_LTE
            \\", { this: this, aggr_node_name_SHORTEST_LTE: $aggr_node_name_SHORTEST_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_SHORTEST_LTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LONGEST_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_EQUAL: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_LONGEST_EQUAL_SIZE
            RETURN max(aggr_node_name_LONGEST_EQUAL_SIZE) = $aggr_node_name_LONGEST_EQUAL
            \\", { this: this, aggr_node_name_LONGEST_EQUAL: $aggr_node_name_LONGEST_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_LONGEST_EQUAL\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LONGEST_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_GT: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_LONGEST_GT_SIZE
            RETURN max(aggr_node_name_LONGEST_GT_SIZE) > $aggr_node_name_LONGEST_GT
            \\", { this: this, aggr_node_name_LONGEST_GT: $aggr_node_name_LONGEST_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_LONGEST_GT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LONGEST_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_GTE: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_LONGEST_GTE_SIZE
            RETURN max(aggr_node_name_LONGEST_GTE_SIZE) >= $aggr_node_name_LONGEST_GTE
            \\", { this: this, aggr_node_name_LONGEST_GTE: $aggr_node_name_LONGEST_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_LONGEST_GTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LONGEST_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_LT: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_LONGEST_LT_SIZE
            RETURN max(aggr_node_name_LONGEST_LT_SIZE) < $aggr_node_name_LONGEST_LT
            \\", { this: this, aggr_node_name_LONGEST_LT: $aggr_node_name_LONGEST_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_LONGEST_LT\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LONGEST_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_LONGEST_LTE: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_LONGEST_LTE_SIZE
            RETURN max(aggr_node_name_LONGEST_LTE_SIZE) <= $aggr_node_name_LONGEST_LTE
            \\", { this: this, aggr_node_name_LONGEST_LTE: $aggr_node_name_LONGEST_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_LONGEST_LTE\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("AVERAGE_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_EQUAL: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_AVERAGE_EQUAL_SIZE
            RETURN avg(aggr_node_name_AVERAGE_EQUAL_SIZE) = toFloat($aggr_node_name_AVERAGE_EQUAL)
            \\", { this: this, aggr_node_name_AVERAGE_EQUAL: $aggr_node_name_AVERAGE_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_AVERAGE_EQUAL\\": 10
            }"
        `);
    });

    test("AVERAGE_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_GT: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_AVERAGE_GT_SIZE
            RETURN avg(aggr_node_name_AVERAGE_GT_SIZE) > toFloat($aggr_node_name_AVERAGE_GT)
            \\", { this: this, aggr_node_name_AVERAGE_GT: $aggr_node_name_AVERAGE_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_AVERAGE_GT\\": 10
            }"
        `);
    });

    test("AVERAGE_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_GTE: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_AVERAGE_GTE_SIZE
            RETURN avg(aggr_node_name_AVERAGE_GTE_SIZE) >= toFloat($aggr_node_name_AVERAGE_GTE)
            \\", { this: this, aggr_node_name_AVERAGE_GTE: $aggr_node_name_AVERAGE_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_AVERAGE_GTE\\": 10
            }"
        `);
    });

    test("AVERAGE_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_LT: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_AVERAGE_LT_SIZE
            RETURN avg(aggr_node_name_AVERAGE_LT_SIZE) < toFloat($aggr_node_name_AVERAGE_LT)
            \\", { this: this, aggr_node_name_AVERAGE_LT: $aggr_node_name_AVERAGE_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_AVERAGE_LT\\": 10
            }"
        `);
    });

    test("AVERAGE_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { name_AVERAGE_LTE: 10 } } }) {
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
            WITH aggr_node, aggr_edge, size(aggr_node.name) AS aggr_node_name_AVERAGE_LTE_SIZE
            RETURN avg(aggr_node_name_AVERAGE_LTE_SIZE) <= toFloat($aggr_node_name_AVERAGE_LTE)
            \\", { this: this, aggr_node_name_AVERAGE_LTE: $aggr_node_name_AVERAGE_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_name_AVERAGE_LTE\\": 10
            }"
        `);
    });
});
