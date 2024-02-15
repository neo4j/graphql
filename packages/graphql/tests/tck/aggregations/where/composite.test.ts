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

import type { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("Cypher Aggregations where with count and node", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User {
                name: String!
            }

            type Post {
                content: String!
                likes: [User!]! @relationship(type: "LIKES", direction: IN, properties: "Likes")
            }

            type Likes @relationshipProperties {
                someString: String
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Equality Count and node", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { count: 10, node: { name_EQUAL: "potato" } } }) {
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
                RETURN (count(this1) = $param0 AND any(var2 IN collect(this1.name) WHERE var2 = $param1)) AS var3
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
                },
                \\"param1\\": \\"potato\\"
            }"
        `);
    });

    test("Equality Count, node and edge", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: {
                        likesAggregate: { count: 10, node: { name_EQUAL: "potato" }, edge: { someString_EQUAL: "10" } }
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
                RETURN (count(this1) = $param0 AND any(var2 IN collect(this1.name) WHERE var2 = $param1) AND any(var3 IN collect(this0.someString) WHERE var3 = $param2)) AS var4
            }
            WITH *
            WHERE var4 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": \\"potato\\",
                \\"param2\\": \\"10\\"
            }"
        `);
    });

    test("Equality Count, node, edge and logical", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: {
                        likesAggregate: {
                            count: 10
                            node: { name_EQUAL: "potato" }
                            edge: { someString_EQUAL: "10" }
                            AND: [{ count_GT: 10 }, { count_LT: 20 }]
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
                RETURN (count(this1) = $param0 AND (count(this1) > $param1 AND count(this1) < $param2) AND any(var2 IN collect(this1.name) WHERE var2 = $param3) AND any(var3 IN collect(this0.someString) WHERE var3 = $param4)) AS var4
            }
            WITH *
            WHERE var4 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param2\\": {
                    \\"low\\": 20,
                    \\"high\\": 0
                },
                \\"param3\\": \\"potato\\",
                \\"param4\\": \\"10\\"
            }"
        `);
    });
});
