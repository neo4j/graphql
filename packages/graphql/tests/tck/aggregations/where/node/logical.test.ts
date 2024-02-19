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
import { Neo4jGraphQL } from "../../../../../src";
import { formatCypher, translateQuery, formatParams } from "../../../utils/tck-test-utils";

describe("Cypher Aggregations where node with Logical AND + OR", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type User {
                someFloat: Float
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
                posts(
                    where: { likesAggregate: { node: { AND: [{ someFloat_EQUAL: 10 }, { someFloat_EQUAL: 11 }] } } }
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
                RETURN (any(var2 IN collect(this1.someFloat) WHERE var2 = $param0) AND any(var3 IN collect(this1.someFloat) WHERE var3 = $param1)) AS var4
            }
            WITH *
            WHERE var4 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10,
                \\"param1\\": 11
            }"
        `);
    });

    test("OR", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { OR: [{ someFloat_EQUAL: 10 }, { someFloat_EQUAL: 11 }] } } }) {
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
                RETURN (any(var2 IN collect(this1.someFloat) WHERE var2 = $param0) OR any(var3 IN collect(this1.someFloat) WHERE var3 = $param1)) AS var4
            }
            WITH *
            WHERE var4 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10,
                \\"param1\\": 11
            }"
        `);
    });

    test("NOT", async () => {
        const query = /* GraphQL */ `
            {
                posts(where: { likesAggregate: { node: { NOT: { someFloat_EQUAL: 10 } } } }) {
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
                RETURN NOT (any(var2 IN collect(this1.someFloat) WHERE var2 = $param0)) AS var3
            }
            WITH *
            WHERE var3 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10
            }"
        `);
    });

    test("OR NOT", async () => {
        const query = /* GraphQL */ `
            {
                posts(
                    where: {
                        likesAggregate: { node: { OR: [{ NOT: { someFloat_EQUAL: 10 } }, { someFloat_EQUAL: 11 }] } }
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
                RETURN (NOT (any(var2 IN collect(this1.someFloat) WHERE var2 = $param0)) OR any(var3 IN collect(this1.someFloat) WHERE var3 = $param1)) AS var4
            }
            WITH *
            WHERE var4 = true
            RETURN this { .content } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": 10,
                \\"param1\\": 11
            }"
        `);
    });
});
