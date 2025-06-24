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

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher Aggregations where with count", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
                posts: [Post!]! @relationship(type: "HAS_POST", direction: OUT)
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

    test("Equality Count", async () => {
        const query = /* GraphQL */ `
            {
                posts {
                    likes(where: { postsConnection: { aggregate: { count: { nodes: { eq: 2 } } } } }) {
                        name
                    }
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
                WITH DISTINCT this1
                CALL (this1) {
                    MATCH (this1)-[this2:HAS_POST]->(this3:Post)
                    WITH DISTINCT this3
                    RETURN count(this3) = $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var5
            }
            RETURN this { .content, likes: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 2,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("LT Count", async () => {
        const query = /* GraphQL */ `
            {
                posts {
                    likes(where: { postsConnection: { aggregate: { count: { nodes: { lt: 10 } } } } }) {
                        name
                    }
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
                WITH DISTINCT this1
                CALL (this1) {
                    MATCH (this1)-[this2:HAS_POST]->(this3:Post)
                    WITH DISTINCT this3
                    RETURN count(this3) < $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var5
            }
            RETURN this { .content, likes: var5 } AS this"
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

    test("LTE Count", async () => {
        const query = /* GraphQL */ `
            {
                posts {
                    likes(where: { postsConnection: { aggregate: { count: { nodes: { lte: 10 } } } } }) {
                        name
                    }
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
                WITH DISTINCT this1
                CALL (this1) {
                    MATCH (this1)-[this2:HAS_POST]->(this3:Post)
                    WITH DISTINCT this3
                    RETURN count(this3) <= $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var5
            }
            RETURN this { .content, likes: var5 } AS this"
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

    test("GT Count", async () => {
        const query = /* GraphQL */ `
            {
                posts {
                    likes(where: { postsConnection: { aggregate: { count: { nodes: { gt: 10 } } } } }) {
                        name
                    }
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
                WITH DISTINCT this1
                CALL (this1) {
                    MATCH (this1)-[this2:HAS_POST]->(this3:Post)
                    WITH DISTINCT this3
                    RETURN count(this3) > $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var5
            }
            RETURN this { .content, likes: var5 } AS this"
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

    test("GTE Count", async () => {
        const query = /* GraphQL */ `
            {
                posts {
                    likes(where: { postsConnection: { aggregate: { count: { nodes: { gte: 10 } } } } }) {
                        name
                    }
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
                WITH DISTINCT this1
                CALL (this1) {
                    MATCH (this1)-[this2:HAS_POST]->(this3:Post)
                    WITH DISTINCT this3
                    RETURN count(this3) >= $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var5
            }
            RETURN this { .content, likes: var5 } AS this"
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

    test("IN Count", async () => {
        const query = /* GraphQL */ `
            {
                posts {
                    likes(where: { postsConnection: { aggregate: { count: { nodes: { in: [10, 20] } } } } }) {
                        name
                    }
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
                WITH DISTINCT this1
                CALL (this1) {
                    MATCH (this1)-[this2:HAS_POST]->(this3:Post)
                    WITH DISTINCT this3
                    RETURN count(this3) IN $param0 AS var4
                }
                WITH *
                WHERE var4 = true
                WITH this1 { .name } AS this1
                RETURN collect(this1) AS var5
            }
            RETURN this { .content, likes: var5 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": [
                    {
                        \\"low\\": 10,
                        \\"high\\": 0
                    },
                    {
                        \\"low\\": 20,
                        \\"high\\": 0
                    }
                ]
            }"
        `);
    });
});
