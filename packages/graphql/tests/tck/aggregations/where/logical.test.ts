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
            type User {
                name: String!
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

    test("AND", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { AND: [{ count_GT: 10 }, { count_LT: 20 }] } }) {
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
                RETURN (count(this1) > $param0 AND count(this1) < $param1) AS var2
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
                posts(where: { likesAggregate: { OR: [{ count_GT: 10 }, { count_LT: 20 }] } }) {
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
                RETURN (count(this1) > $param0 OR count(this1) < $param1) AS var2
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
                posts(where: { likesAggregate: { NOT: { count_GT: 10 } } }) {
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
                RETURN NOT (count(this1) > $param0) AS var2
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

    test("AND plus OR", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: {
                        likesAggregate: {
                            AND: [{ count_GT: 10 }, { count_LT: 20 }]
                            OR: [{ count_GT: 10 }, { count_LT: 20 }]
                        }
                    }
                ) {
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
                RETURN ((count(this1) > $param0 AND count(this1) < $param1) AND (count(this1) > $param2 OR count(this1) < $param3)) AS var2
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
                        likesAggregate: {
                            count_GT: 10
                            count_LT: 20
                            OR: [{ count_GT: 10 }, { count_LT: 20 }, { count_LT: 54 }]
                        }
                    }
                ) {
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
                RETURN (count(this1) < $param0 AND count(this1) > $param1 AND (count(this1) > $param2 OR count(this1) < $param3 OR count(this1) < $param4)) AS var2
            }
            WITH *
            WHERE var2 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 10,
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
