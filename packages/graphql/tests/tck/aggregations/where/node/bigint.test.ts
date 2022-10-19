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

describe("Cypher Aggregations where node with BigInt", () => {
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type User {
                someBigInt: BigInt
                someBigIntAlias: BigInt @alias(property: "_someBigIntAlias")
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
                posts(where: { likesAggregate: { node: { someBigInt_EQUAL: "2147483648" } } }) {
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
            RETURN aggr_node.someBigInt = $aggr_node_someBigInt_EQUAL
            \\", { this: this, aggr_node_someBigInt_EQUAL: $aggr_node_someBigInt_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_EQUAL\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("EQUAL with alias", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigIntAlias_EQUAL: "2147483648" } } }) {
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
            RETURN aggr_node._someBigIntAlias = $aggr_node_someBigIntAlias_EQUAL
            \\", { this: this, aggr_node_someBigIntAlias_EQUAL: $aggr_node_someBigIntAlias_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigIntAlias_EQUAL\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_GT: "2147483648" } } }) {
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
            RETURN aggr_node.someBigInt > $aggr_node_someBigInt_GT
            \\", { this: this, aggr_node_someBigInt_GT: $aggr_node_someBigInt_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_GT\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_GTE: "2147483648" } } }) {
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
            RETURN aggr_node.someBigInt >= $aggr_node_someBigInt_GTE
            \\", { this: this, aggr_node_someBigInt_GTE: $aggr_node_someBigInt_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_GTE\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_LT: "2147483648" } } }) {
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
            RETURN aggr_node.someBigInt < $aggr_node_someBigInt_LT
            \\", { this: this, aggr_node_someBigInt_LT: $aggr_node_someBigInt_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_LT\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_LTE: "2147483648" } } }) {
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
            RETURN aggr_node.someBigInt <= $aggr_node_someBigInt_LTE
            \\", { this: this, aggr_node_someBigInt_LTE: $aggr_node_someBigInt_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_LTE\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("AVERAGE_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_AVERAGE_EQUAL: "2147483648" } } }) {
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
            RETURN avg(aggr_node.someBigInt) = $aggr_node_someBigInt_AVERAGE_EQUAL
            \\", { this: this, aggr_node_someBigInt_AVERAGE_EQUAL: $aggr_node_someBigInt_AVERAGE_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_AVERAGE_EQUAL\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("AVERAGE_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_AVERAGE_GT: "2147483648" } } }) {
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
            RETURN avg(aggr_node.someBigInt) > $aggr_node_someBigInt_AVERAGE_GT
            \\", { this: this, aggr_node_someBigInt_AVERAGE_GT: $aggr_node_someBigInt_AVERAGE_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_AVERAGE_GT\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("AVERAGE_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_AVERAGE_GTE: "2147483648" } } }) {
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
            RETURN avg(aggr_node.someBigInt) >= $aggr_node_someBigInt_AVERAGE_GTE
            \\", { this: this, aggr_node_someBigInt_AVERAGE_GTE: $aggr_node_someBigInt_AVERAGE_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_AVERAGE_GTE\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("AVERAGE_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_AVERAGE_LT: "2147483648" } } }) {
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
            RETURN avg(aggr_node.someBigInt) < $aggr_node_someBigInt_AVERAGE_LT
            \\", { this: this, aggr_node_someBigInt_AVERAGE_LT: $aggr_node_someBigInt_AVERAGE_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_AVERAGE_LT\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("AVERAGE_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_AVERAGE_LTE: "2147483648" } } }) {
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
            RETURN avg(aggr_node.someBigInt) <= $aggr_node_someBigInt_AVERAGE_LTE
            \\", { this: this, aggr_node_someBigInt_AVERAGE_LTE: $aggr_node_someBigInt_AVERAGE_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_AVERAGE_LTE\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SUM_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_SUM_EQUAL: "2147483648" } } }) {
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
            RETURN sum(aggr_node.someBigInt) = toFloat($aggr_node_someBigInt_SUM_EQUAL)
            \\", { this: this, aggr_node_someBigInt_SUM_EQUAL: $aggr_node_someBigInt_SUM_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_SUM_EQUAL\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SUM_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_SUM_GT: "2147483648" } } }) {
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
            RETURN sum(aggr_node.someBigInt) > toFloat($aggr_node_someBigInt_SUM_GT)
            \\", { this: this, aggr_node_someBigInt_SUM_GT: $aggr_node_someBigInt_SUM_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_SUM_GT\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SUM_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_SUM_GTE: "2147483648" } } }) {
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
            RETURN sum(aggr_node.someBigInt) >= toFloat($aggr_node_someBigInt_SUM_GTE)
            \\", { this: this, aggr_node_someBigInt_SUM_GTE: $aggr_node_someBigInt_SUM_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_SUM_GTE\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SUM_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_SUM_LT: "2147483648" } } }) {
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
            RETURN sum(aggr_node.someBigInt) < toFloat($aggr_node_someBigInt_SUM_LT)
            \\", { this: this, aggr_node_someBigInt_SUM_LT: $aggr_node_someBigInt_SUM_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_SUM_LT\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("SUM_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_SUM_LTE: "2147483648" } } }) {
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
            RETURN sum(aggr_node.someBigInt) <= toFloat($aggr_node_someBigInt_SUM_LTE)
            \\", { this: this, aggr_node_someBigInt_SUM_LTE: $aggr_node_someBigInt_SUM_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_SUM_LTE\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("MIN_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_MIN_EQUAL: "2147483648" } } }) {
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
            RETURN  min(aggr_node.someBigInt) = $aggr_node_someBigInt_MIN_EQUAL
            \\", { this: this, aggr_node_someBigInt_MIN_EQUAL: $aggr_node_someBigInt_MIN_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_MIN_EQUAL\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("MIN_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_MIN_GT: "2147483648" } } }) {
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
            RETURN  min(aggr_node.someBigInt) > $aggr_node_someBigInt_MIN_GT
            \\", { this: this, aggr_node_someBigInt_MIN_GT: $aggr_node_someBigInt_MIN_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_MIN_GT\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("MIN_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_MIN_GTE: "2147483648" } } }) {
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
            RETURN  min(aggr_node.someBigInt) >= $aggr_node_someBigInt_MIN_GTE
            \\", { this: this, aggr_node_someBigInt_MIN_GTE: $aggr_node_someBigInt_MIN_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_MIN_GTE\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("MIN_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_MIN_LT: "2147483648" } } }) {
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
            RETURN  min(aggr_node.someBigInt) < $aggr_node_someBigInt_MIN_LT
            \\", { this: this, aggr_node_someBigInt_MIN_LT: $aggr_node_someBigInt_MIN_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_MIN_LT\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("MIN_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_MIN_LTE: "2147483648" } } }) {
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
            RETURN  min(aggr_node.someBigInt) <= $aggr_node_someBigInt_MIN_LTE
            \\", { this: this, aggr_node_someBigInt_MIN_LTE: $aggr_node_someBigInt_MIN_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_MIN_LTE\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("MAX_EQUAL", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_MAX_EQUAL: "2147483648" } } }) {
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
            RETURN  max(aggr_node.someBigInt) = $aggr_node_someBigInt_MAX_EQUAL
            \\", { this: this, aggr_node_someBigInt_MAX_EQUAL: $aggr_node_someBigInt_MAX_EQUAL })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_MAX_EQUAL\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("MAX_GT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_MAX_GT: "2147483648" } } }) {
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
            RETURN  max(aggr_node.someBigInt) > $aggr_node_someBigInt_MAX_GT
            \\", { this: this, aggr_node_someBigInt_MAX_GT: $aggr_node_someBigInt_MAX_GT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_MAX_GT\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("MAX_GTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_MAX_GTE: "2147483648" } } }) {
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
            RETURN  max(aggr_node.someBigInt) >= $aggr_node_someBigInt_MAX_GTE
            \\", { this: this, aggr_node_someBigInt_MAX_GTE: $aggr_node_someBigInt_MAX_GTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_MAX_GTE\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("MAX_LT", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_MAX_LT: "2147483648" } } }) {
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
            RETURN  max(aggr_node.someBigInt) < $aggr_node_someBigInt_MAX_LT
            \\", { this: this, aggr_node_someBigInt_MAX_LT: $aggr_node_someBigInt_MAX_LT })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_MAX_LT\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("MAX_LTE", async () => {
        const query = gql`
            {
                posts(where: { likesAggregate: { node: { someBigInt_MAX_LTE: "2147483648" } } }) {
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
            RETURN  max(aggr_node.someBigInt) <= $aggr_node_someBigInt_MAX_LTE
            \\", { this: this, aggr_node_someBigInt_MAX_LTE: $aggr_node_someBigInt_MAX_LTE })
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"aggr_node_someBigInt_MAX_LTE\\": {
                    \\"low\\": -2147483648,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
