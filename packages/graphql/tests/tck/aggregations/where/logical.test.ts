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

describe("Cypher Aggregations where with logical AND plus OR", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User @node {
                name: String!
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

    test("AND", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: {
                        likesConnection: {
                            aggregate: { AND: [{ count: { nodes: { gt: 10 } } }, { count: { nodes: { lt: 20 } } }] }
                        }
                    }
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
                WITH DISTINCT this1
                RETURN count(this1) > $param0 AS var2
            }
            CALL (this) {
                MATCH (this)<-[this3:LIKES]-(this4:User)
                WITH DISTINCT this4
                RETURN count(this4) < $param1 AS var5
            }
            WITH *
            WHERE (var2 = true AND var5 = true)
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("OR", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: {
                        likesConnection: {
                            aggregate: { OR: [{ count: { nodes: { gt: 10 } } }, { count: { nodes: { lt: 20 } } }] }
                        }
                    }
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
                WITH DISTINCT this1
                RETURN count(this1) > $param0 AS var2
            }
            CALL (this) {
                MATCH (this)<-[this3:LIKES]-(this4:User)
                WITH DISTINCT this4
                RETURN count(this4) < $param1 AS var5
            }
            WITH *
            WHERE (var2 = true OR var5 = true)
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("NOT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesConnection: { aggregate: { NOT: { count: { nodes: { gt: 10 } } } } } }) {
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
                RETURN count(this1) > $param0 AS var2
            }
            WITH *
            WHERE NOT (var2 = true)
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

    test("AND plus OR", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: {
                        likesConnection: {
                            aggregate: {
                                AND: [{ count: { nodes: { gt: 10 } } }, { count: { nodes: { lt: 20 } } }]
                                OR: [{ count: { nodes: { gt: 10 } } }, { count: { nodes: { lt: 20 } } }]
                            }
                        }
                    }
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
                WITH DISTINCT this1
                RETURN count(this1) > $param0 AS var2
            }
            CALL (this) {
                MATCH (this)<-[this3:LIKES]-(this4:User)
                WITH DISTINCT this4
                RETURN count(this4) < $param1 AS var5
            }
            CALL (this) {
                MATCH (this)<-[this6:LIKES]-(this7:User)
                WITH DISTINCT this7
                RETURN count(this7) > $param2 AS var8
            }
            CALL (this) {
                MATCH (this)<-[this9:LIKES]-(this10:User)
                WITH DISTINCT this10
                RETURN count(this10) < $param3 AS var11
            }
            WITH *
            WHERE ((var2 = true AND var5 = true) AND (var8 = true OR var11 = true))
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                },
                \\"param2\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param3\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("OR with multiple count", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: {
                        likesConnection: {
                            aggregate: {
                                count: { nodes: { gt: 10, lt: 20 } }
                                OR: [
                                    { count: { nodes: { gt: 10 } } }
                                    { count: { nodes: { lt: 20 } } }
                                    { count: { nodes: { lt: 54 } } }
                                ]
                            }
                        }
                    }
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
                WITH DISTINCT this1
                RETURN count(this1) > $param0 AS var2
            }
            CALL (this) {
                MATCH (this)<-[this3:LIKES]-(this4:User)
                WITH DISTINCT this4
                RETURN count(this4) < $param1 AS var5
            }
            CALL (this) {
                MATCH (this)<-[this6:LIKES]-(this7:User)
                WITH DISTINCT this7
                RETURN count(this7) > $param2 AS var8
            }
            CALL (this) {
                MATCH (this)<-[this9:LIKES]-(this10:User)
                WITH DISTINCT this10
                RETURN count(this10) < $param3 AS var11
            }
            CALL (this) {
                MATCH (this)<-[this12:LIKES]-(this13:User)
                WITH DISTINCT this13
                RETURN count(this13) < $param4 AS var14
            }
            WITH *
            WHERE (var2 = true AND var5 = true AND (var8 = true OR var11 = true OR var14 = true))
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                },
                \\"param2\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param3\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                },
                \\"param4\\": {
                    \\"low\\": 54,
                    \\"high\\": 0
                }
            }"
        `);
    });
});
